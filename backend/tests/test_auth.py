from datetime import datetime, timedelta, timezone

import jwt
from sqlalchemy import select

from app.core.config import settings
from tests.conftest import TEST_PASSWORD, register


def test_register_returns_token_and_me_works(client):
    headers = register(client, email="Nova@Example.com")

    me = client.get("/api/auth/me", headers=headers)

    assert me.status_code == 200
    assert me.json()["email"] == "nova@example.com"
    assert "password" not in me.json() and "password_hash" not in me.json()


def test_password_is_stored_as_hash(client):
    register(client)
    from app.db.session import get_db
    from app.main import app
    from app.models import User

    sessions = app.dependency_overrides[get_db]()
    stored = next(sessions).scalar(select(User.password_hash))
    sessions.close()
    assert TEST_PASSWORD not in stored
    assert stored.startswith("$argon2")


def test_duplicate_email_is_rejected(client):
    register(client, email="alex@example.com")
    response = client.post(
        "/api/auth/cadastro",
        json={"name": "Outra", "email": "ALEX@example.com", "password": TEST_PASSWORD, "city": "Recife"},
    )
    assert response.status_code == 409


def test_short_password_is_rejected(client):
    response = client.post(
        "/api/auth/cadastro",
        json={"name": "Alex", "email": "a@example.com", "password": "curta", "city": "Recife"},
    )
    assert response.status_code == 422


def test_login_with_correct_password(client):
    register(client, email="alex@example.com")
    response = client.post("/api/auth/login", json={"email": "alex@example.com", "password": TEST_PASSWORD})
    assert response.status_code == 200
    assert response.json()["user"]["email"] == "alex@example.com"


def test_login_errors_do_not_reveal_if_email_exists(client):
    register(client, email="alex@example.com")
    wrong_password = client.post("/api/auth/login", json={"email": "alex@example.com", "password": "errada-123"})
    unknown_email = client.post("/api/auth/login", json={"email": "ninguem@example.com", "password": "errada-123"})

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_me_requires_valid_token(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer lixo"}).status_code == 401


def test_expired_or_forged_token_is_rejected(client):
    register(client)
    expired = jwt.encode(
        {"sub": "1", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    forged = jwt.encode({"sub": "1"}, "outra-chave-qualquer-com-32-caracteres!!", algorithm="HS256")

    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"}).status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"}).status_code == 401
