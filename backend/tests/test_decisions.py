from tests.conftest import INTEREST, register, sample_pet


def _setup(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    adoption = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter).json()
    return pet, adoption


def test_owner_approves_request(client, owner, adopter):
    pet, adoption = _setup(client, owner, adopter)

    response = client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)

    assert response.status_code == 200
    assert response.json()["status"] == "approved"
    assert response.json()["decided_at"] is not None
    assert client.get(f"/api/pets/{pet['id']}").json()["status"] == "adopted"
    assert client.get("/api/pets").json() == []


def test_adopter_sees_owner_contact_only_after_approval(client, owner, adopter):
    _, adoption = _setup(client, owner, adopter)
    before = client.get("/api/me/adoptions", headers=adopter).json()[0]
    assert before["owner_contact"] is None
    assert "abrigo@example.com" not in str(before)

    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)
    after = client.get("/api/me/adoptions", headers=adopter).json()[0]

    assert after["status"] == "approved"
    assert after["owner_contact"] == {"name": "Casa Teste", "email": "abrigo@example.com"}


def test_rejected_pet_goes_back_to_search_and_accepts_someone_else(client, owner, adopter):
    pet, adoption = _setup(client, owner, adopter)

    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "rejected"}, headers=owner)

    assert [item["id"] for item in client.get("/api/pets").json()] == [pet["id"]]
    mine = client.get("/api/me/adoptions", headers=adopter).json()[0]
    assert mine["status"] == "rejected" and mine["owner_contact"] is None

    other = register(client, name="Bia Teste", email="bia@example.com")
    assert client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=other).status_code == 201


def test_rejected_person_cannot_ask_same_pet_again(client, owner, adopter):
    pet, adoption = _setup(client, owner, adopter)
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "rejected"}, headers=owner)

    again = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter)

    assert again.status_code == 409
    assert "já enviou" in again.json()["detail"]


def test_only_owner_can_decide(client, owner, adopter):
    _, adoption = _setup(client, owner, adopter)
    stranger = register(client, name="Bia Teste", email="bia@example.com")

    assert client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}).status_code == 401
    assert client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=stranger).status_code == 404
    # Quem pediu também não pode aprovar o próprio pedido.
    assert client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=adopter).status_code == 404
    assert client.get("/api/me/adoptions", headers=adopter).json()[0]["status"] == "pending"


def test_cannot_decide_twice(client, owner, adopter):
    _, adoption = _setup(client, owner, adopter)
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "rejected"}, headers=owner)

    again = client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)

    assert again.status_code == 409


def test_invalid_decision_is_rejected(client, owner, adopter):
    _, adoption = _setup(client, owner, adopter)
    for value in ["pending", "adopted", ""]:
        assert client.patch(f"/api/adoptions/{adoption['id']}", json={"status": value}, headers=owner).status_code == 422


def test_unknown_request_returns_404(client, owner):
    assert client.patch("/api/adoptions/999", json={"status": "approved"}, headers=owner).status_code == 404


def test_owner_sees_pending_first_then_history(client, owner, adopter):
    pet, first = _setup(client, owner, adopter)
    client.patch(f"/api/adoptions/{first['id']}", json={"status": "rejected"}, headers=owner)
    other = register(client, name="Bia Teste", email="bia@example.com")
    client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=other)

    adoptions = client.get("/api/me/pets", headers=owner).json()[0]["adoptions"]

    assert [(item["applicant_name"], item["status"]) for item in adoptions] == [("Bia Teste", "pending"), ("Alex Teste", "rejected")]
