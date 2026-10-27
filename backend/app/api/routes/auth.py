from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["Conta"])


def _token_for(user: User) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user.id), user=UserRead.model_validate(user))


@router.post("/cadastro", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = User(
        name=payload.name.strip(),
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        city=payload.city.strip(),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe uma conta com este e-mail.") from None
    db.refresh(user)
    return _token_for(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    # Mesma mensagem para e-mail inexistente e senha errada, para não revelar quem tem conta.
    if not verify_password(payload.password, user.password_hash if user else None):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    return _token_for(user)


@router.get("/me", response_model=UserRead)
def read_me(user: User = Depends(get_current_user)):
    return user
