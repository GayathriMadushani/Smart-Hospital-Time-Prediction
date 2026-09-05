from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
)
from sqlalchemy.orm import relationship

from database import Base


class Patient(Base):
    __tablename__ = "patients"

    patient_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    age = Column(
        Integer,
        nullable=False,
    )

    gender = Column(
        String(20),
        nullable=False,
    )

    phone = Column(
        String(20),
        unique=True,
        nullable=False,
    )

    email = Column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )

    password = Column(
        String(255),
        nullable=False,
    )

    appointments = relationship(
        "Appointment",
        back_populates="patient",
        cascade="all, delete-orphan",
    )


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    email = Column(
        String(150),
        unique=True,
        index=True,
        nullable=False,
    )

    password = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        String(50),
        nullable=False,
        default="Admin",
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(100),
        nullable=False,
    )

    specialization = Column(
        String(100),
        nullable=False,
    )

    qualification = Column(
        String(150),
        nullable=True,
    )

    experience_years = Column(
        Integer,
        default=0,
        nullable=False,
    )

    hospital = Column(
        String(150),
        nullable=True,
    )

    availability = Column(
        String(150),
        nullable=True,
    )

    available_days = Column(
        String(150),
        nullable=True,
    )

    available_start_time = Column(
        Time,
        nullable=True,
    )

    available_end_time = Column(
        Time,
        nullable=True,
    )

    consultation_fee = Column(
        Numeric(10, 2),
        default=0,
        nullable=False,
    )

    average_consultation_minutes = Column(
        Integer,
        default=15,
        nullable=False,
    )

    appointments = relationship(
        "Appointment",
        back_populates="doctor",
        cascade="all, delete-orphan",
    )

    queue_entries = relationship(
        "Queue",
        back_populates="doctor",
    )


class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    patient_id = Column(
        Integer,
        ForeignKey(
            "patients.patient_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    doctor_id = Column(
        Integer,
        ForeignKey(
            "doctors.doctor_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    appointment_date = Column(
        Date,
        nullable=False,
    )

    appointment_time = Column(
        Time,
        nullable=False,
    )

    status = Column(
        String(30),
        default="Pending",
        nullable=False,
    )

    reason = Column(
        Text,
        nullable=True,
    )

    patient = relationship(
        "Patient",
        back_populates="appointments",
    )

    doctor = relationship(
        "Doctor",
        back_populates="appointments",
    )

    consultation = relationship(
        "Consultation",
        back_populates="appointment",
        uselist=False,
        cascade="all, delete-orphan",
    )

    queue_entry = relationship(
        "Queue",
        back_populates="appointment",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Consultation(Base):
    __tablename__ = "consultations"

    consultation_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    appointment_id = Column(
        Integer,
        ForeignKey(
            "appointments.appointment_id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
    )

    diagnosis = Column(
        Text,
        nullable=True,
    )

    prescription = Column(
        Text,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    appointment = relationship(
        "Appointment",
        back_populates="consultation",
    )


class Queue(Base):
    __tablename__ = "queue"

    queue_id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    appointment_id = Column(
        Integer,
        ForeignKey(
            "appointments.appointment_id",
            ondelete="CASCADE",
        ),
        unique=True,
        nullable=False,
    )

    doctor_id = Column(
        Integer,
        ForeignKey(
            "doctors.doctor_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    queue_date = Column(
        Date,
        nullable=False,
    )

    queue_number = Column(
        Integer,
        nullable=False,
    )

    status = Column(
        String(30),
        default="Waiting",
        nullable=False,
    )

    check_in_time = Column(
        DateTime,
        nullable=True,
    )

    consultation_start_time = Column(
        DateTime,
        nullable=True,
    )

    consultation_end_time = Column(
        DateTime,
        nullable=True,
    )

    actual_waiting_minutes = Column(
        Integer,
        nullable=True,
    )

    actual_consultation_minutes = Column(
        Integer,
        nullable=True,
    )

    appointment = relationship(
        "Appointment",
        back_populates="queue_entry",
    )

    doctor = relationship(
        "Doctor",
        back_populates="queue_entries",
    )