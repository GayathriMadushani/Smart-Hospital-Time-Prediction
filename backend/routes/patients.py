from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Patient
from schemas import PatientCreate, PatientResponse
from security import get_current_patient, hash_password


router = APIRouter(
    prefix="/patients",
    tags=["Patients"],
)


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient(
    data: PatientCreate,
    db: Session = Depends(get_db),
):
    existing_patient = (
        db.query(Patient)
        .filter(Patient.email == data.email)
        .first()
    )

    if existing_patient is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    patient = Patient(
        name=data.name,
        age=data.age,
        gender=data.gender,
        phone=data.phone,
        email=data.email,
        password=hash_password(data.password),
    )

    try:
        db.add(patient)
        db.commit()
        db.refresh(patient)

        return patient

    except Exception:
        db.rollback()
        raise


@router.get(
    "/me",
    response_model=PatientResponse,
)
def get_my_profile(
    current_patient: Patient = Depends(
        get_current_patient
    ),
):
    return current_patient