from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, Patient, Queue
from schemas import QueueResponse
from security import get_current_patient


router = APIRouter(
    prefix="/queue",
    tags=["Queue"],
)


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


@router.patch(
    "/{queue_id}/start",
    response_model=QueueResponse,
)
def start_consultation(
    queue_id: int,
    db: Session = Depends(get_db),
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

    if queue_entry.check_in_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient must check in first",
        )

    if queue_entry.consultation_start_time is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation has already started",
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


@router.patch(
    "/{queue_id}/complete",
    response_model=QueueResponse,
)
def complete_consultation(
    queue_id: int,
    db: Session = Depends(get_db),
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

    db.commit()
    db.refresh(queue_entry)

    return queue_entry