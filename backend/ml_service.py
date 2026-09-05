from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent.parent
ML_DIR = BASE_DIR / "machine_learning"

WAITING_MODEL_PATH = ML_DIR / "waiting_time_model.pkl"
CONSULTATION_MODEL_PATH = ML_DIR / "consultation_time_model.pkl"


if not WAITING_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Waiting-time model not found: {WAITING_MODEL_PATH}"
    )

if not CONSULTATION_MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Consultation-time model not found: {CONSULTATION_MODEL_PATH}"
    )


waiting_time_model = joblib.load(WAITING_MODEL_PATH)
consultation_time_model = joblib.load(CONSULTATION_MODEL_PATH)


def build_input_data(
    doctor_id: int,
    queue_number: int,
    appointment_hour: int,
    day_of_week: int,
    average_consultation_minutes: int,
) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "doctor_id": doctor_id,
                "queue_number": queue_number,
                "appointment_hour": appointment_hour,
                "day_of_week": day_of_week,
                "average_consultation_minutes": (
                    average_consultation_minutes
                ),
            }
        ]
    )


def predict_waiting_time(
    doctor_id: int,
    queue_number: int,
    appointment_hour: int,
    day_of_week: int,
    average_consultation_minutes: int,
) -> float:
    input_data = build_input_data(
        doctor_id=doctor_id,
        queue_number=queue_number,
        appointment_hour=appointment_hour,
        day_of_week=day_of_week,
        average_consultation_minutes=average_consultation_minutes,
    )

    prediction = waiting_time_model.predict(input_data)[0]

    return round(max(0, float(prediction)), 2)


def predict_consultation_time(
    doctor_id: int,
    queue_number: int,
    appointment_hour: int,
    day_of_week: int,
    average_consultation_minutes: int,
) -> float:
    input_data = build_input_data(
        doctor_id=doctor_id,
        queue_number=queue_number,
        appointment_hour=appointment_hour,
        day_of_week=day_of_week,
        average_consultation_minutes=average_consultation_minutes,
    )

    prediction = consultation_time_model.predict(input_data)[0]

    return round(max(1, float(prediction)), 2)