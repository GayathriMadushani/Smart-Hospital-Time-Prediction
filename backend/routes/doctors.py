from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from models import Admin, Appointment, Doctor
from schemas import DoctorCreate, DoctorResponse, DoctorUpdate
from security import get_current_admin


router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"],
)


# =========================================================
# Admin: Create doctor
# =========================================================

@router.post(
    "",
    response_model=DoctorResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_doctor(
    data: DoctorCreate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    if (
        data.available_start_time is not None
        and data.available_end_time is not None
        and data.available_start_time >= data.available_end_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Available start time must be before end time",
        )

    if data.experience_years < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Experience years cannot be negative",
        )

    if data.consultation_fee < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation fee cannot be negative",
        )

    if data.average_consultation_minutes <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Average consultation minutes must be "
                "greater than zero"
            ),
        )

    doctor = Doctor(
        name=data.name.strip(),
        specialization=data.specialization.strip(),
        qualification=(
            data.qualification.strip()
            if data.qualification
            else None
        ),
        experience_years=data.experience_years,
        hospital=(
            data.hospital.strip()
            if data.hospital
            else None
        ),
        available_days=(
            data.available_days.strip()
            if data.available_days
            else None
        ),
        available_start_time=data.available_start_time,
        available_end_time=data.available_end_time,
        consultation_fee=data.consultation_fee,
        average_consultation_minutes=(
            data.average_consultation_minutes
        ),
    )

    try:
        db.add(doctor)
        db.commit()
        db.refresh(doctor)

        return doctor

    except Exception:
        db.rollback()
        raise


# =========================================================
# Public: View and search doctors
# =========================================================

@router.get(
    "",
    response_model=list[DoctorResponse],
)
def get_doctors(
    specialization: str | None = Query(
        default=None,
        description="Filter doctors by specialization",
    ),
    hospital: str | None = Query(
        default=None,
        description="Filter doctors by hospital",
    ),
    search: str | None = Query(
        default=None,
        description=(
            "Search by doctor name, specialization, "
            "qualification, or hospital"
        ),
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Doctor)

    if specialization:
        specialization_value = specialization.strip()

        if specialization_value:
            query = query.filter(
                Doctor.specialization.ilike(
                    f"%{specialization_value}%"
                )
            )

    if hospital:
        hospital_value = hospital.strip()

        if hospital_value:
            query = query.filter(
                Doctor.hospital.ilike(
                    f"%{hospital_value}%"
                )
            )

    if search:
        search_value = search.strip()

        if search_value:
            search_pattern = f"%{search_value}%"

            query = query.filter(
                Doctor.name.ilike(search_pattern)
                | Doctor.specialization.ilike(search_pattern)
                | Doctor.qualification.ilike(search_pattern)
                | Doctor.hospital.ilike(search_pattern)
            )

    return query.order_by(Doctor.name.asc()).all()


# =========================================================
# Public: View one doctor
# =========================================================

@router.get(
    "/{doctor_id}",
    response_model=DoctorResponse,
)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(Doctor.doctor_id == doctor_id)
        .first()
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    return doctor


# =========================================================
# Admin: Update doctor
# =========================================================

@router.put(
    "/{doctor_id}",
    response_model=DoctorResponse,
)
def update_doctor(
    doctor_id: int,
    data: DoctorUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(Doctor.doctor_id == doctor_id)
        .first()
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    start_time = update_data.get(
        "available_start_time",
        doctor.available_start_time,
    )

    end_time = update_data.get(
        "available_end_time",
        doctor.available_end_time,
    )

    if (
        start_time is not None
        and end_time is not None
        and start_time >= end_time
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Available start time must be before end time",
        )

    experience_years = update_data.get(
        "experience_years",
        doctor.experience_years,
    )

    consultation_fee = update_data.get(
        "consultation_fee",
        doctor.consultation_fee,
    )

    average_consultation_minutes = update_data.get(
        "average_consultation_minutes",
        doctor.average_consultation_minutes,
    )

    if experience_years is not None and experience_years < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Experience years cannot be negative",
        )

    if consultation_fee is not None and consultation_fee < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Consultation fee cannot be negative",
        )

    if (
        average_consultation_minutes is not None
        and average_consultation_minutes <= 0
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Average consultation minutes must be "
                "greater than zero"
            ),
        )

    text_fields = {
        "name",
        "specialization",
        "qualification",
        "hospital",
        "available_days",
    }

    for field, value in update_data.items():
        if field in text_fields and isinstance(value, str):
            value = value.strip() or None

        setattr(doctor, field, value)

    if not doctor.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor name cannot be empty",
        )

    if not doctor.specialization:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor specialization cannot be empty",
        )

    try:
        db.commit()
        db.refresh(doctor)

        return doctor

    except Exception:
        db.rollback()
        raise


# =========================================================
# Admin: Delete doctor
# =========================================================

@router.delete(
    "/{doctor_id}",
    status_code=status.HTTP_200_OK,
)
def delete_doctor(
    doctor_id: int,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    doctor = (
        db.query(Doctor)
        .filter(Doctor.doctor_id == doctor_id)
        .first()
    )

    if doctor is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    linked_appointments = (
        db.query(Appointment)
        .filter(Appointment.doctor_id == doctor_id)
        .count()
    )

    if linked_appointments > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This doctor cannot be deleted because "
                f"{linked_appointments} appointment(s) are linked "
                "to the doctor"
            ),
        )

    try:
        db.delete(doctor)
        db.commit()

        return {
            "message": "Doctor deleted successfully",
            "doctor_id": doctor_id,
        }

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This doctor cannot be deleted because related "
                "hospital records exist"
            ),
        )

    except Exception:
        db.rollback()
        raise