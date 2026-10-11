import os

from database import SessionLocal
from models import Admin
from security import hash_password

admin_email = os.getenv("ADMIN_EMAIL")
admin_password = os.getenv("ADMIN_PASSWORD")

if not admin_email or not admin_password:
    raise RuntimeError(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be configured"
    )

db = SessionLocal()

try:
    existing_admin = (
        db.query(Admin)
        .filter(Admin.email == admin_email)
        .first()
    )

    if existing_admin:
        print("Admin already exists")
    else:
        admin = Admin(
            name="System Administrator",
            email=admin_email,
            password=hash_password(admin_password),
            role="Admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully")

finally:
    db.close()