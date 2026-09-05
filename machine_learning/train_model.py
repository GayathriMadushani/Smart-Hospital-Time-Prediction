from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset.csv"

WAITING_MODEL_PATH = BASE_DIR / "waiting_time_model.pkl"
CONSULTATION_MODEL_PATH = BASE_DIR / "consultation_time_model.pkl"


# Load dataset
data = pd.read_csv(DATASET_PATH)


# Input features used by both models
feature_columns = [
    "doctor_id",
    "queue_number",
    "appointment_hour",
    "day_of_week",
    "average_consultation_minutes",
]

X = data[feature_columns]


# -----------------------------
# Waiting-time model
# -----------------------------

y_waiting = data["actual_waiting_minutes"]

(
    X_wait_train,
    X_wait_test,
    y_wait_train,
    y_wait_test,
) = train_test_split(
    X,
    y_waiting,
    test_size=0.2,
    random_state=42,
)

waiting_model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
)

waiting_model.fit(
    X_wait_train,
    y_wait_train,
)

waiting_predictions = waiting_model.predict(
    X_wait_test
)

waiting_mae = mean_absolute_error(
    y_wait_test,
    waiting_predictions,
)

joblib.dump(
    waiting_model,
    WAITING_MODEL_PATH,
)


# -----------------------------
# Consultation-time model
# -----------------------------

y_consultation = data["actual_consultation_minutes"]

(
    X_consult_train,
    X_consult_test,
    y_consult_train,
    y_consult_test,
) = train_test_split(
    X,
    y_consultation,
    test_size=0.2,
    random_state=42,
)

consultation_model = RandomForestRegressor(
    n_estimators=200,
    random_state=42,
)

consultation_model.fit(
    X_consult_train,
    y_consult_train,
)

consultation_predictions = consultation_model.predict(
    X_consult_test
)

consultation_mae = mean_absolute_error(
    y_consult_test,
    consultation_predictions,
)

joblib.dump(
    consultation_model,
    CONSULTATION_MODEL_PATH,
)


print("Both models trained successfully")
print(
    "Waiting-time MAE:",
    round(waiting_mae, 2),
    "minutes",
)
print(
    "Consultation-time MAE:",
    round(consultation_mae, 2),
    "minutes",
)
print(
    "Saved:",
    WAITING_MODEL_PATH.name,
)
print(
    "Saved:",
    CONSULTATION_MODEL_PATH.name,
)