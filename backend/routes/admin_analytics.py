from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, Doctor, Queue
from security import get_current_admin
from ml_service import (
    predict_waiting_time,
    predict_consultation_time,
)

router = APIRouter(
    prefix="/admin/analytics",
    tags=["Admin AI Analytics"],
)

MODEL_METRICS = {
    "waiting_time": {
        "mae": 2.66,
        "rmse": 3.97,
        "r2": 0.9954,
    },
    "consultation_time": {
        "mae": 1.18,
        "rmse": 1.39,
        "r2": 0.9021,
    },
}


@router.get("/ai")
def get_ai_analytics(
    current_admin=Depends(get_current_admin),
):
    return {
        "message": "AI analytics loaded successfully",
        "model_type": "Random Forest Regressor",
        "waiting_time": MODEL_METRICS["waiting_time"],
        "consultation_time": MODEL_METRICS["consultation_time"],
    }


@router.get("/comparison")
def get_prediction_comparison(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    records = (
        db.query(Queue, Appointment, Doctor)
        .join(
            Appointment,
            Queue.appointment_id == Appointment.appointment_id,
        )
        .join(
            Doctor,
            Appointment.doctor_id == Doctor.doctor_id,
        )
        .filter(
            Queue.status == "Completed",
            Queue.actual_waiting_minutes.isnot(None),
            Queue.actual_consultation_minutes.isnot(None),
        )
        .order_by(Queue.queue_date.desc())
        .all()
    )

    comparisons = []

    for queue, appointment, doctor in records:
        features = {
            "doctor_id": doctor.doctor_id,
            "queue_number": queue.queue_number,
            "appointment_hour": appointment.appointment_time.hour,
            "day_of_week": appointment.appointment_date.weekday(),
            "average_consultation_minutes": (
                doctor.average_consultation_minutes
            ),
        }

        predicted_waiting = predict_waiting_time(**features)
        predicted_consultation = predict_consultation_time(**features)

        comparisons.append({
            "queue_id": queue.queue_id,
            "appointment_id": appointment.appointment_id,
            "doctor_name": doctor.name,
            "appointment_date": str(appointment.appointment_date),
            "predicted_waiting_minutes": predicted_waiting,
            "actual_waiting_minutes": queue.actual_waiting_minutes,
            "predicted_consultation_minutes": predicted_consultation,
            "actual_consultation_minutes": (
                queue.actual_consultation_minutes
            ),
        })

    return {
        "total_completed": len(comparisons),
        "comparisons": comparisons,
    }