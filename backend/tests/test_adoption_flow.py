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


INTEREST = {
    "applicant_name": "Alex Silva",
    "applicant_email": "alex@example.com",
    "message": "Tenho tempo e espaço para cuidar muito bem da Nina.",
}


def test_publish_returns_manage_token_only_once(client):
    created = client.post("/api/pets", json=sample_pet()).json()

    assert len(created["manage_token"]) >= 20
    assert "manage_token" not in client.get("/api/pets").json()[0]
    assert "manage_token" not in client.get(f"/api/pets/{created['id']}").json()


def test_owner_sees_received_interest_with_manage_token(client):
    created = client.post("/api/pets", json=sample_pet()).json()
    token = created["manage_token"]

    before = client.get(f"/api/manage/{token}")
    assert before.status_code == 200
    assert before.json()["adoptions"] == []

    client.post(f"/api/pets/{created['id']}/adoptions", json=INTEREST)
    after = client.get(f"/api/manage/{token}").json()

    assert after["pet"]["status"] == "adoption_pending"
    assert after["adoptions"][0]["applicant_email"] == "alex@example.com"
    assert after["adoptions"][0]["message"] == INTEREST["message"]
    assert "manage_token" not in after["pet"]


def test_manage_with_wrong_token_returns_404(client):
    client.post("/api/pets", json=sample_pet())

    assert client.get("/api/manage/codigo-invalido").status_code == 404


def test_token_of_one_pet_does_not_show_another_pet(client):
    first = client.post("/api/pets", json=sample_pet(name="Nina")).json()
    second = client.post("/api/pets", json=sample_pet(name="Bolt")).json()
    client.post(f"/api/pets/{second['id']}/adoptions", json=INTEREST)

    data = client.get(f"/api/manage/{first['manage_token']}").json()

    assert data["pet"]["name"] == "Nina"
    assert data["adoptions"] == []
