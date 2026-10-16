import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main
from app.db.base import Base
from app.db.session import get_db
from app.main import app


@pytest.fixture
def client(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main, "engine", engine)
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
        "donor_name": "Casa Amora",
        **overrides,
    }


def test_publish_pet_and_filter_available_pets(client):
    response = client.post("/api/pets", json=sample_pet())

    assert response.status_code == 201
    assert response.json()["donor_name"] == "Casa Amora"
    assert len(client.get("/api/pets", params={"city": "São Paulo"}).json()) == 1
    assert client.get("/api/pets", params={"species": "Gato"}).json() == []
    assert client.get(f"/api/pets/{response.json()['id']}").json()["name"] == "Nina"


def test_submit_adoption_request_marks_pet_unavailable(client):
    pet = client.post("/api/pets", json=sample_pet()).json()

    response = client.post(
        f"/api/pets/{pet['id']}/adoptions",
        json={
            "applicant_name": "Alex Silva",
            "applicant_email": "alex@example.com",
            "message": "Tenho tempo e espaço para cuidar muito bem da Nina.",
        },
    )

    assert response.status_code == 201
    assert response.json()["applicant_name"] == "Alex Silva"
    assert response.json()["applicant_email"] == "alex@example.com"
    assert client.get("/api/pets").json() == []


def test_pet_cannot_receive_multiple_adoption_requests(client):
    pet = client.post("/api/pets", json=sample_pet()).json()
    request = {
        "applicant_name": "Alex Silva",
        "applicant_email": "alex@example.com",
        "message": "Tenho tempo e espaço para cuidar muito bem da Nina.",
    }

    first_response = client.post(f"/api/pets/{pet['id']}/adoptions", json=request)
    second_response = client.post(f"/api/pets/{pet['id']}/adoptions", json=request)

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_adoption_request_requires_valid_contact_email(client):
    pet = client.post("/api/pets", json=sample_pet()).json()
    response = client.post(
        f"/api/pets/{pet['id']}/adoptions",
        json={
            "applicant_name": "Alex Silva",
            "applicant_email": "not-an-email",
            "message": "Tenho tempo e espaço para cuidar muito bem da Nina.",
        },
    )

    assert response.status_code == 422
