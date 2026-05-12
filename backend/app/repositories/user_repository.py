from sqlalchemy.orm import Session
from app.models.user import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create(db: Session, email: str, hashed_password: str, name: str, role: str = "viewer") -> User:
    user = User(email=email, hashed_password=hashed_password, name=name, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
