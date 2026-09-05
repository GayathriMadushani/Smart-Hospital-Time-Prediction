from database import SessionLocal
from models import Admin
from security import hash_password


db = SessionLocal()

try:
    existing_admin = (
        db.query(Admin)
        .filter(
            Admin.email == "admin@smarthospital.lk"
        )
        .first()
    )

    if existing_admin:
        print("Admin already exists")
    else:
        admin = Admin(
            name="System Administrator",
            email="admin@smarthospital.lk",
            password=hash_password("Admin@123"),
            role="Admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("Admin created successfully")

finally:
    db.close()