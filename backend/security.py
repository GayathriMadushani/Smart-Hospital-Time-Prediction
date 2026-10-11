
from datetime import datetime, timedelta, timezone
import os
from typing import Any, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from database import get_db
from models import Admin, Patient


# =========================================================
# Password configuration
# =========================================================

password_hash = PasswordHash.recommended()


# =========================================================
# JWT configuration - previous development version
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is required"
    )
ALGORITHM = "HS256"

PATIENT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES = 480


# =========================================================
# OAuth2 schemes
# =========================================================

patient_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
)

admin_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/admin/auth/login",
)


# =========================================================
# Password functions
# =========================================================

def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    try:
        return password_hash.verify(
            plain_password,
            hashed_password,
        )
    except Exception:
        return False


# =========================================================
# Token creation functions
# =========================================================

def create_access_token(
    subject: str,
    expires_minutes: int = PATIENT_ACCESS_TOKEN_EXPIRE_MINUTES,
    token_type: str = "patient",
) -> str:

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes
    )

    payload = {
        "sub": subject,
        "type": token_type,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def create_admin_access_token(
    admin_id: int,
) -> str:

    return create_access_token(
        subject=str(admin_id),
        expires_minutes=ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES,
        token_type="admin",
    )


# =========================================================
# Token decoding
# =========================================================

def decode_access_token(
    token: str,
) -> Optional[dict[str, Any]]:

    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

    except InvalidTokenError:
        return None


# =========================================================
# Current patient dependency
# =========================================================

def get_current_patient(
    token: str = Depends(patient_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Patient:

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_type = payload.get("type")

    # Support older patient tokens
    if token_type not in (None, "patient"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid patient token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = payload.get("sub")

    try:
        patient_id = int(subject)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Patient not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return patient


# =========================================================
# Current admin dependency
# =========================================================

def get_current_admin(
    token: str = Depends(admin_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Admin:

    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired admin token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    subject = payload.get("sub")

    try:
        admin_id = int(subject)

    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token subject",
            headers={"WWW-Authenticate": "Bearer"},
        )

    admin = (
        db.query(Admin)
        .filter(Admin.admin_id == admin_id)
        .first()
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin account not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled",
        )

    return admin
