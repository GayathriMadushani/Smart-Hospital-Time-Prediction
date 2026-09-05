from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from ml_service import (
    predict_consultation_time,
    predict_waiting_time,
)
from models import Appointment, Doctor, Patient, Queue
from schemas import WaitingTimePredictionResponse
from security import get_current_patient


router = APIRouter(
    prefix="/predictions",
    tags=["Predictions"],
)


@router.get(
    "/queue/{queue_id}",
    response_model=WaitingTimePredictionResponse,
)
def predict_queue_times(
    queue_id: int,
    current_patient: Patient = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    result = (
        db.query(Queue, Appointment, Doctor)
        .join(
            Appointment,
            Queue.appointment_id == Appointment.appointment_id,
        )
        .join(
            Doctor,
            Queue.doctor_id == Doctor.doctor_id,
        )
        .filter(
            Queue.queue_id == queue_id,
            Appointment.patient_id == current_patient.patient_id,
        )
        .first()
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Queue entry not found",
        )

    queue_entry, appointment, doctor = result

    appointment_hour = appointment.appointment_time.hour
    day_of_week = appointment.appointment_date.weekday()

    model_inputs = {
        "doctor_id": doctor.doctor_id,
        "queue_number": queue_entry.queue_number,
        "appointment_hour": appointment_hour,
        "day_of_week": day_of_week,
        "average_consultation_minutes": (
            doctor.average_consultation_minutes
        ),
    }

    estimated_waiting_minutes = predict_waiting_time(
        **model_inputs
    )

    estimated_consultation_minutes = (
        predict_consultation_time(**model_inputs)
    )

    scheduled_datetime = datetime.combine(
        appointment.appointment_date,
        appointment.appointment_time,
    )

    estimated_start = scheduled_datetime + timedelta(
        minutes=estimated_waiting_minutes
    )

    estimated_end = estimated_start + timedelta(
        minutes=estimated_consultation_minutes
    )

    return {
        "queue_id": queue_entry.queue_id,
        "appointment_id": appointment.appointment_id,
        "doctor_id": doctor.doctor_id,
        "queue_number": queue_entry.queue_number,
        "estimated_waiting_minutes": estimated_waiting_minutes,
        "estimated_consultation_minutes": (
            estimated_consultation_minutes
        ),
        "estimated_consultation_start": estimated_start,
        "estimated_consultation_end": estimated_end,
    }