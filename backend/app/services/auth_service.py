from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.core.security import create_access_token, verify_password
from app.repositories import user_repository


def login(db: Session, email: str, password: str):
    user = user_repository.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return token, user
