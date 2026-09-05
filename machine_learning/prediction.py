import os

import joblib
import pandas as pd


BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "waiting_time_model.pkl",
)

model = joblib.load(MODEL_PATH)


def predict_waiting_time(
    doctor_id: int,
    queue_number: int,
    appointment_hour: int,
    day_of_week: int,
    average_consultation_minutes: int,
) -> float:
    data = pd.DataFrame(
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

    prediction = model.predict(data)[0]

    return round(max(0, float(prediction)), 2)


if __name__ == "__main__":
    result = predict_waiting_time(
        doctor_id=1,
        queue_number=4,
        appointment_hour=10,
        day_of_week=1,
        average_consultation_minutes=18,
    )

    print(
        "Predicted waiting time:",
        result,
        "minutes",
    )