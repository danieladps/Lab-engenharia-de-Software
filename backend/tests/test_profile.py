from tests.conftest import INTEREST, register, sample_pet


def test_my_adoptions_lists_only_my_requests(client, owner, adopter):
    other = register(client, name="Bia Teste", email="bia@example.com")
    nina = client.post("/api/pets", json=sample_pet(name="Nina"), headers=owner).json()
    bolt = client.post("/api/pets", json=sample_pet(name="Bolt"), headers=owner).json()
    client.post(f"/api/pets/{nina['id']}/adoptions", json=INTEREST, headers=adopter)
    client.post(f"/api/pets/{bolt['id']}/adoptions", json=INTEREST, headers=other)

    mine = client.get("/api/me/adoptions", headers=adopter).json()

    assert [item["pet"]["name"] for item in mine] == ["Nina"]
    assert mine[0]["status"] == "pending"
    assert mine[0]["message"] == INTEREST["message"]
    assert "applicant_email" not in mine[0]
    assert client.get("/api/me/adoptions", headers=owner).json() == []
    assert client.get("/api/me/adoptions").status_code == 401


def test_update_name_and_city(client, adopter):
    response = client.patch("/api/auth/me", json={"name": "  Alex Novo ", "city": "Recife"}, headers=adopter)

    assert response.status_code == 200
    assert response.json()["name"] == "Alex Novo"
    assert response.json()["city"] == "Recife"
    assert client.get("/api/auth/me", headers=adopter).json()["city"] == "Recife"


def test_update_only_city_keeps_name(client, adopter):
    client.patch("/api/auth/me", json={"city": "Recife"}, headers=adopter)
    assert client.get("/api/auth/me", headers=adopter).json()["name"] == "Alex Teste"


def test_update_cannot_change_email_or_be_too_short(client, adopter):
    client.patch("/api/auth/me", json={"email": "outro@example.com"}, headers=adopter)
    assert client.get("/api/auth/me", headers=adopter).json()["email"] == "alex@example.com"
    assert client.patch("/api/auth/me", json={"name": "A"}, headers=adopter).status_code == 422


def test_update_requires_login(client):
    assert client.patch("/api/auth/me", json={"city": "Recife"}).status_code == 401
