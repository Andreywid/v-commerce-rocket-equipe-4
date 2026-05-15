from app.database import engine, SessionLocal, Base
from app.models import User
from app.core.security import hash_password
from app.config import settings


def seed():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if existing:
            print(f"Usuário admin já existe: {settings.ADMIN_EMAIL}")
            return

        admin = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            name=settings.ADMIN_NAME,
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Usuário admin criado com sucesso: {settings.ADMIN_EMAIL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
