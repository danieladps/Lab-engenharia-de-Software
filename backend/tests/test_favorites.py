from tests.conftest import INTEREST, register, sample_pet


def test_favorites_require_login(client, owner):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    assert client.get("/api/me/favorites").status_code == 401
    assert client.put(f"/api/me/favorites/{pet['id']}").status_code == 401
    assert client.delete(f"/api/me/favorites/{pet['id']}").status_code == 401


def test_add_and_remove_favorite(client, owner, adopter):
    nina = client.post("/api/pets", json=sample_pet(name="Nina"), headers=owner).json()
    bolt = client.post("/api/pets", json=sample_pet(name="Bolt"), headers=owner).json()

    assert client.put(f"/api/me/favorites/{nina['id']}", headers=adopter).status_code == 204
    assert client.put(f"/api/me/favorites/{bolt['id']}", headers=adopter).status_code == 204
    assert [pet["name"] for pet in client.get("/api/me/favorites", headers=adopter).json()] == ["Bolt", "Nina"]

    assert client.delete(f"/api/me/favorites/{nina['id']}", headers=adopter).status_code == 204
    assert [pet["name"] for pet in client.get("/api/me/favorites", headers=adopter).json()] == ["Bolt"]


def test_favorite_twice_keeps_one(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    client.put(f"/api/me/favorites/{pet['id']}", headers=adopter)
    client.put(f"/api/me/favorites/{pet['id']}", headers=adopter)
    assert len(client.get("/api/me/favorites", headers=adopter).json()) == 1
    # Remover algo que não está salvo também não dá erro.
    client.delete(f"/api/me/favorites/{pet['id']}", headers=adopter)
    assert client.delete(f"/api/me/favorites/{pet['id']}", headers=adopter).status_code == 204


def test_favorite_unknown_pet_returns_404(client, adopter):
    assert client.put("/api/me/favorites/999", headers=adopter).status_code == 404


def test_users_only_see_their_own_favorites(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    other = register(client, name="Bia Teste", email="bia@example.com")
    client.put(f"/api/me/favorites/{pet['id']}", headers=adopter)

    assert client.get("/api/me/favorites", headers=other).json() == []
    # Remover pela outra conta não apaga o favorito de quem salvou.
    client.delete(f"/api/me/favorites/{pet['id']}", headers=other)
    assert len(client.get("/api/me/favorites", headers=adopter).json()) == 1


def test_favorite_stays_after_pet_gets_a_request(client, owner, adopter):
    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    client.put(f"/api/me/favorites/{pet['id']}", headers=adopter)
    client.post(f"/api/pets/{pet['id']}/adoptions", json=INTEREST, headers=adopter)

    favorites = client.get("/api/me/favorites", headers=adopter).json()
    assert favorites[0]["status"] == "adoption_pending"
