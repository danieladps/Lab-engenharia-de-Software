from tests.conftest import INTEREST, register, sample_pet


def test_owner_edits_some_fields(client, owner):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()

    response = client.patch(f"/api/pets/{pet['id']}", json={"name": " Nina Flor ", "age_years": 3}, headers=owner)

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Nina Flor"
    assert data["age_years"] == 3
    assert data["breed"] == pet["breed"]  # o que não foi enviado continua igual
    assert client.get(f"/api/pets/{pet['id']}").json()["name"] == "Nina Flor"


def test_edit_validates_fields(client, owner):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    assert client.patch(f"/api/pets/{pet['id']}", json={"size": "enorme"}, headers=owner).status_code == 422
    assert client.patch(f"/api/pets/{pet['id']}", json={"description": "curta"}, headers=owner).status_code == 422


def test_edit_cannot_change_status_or_owner(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    client.patch(f"/api/pets/{pet['id']}", json={"status": "adopted", "owner_id": 99}, headers=owner)

    assert client.get(f"/api/pets/{pet['id']}").json()["status"] == "available"
    assert len(client.get("/api/me/pets", headers=owner).json()) == 1


def test_only_owner_can_edit_or_delete(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()

    assert client.patch(f"/api/pets/{pet['id']}", json={"name": "Outro"}).status_code == 401
    assert client.patch(f"/api/pets/{pet['id']}", json={"name": "Outro"}, headers=adopter).status_code == 404
    assert client.delete(f"/api/pets/{pet['id']}").status_code == 401
    assert client.delete(f"/api/pets/{pet['id']}", headers=adopter).status_code == 404
    assert client.get(f"/api/pets/{pet['id']}").json()["name"] == "Nina"


def test_owner_deletes_available_pet(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    client.put(f"/api/me/favorites/{pet['id']}", headers=adopter)

    assert client.delete(f"/api/pets/{pet['id']}", headers=owner).status_code == 204

    assert client.get(f"/api/pets/{pet['id']}").status_code == 404
    assert client.get("/api/pets").json() == []
    assert client.get("/api/me/pets", headers=owner).json() == []
    # O favorito de outra pessoa some junto, sem deixar registro quebrado.
    assert client.get("/api/me/favorites", headers=adopter).json() == []


def test_cannot_delete_with_open_request(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter)

    response = client.delete(f"/api/pets/{pet['id']}", headers=owner)

    assert response.status_code == 409
    assert "Responda" in response.json()["detail"]
    assert len(client.get("/api/me/adoptions", headers=adopter).json()) == 1


def test_cannot_delete_adopted_pet(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    adoption = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter).json()
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)

    assert client.delete(f"/api/pets/{pet['id']}", headers=owner).status_code == 409
    assert client.get("/api/me/adoptions", headers=adopter).json()[0]["status"] == "approved"


def test_delete_after_rejecting_works(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    adoption = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter).json()
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "rejected"}, headers=owner)

    assert client.delete(f"/api/pets/{pet['id']}", headers=owner).status_code == 204


def test_unknown_pet_returns_404(client, owner):
    other = register(client, name="Bia Teste", email="bia@example.com")
    assert client.patch("/api/pets/999", json={"name": "Nina"}, headers=other).status_code == 404
    assert client.delete("/api/pets/999", headers=owner).status_code == 404
