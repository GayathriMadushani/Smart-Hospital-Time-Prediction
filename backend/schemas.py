from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr


# =========================================================
# Authentication schemas
# =========================================================

class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str


# =========================================================
# Patient schemas
# =========================================================

class PatientProfileResponse(BaseModel):
    patient_id: int
    name: str
    age: int
    gender: str
    phone: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: str
    email: EmailStr
    password: str


class PatientResponse(BaseModel):
    patient_id: int
    name: str
    age: int
    gender: str
    phone: str
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Admin schemas
# =========================================================

class AdminResponse(BaseModel):
    admin_id: int
    name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminDashboardStatisticsResponse(BaseModel):
    total_patients: int
    total_doctors: int
    appointments_today: int
    active_queue: int


# =========================================================
# Doctor schemas
# =========================================================

class DoctorCreate(BaseModel):
    name: str
    specialization: str
    qualification: Optional[str] = None
    experience_years: int = 0
    hospital: Optional[str] = None
    available_days: Optional[str] = None
    available_start_time: Optional[time] = None
    available_end_time: Optional[time] = None
    consultation_fee: Decimal = Decimal("0.00")
    average_consultation_minutes: int = 15


class DoctorUpdate(BaseModel):
    name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    hospital: Optional[str] = None
    available_days: Optional[str] = None
    available_start_time: Optional[time] = None
    available_end_time: Optional[time] = None
    consultation_fee: Optional[Decimal] = None
    average_consultation_minutes: Optional[int] = None


class DoctorResponse(BaseModel):
    doctor_id: int
    name: str
    specialization: str
    qualification: Optional[str] = None
    experience_years: int
    hospital: Optional[str] = None
    available_days: Optional[str] = None
    available_start_time: Optional[time] = None
    available_end_time: Optional[time] = None
    consultation_fee: Decimal
    average_consultation_minutes: int

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Appointment schemas
# =========================================================

class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = None


class AppointmentBookingCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = None


class AppointmentResponse(BaseModel):
    appointment_id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Queue schemas
# =========================================================

class QueueResponse(BaseModel):
    queue_id: int
    appointment_id: int
    doctor_id: int
    queue_date: date
    queue_number: int
    status: str
    check_in_time: Optional[datetime] = None
    consultation_start_time: Optional[datetime] = None
    consultation_end_time: Optional[datetime] = None
    actual_waiting_minutes: Optional[int] = None
    actual_consultation_minutes: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# Prediction schemas
# =========================================================

class WaitingTimePredictionResponse(BaseModel):
    queue_id: int
    appointment_id: int
    doctor_id: int
    queue_number: int
    estimated_waiting_minutes: float
    estimated_consultation_minutes: float
    estimated_consultation_start: datetime
    estimated_consultation_end: datetime