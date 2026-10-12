
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine

from routes import (
    admin_analytics,
    admin_auth,
    admin_dashboard,
    appointments,
    auth,
    doctors,
    patients,
    predictions,
    queue,
)


# Create database tables if they do not already exist
Base.metadata.create_all(bind=engine)


# Create FastAPI application
app = FastAPI(
    title="Smart Hospital Online Booking System",
    version="1.0.0",
)


# Allow frontend applications to communicate with backend
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


# Register API routes
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(auth.router)
app.include_router(queue.router)
app.include_router(predictions.router)
app.include_router(admin_auth.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_analytics.router)


# Home endpoint
@app.get("/")
def home():
    return {
        "message": "Smart Hospital API Running",
        "status": "success",
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }
