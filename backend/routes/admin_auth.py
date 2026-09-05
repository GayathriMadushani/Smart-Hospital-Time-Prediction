from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import Admin
from schemas import AdminResponse, AdminTokenResponse
from security import (
    create_admin_access_token,
    get_current_admin,
    verify_password,
)


router = APIRouter(
    prefix="/admin/auth",
    tags=["Admin Authentication"],
)


@router.post(
    "/login",
    response_model=AdminTokenResponse,
)
def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    admin = (
        db.query(Admin)
        .filter(Admin.email == form_data.username)
        .first()
    )

    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin email or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account is disabled",
        )

    if not verify_password(
        form_data.password,
        admin.password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin email or password",
        )

    token = create_admin_access_token(
        admin.admin_id
    )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=AdminResponse,
)
def get_admin_profile(
    current_admin: Admin = Depends(
        get_current_admin
    ),
):
    return current_admin