from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Appointment, Doctor, Patient, Queue
from security import get_current_admin

from schemas import AdminDashboardStatisticsResponse

router = APIRouter(
    prefix="/admin/dashboard",
    tags=["Admin Dashboard"],
)


@router.get(
    "/statistics",
    response_model=AdminDashboardStatisticsResponse,
)
def get_admin_statistics(
    current_admin=Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    total_patients = db.query(Patient).count()
    total_doctors = db.query(Doctor).count()

    appointments_today = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date == date.today()
        )
        .count()
    )

    active_queue = (
        db.query(Queue)
        .filter(
            Queue.status.in_(
                [
                    "Waiting",
                    "Checked In",
                    "In Consultation",
                ]
            )
        )
        .count()
    )

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "appointments_today": appointments_today,
        "active_queue": active_queue,
    }