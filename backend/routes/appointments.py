from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, Doctor, Patient, Queue
from schemas import AppointmentBookingCreate, AppointmentResponse
from security import get_current_patient, get_current_admin

router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"],
)


@router.post(
    "",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_appointment(
    data: AppointmentBookingCreate,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    if data.appointment_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment date cannot be in the past",
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.doctor_id == data.doctor_id)
        .first()
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    # Check whether the doctor works on the selected day.
    appointment_day = data.appointment_date.strftime("%A")

    if doctor.available_days:
        allowed_days = [
            day.strip().lower()
            for day in doctor.available_days.split(",")
            if day.strip()
        ]

        if appointment_day.lower() not in allowed_days:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Doctor is not available on {appointment_day}",
            )

    # Check whether the selected time is inside the doctor's schedule.
    if (
        doctor.available_start_time is not None
        and data.appointment_time < doctor.available_start_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment time is before doctor availability",
        )

    if (
        doctor.available_end_time is not None
        and data.appointment_time >= doctor.available_end_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment time is outside doctor availability",
        )

    # Prevent duplicate bookings for the same doctor, date, and time.
    existing_appointment = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == data.doctor_id,
            Appointment.appointment_date == data.appointment_date,
            Appointment.appointment_time == data.appointment_time,
            Appointment.status != "Cancelled",
        )
        .first()
    )

    if existing_appointment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This doctor is already booked for that time",
        )

    appointment = Appointment(
        patient_id=current_patient.patient_id,
        doctor_id=data.doctor_id,
        appointment_date=data.appointment_date,
        appointment_time=data.appointment_time,
        reason=data.reason,
        status="Pending",
    )

    try:
        db.add(appointment)
        db.flush()

        last_queue_entry = (
            db.query(Queue)
            .filter(
                Queue.doctor_id == data.doctor_id,
                Queue.queue_date == data.appointment_date,
            )
            .order_by(Queue.queue_number.desc())
            .first()
        )

        next_queue_number = 1

        if last_queue_entry is not None:
            next_queue_number = last_queue_entry.queue_number + 1

        queue_entry = Queue(
            appointment_id=appointment.appointment_id,
            doctor_id=data.doctor_id,
            queue_date=data.appointment_date,
            queue_number=next_queue_number,
            status="Waiting",
        )

        db.add(queue_entry)
        db.commit()
        db.refresh(appointment)

        return appointment

    except Exception:
        db.rollback()
        raise


@router.get(
    "/me",
    response_model=list[AppointmentResponse],
)
def get_my_appointments(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return (
        db.query(Appointment)
        .filter(
            Appointment.patient_id == current_patient.patient_id
        )
        .order_by(
            Appointment.appointment_date.asc(),
            Appointment.appointment_time.asc(),
        )
        .all()
    )


@router.patch("/{appointment_id}/cancel")
def cancel_my_appointment(
    appointment_id: int,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_id == appointment_id,
            Appointment.patient_id == current_patient.patient_id,
        )
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    if appointment.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Appointment is already cancelled",
        )

    if appointment.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed appointment cannot be cancelled",
        )

    appointment.status = "Cancelled"

    queue_entry = (
        db.query(Queue)
        .filter(
            Queue.appointment_id == appointment.appointment_id
        )
        .first()
    )

    if queue_entry is not None:
        queue_entry.status = "Cancelled"

    db.commit()
    db.refresh(appointment)

    return {
        "message": "Appointment cancelled successfully",
        "appointment_id": appointment.appointment_id,
        "status": appointment.status,
    }

# ---------------------------------------
# ADMIN - GET ALL APPOINTMENTS
# ---------------------------------------

@router.get(
    "",
    response_model=list[AppointmentResponse],
)
def get_all_appointments(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    appointments = (
        db.query(Appointment)
        .order_by(
            Appointment.appointment_date.desc(),
            Appointment.appointment_time.desc(),
        )
        .all()
    )

    return appointments