import os
import secrets

# Chave só para os testes, gerada na hora (nunca uma chave real).
os.environ.setdefault("JWT_SECRET", secrets.token_urlsafe(32))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

TEST_PASSWORD = "senha-de-teste-123"


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    test_session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        with test_session() as db:
            yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


def register(client, name="Alex Teste", email="alex@example.com", city="São Paulo"):
    """Cria uma conta fictícia e devolve o cabeçalho de autorização."""
    response = client.post(
        "/api/auth/cadastro",
        json={"name": name, "email": email, "password": TEST_PASSWORD, "city": city},
    )
    assert response.status_code == 201, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def owner(client):
    return register(client, name="Casa Teste", email="abrigo@example.com")


@pytest.fixture
def adopter(client):
    return register(client, name="Alex Teste", email="alex@example.com")


def sample_pet(**overrides):
    return {
        "name": "Nina",
        "species": "Cão",
        "breed": "SRD",
        "size": "medium",
        "age_years": 2,
        "city": "São Paulo",
        "description": "Carinhosa e pronta para encontrar uma família.",
        "image_url": "https://example.com/nina.jpg",
        "donor_name": "Casa Teste",
        **overrides,
    }


INTEREST = {"message": "Tenho tempo e espaço para cuidar muito bem da Nina."}
