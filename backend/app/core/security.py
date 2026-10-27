from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()
# Hash usado quando o e-mail não existe, para a resposta demorar o mesmo tempo.
_DUMMY_HASH = password_hash.hash("senha-que-nao-existe")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    if hashed is None:
        password_hash.verify(password, _DUMMY_HASH)
        return False
    return password_hash.verify(password, hashed)


def create_access_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": str(user_id), "exp": expires}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> int | None:
    """Devolve o id do usuário ou None se o token for inválido ou estiver vencido."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
