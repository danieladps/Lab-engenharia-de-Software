from tests.conftest import INTEREST, register, sample_pet


def test_publish_requires_login(client):
    assert client.post("/api/pets", json=sample_pet()).status_code == 401


def test_publish_pet_and_filter_available_pets(client, owner):
    response = client.post("/api/pets", json=sample_pet(), headers=owner)

    assert response.status_code == 201
    assert response.json()["donor_name"] == "Casa Teste"
    assert len(client.get("/api/pets", params={"city": "São Paulo"}).json()) == 1
    assert client.get("/api/pets", params={"species": "Gato"}).json() == []
    assert client.get(f"/api/pets/{response.json()['id']}").json()["name"] == "Nina"


def test_public_listing_does_not_expose_owner_data(client, owner):
    client.post("/api/pets", json=sample_pet(), headers=owner)
    listed = client.get("/api/pets").json()[0]

    assert "owner_id" not in listed
    assert "abrigo@example.com" not in str(listed)


def test_adoption_requires_login(client, owner):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    assert client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST).status_code == 401


def test_submit_adoption_request_marks_pet_unavailable(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()

    response = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter)

    assert response.status_code == 201
    assert response.json()["applicant_name"] == "Alex Teste"
    assert response.json()["applicant_email"] == "alex@example.com"
    assert client.get("/api/pets").json() == []


def test_owner_cannot_adopt_own_pet(client, owner):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    assert client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=owner).status_code == 400


def test_pet_cannot_receive_multiple_adoption_requests(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    other = register(client, name="Bia Teste", email="bia@example.com")

    first = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter)
    second = client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=other)

    assert first.status_code == 201
    assert second.status_code == 409


def test_adoption_message_is_required(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    response = client.post(f"/api/pets/{pet['id']}/adoptions", json={"message": "oi"}, headers=adopter)
    assert response.status_code == 422


def test_owner_sees_received_interest_in_my_pets(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()

    before = client.get("/api/me/pets", headers=owner).json()
    assert before[0]["adoptions"] == []

    client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter)
    after = client.get("/api/me/pets", headers=owner).json()

    assert after[0]["pet"]["status"] == "adoption_pending"
    assert after[0]["adoptions"][0]["applicant_email"] == "alex@example.com"
    assert after[0]["adoptions"][0]["message"] == INTEREST["message"]


def test_user_only_sees_own_pets_and_interests(client, owner, adopter):
    other_owner = register(client, name="Lar Teste", email="lar@example.com")
    nina = client.post("/api/pets", json=sample_pet(name="Nina"), headers=owner).json()
    client.post("/api/pets", json=sample_pet(name="Bolt"), headers=other_owner)
    client.post(f"/api/pets/{nina['id']}/adoptions", json=INTEREST, headers=adopter)

    other_view = client.get("/api/me/pets", headers=other_owner).json()

    assert [item["pet"]["name"] for item in other_view] == ["Bolt"]
    assert "alex@example.com" not in str(other_view)
    assert client.get("/api/me/pets", headers=adopter).json() == []
    assert client.get("/api/me/pets").status_code == 401
