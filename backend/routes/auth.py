from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import Patient
from schemas import PatientProfileResponse, TokenResponse
from security import (
    create_access_token,
    get_current_patient,
    verify_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username.strip().lower()

    patient = (
        db.query(Patient)
       .filter(func.lower(Patient.email) == email)
        .first()
    )

    if patient is None or not verify_password(
        form_data.password,
        patient.password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        subject=str(patient.patient_id),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=PatientProfileResponse)
def get_my_profile(
    current_patient: Patient = Depends(get_current_patient),
):
    return current_patient
