
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routes import admin_analytics

from routes import (
    admin_auth,
    admin_dashboard,
    appointments,
    auth,
    doctors,
    patients,
    predictions,
    queue,
)


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Smart Hospital Online Booking System",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://smarthospital-0lg8.onrender.com",
        "https://smarthospital-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(auth.router)
app.include_router(queue.router)
app.include_router(predictions.router)
app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_analytics.router)


@app.get("/")
def home():
    return {
        "message": "Smart Hospital API Running",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }