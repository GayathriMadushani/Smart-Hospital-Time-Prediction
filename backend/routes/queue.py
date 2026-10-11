
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, Patient, Queue
from schemas import QueueResponse
from security import get_current_admin, get_current_patient


router = APIRouter(
    prefix="/queue",
    tags=["Queue"],
)


# ---------------------------------------
# 1. PATIENT - VIEW OWN QUEUE
# ---------------------------------------

@router.get(
    "/me",
    response_model=list[QueueResponse],
)
def get_my_queue_entries(
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    return (
        db.query(Queue)
        .join(
            Appointment,
            Queue.appointment_id == Appointment.appointment_id,
        )
        .filter(
            Appointment.patient_id == current_patient.patient_id
        )
        .order_by(
            Queue.queue_date.asc(),
            Queue.queue_number.asc(),
        )
        .all()
    )


# ---------------------------------------
# 2. ADMIN - VIEW ALL QUEUE ENTRIES
# ---------------------------------------

@router.get(
    "",
    response_model=list[QueueResponse],
)
def get_all_queue_entries(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return (
        db.query(Queue)
        .order_by(
            Queue.queue_date.desc(),
            Queue.doctor_id.asc(),
            Queue.queue_number.asc(),
        )
        .all()
    )


# ---------------------------------------
# 3. PATIENT - CHECK IN
# ---------------------------------------

@router.patch(
    "/{queue_id}/check-in",
    response_model=QueueResponse,
)
def check_in_to_queue(
    queue_id: int,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    queue_entry = (
        db.query(Queue)
        .join(
            Appointment,
            Queue.appointment_id == Appointment.appointment_id,
        )
        .filter(
            Queue.queue_id == queue_id,
            Appointment.patient_id == current_patient.patient_id,
        )
        .first()
    )

    if queue_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found",
        )

    if queue_entry.status == "Cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled appointment cannot check in",
        )

    if queue_entry.status == "Completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed consultation cannot check in",
        )

    if queue_entry.queue_date != date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in is allowed only on the appointment date",
        )

    if queue_entry.check_in_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient is already checked in",
        )

    queue_entry.check_in_time = datetime.now()
    queue_entry.status = "Checked In"

    db.commit()
    db.refresh(queue_entry)

    return queue_entry


# ---------------------------------------
# 4. ADMIN - START CONSULTATION
# ---------------------------------------

@router.patch(
    "/{queue_id}/start",
    response_model=QueueResponse,
)
def start_consultation(
    queue_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    queue_entry = (
        db.query(Queue)
        .filter(Queue.queue_id == queue_id)
        .first()
    )

    if queue_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found",
        )

    if queue_entry.status != "Checked In":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient must be checked in first",
        )

    if queue_entry.check_in_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-in time is missing",
        )

    if queue_entry.consultation_start_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation has already started",
        )

    if queue_entry.queue_date != date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation can only start on its scheduled date",
        )

    queue_entry.consultation_start_time = datetime.now()
    queue_entry.status = "In Consultation"

    waiting_duration = (
        queue_entry.consultation_start_time
        - queue_entry.check_in_time
    )

    queue_entry.actual_waiting_minutes = max(
        0,
        int(waiting_duration.total_seconds() // 60),
    )

    db.commit()
    db.refresh(queue_entry)

    return queue_entry


# ---------------------------------------
# 5. ADMIN - COMPLETE CONSULTATION
# ---------------------------------------

@router.patch(
    "/{queue_id}/complete",
    response_model=QueueResponse,
)
def complete_consultation(
    queue_id: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    queue_entry = (
        db.query(Queue)
        .filter(Queue.queue_id == queue_id)
        .first()
    )

    if queue_entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found",
        )

    if queue_entry.status != "In Consultation":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation must be started before completion",
        )

    if queue_entry.consultation_start_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation has not started",
        )

    if queue_entry.consultation_end_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation is already completed",
        )

    queue_entry.consultation_end_time = datetime.now()
    queue_entry.status = "Completed"

    consultation_duration = (
        queue_entry.consultation_end_time
        - queue_entry.consultation_start_time
    )

    queue_entry.actual_consultation_minutes = max(
        0,
        int(consultation_duration.total_seconds() // 60),
    )

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_id == queue_entry.appointment_id
        )
        .first()
    )

    if appointment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked appointment not found",
        )

    appointment.status = "Completed"

    db.commit()
    db.refresh(queue_entry)

    return queue_entry
