from tests.conftest import INTEREST, register, sample_pet


def _approved(client, owner, adopter, **pet):
    created = client.post("/api/pets", json=sample_pet(**pet), headers=owner).json()
    adoption = client.post(f"/api/pets/{created['id']}/adoptions", json=INTEREST, headers=adopter).json()
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)
    return created, adoption


def _review(client, adoption_id, headers, rating=5, comment="Tudo muito bem explicado, adoção tranquila."):
    return client.post(f"/api/adoptions/{adoption_id}/review", json={"rating": rating, "comment": comment}, headers=headers)


def test_adopter_reviews_approved_adoption(client, owner, adopter):
    _, adoption = _approved(client, owner, adopter)

    response = _review(client, adoption["id"], adopter, rating=4)
    assert response.status_code == 201
    assert response.json()["rating"] == 4

    # Quem adotou vê a própria avaliação em Minhas solicitações.
    mine = client.get("/api/me/adoptions", headers=adopter).json()
    assert mine[0]["review"]["rating"] == 4
    # Quem anunciou vê a avaliação em Meus anúncios.
    managed = client.get("/api/me/pets", headers=owner).json()
    assert managed[0]["adoptions"][0]["review"]["comment"] == "Tudo muito bem explicado, adoção tranquila."


def test_review_only_once(client, owner, adopter):
    _, adoption = _approved(client, owner, adopter)
    assert _review(client, adoption["id"], adopter).status_code == 201
    assert _review(client, adoption["id"], adopter, rating=1).status_code == 409
    assert client.get("/api/me/adoptions", headers=adopter).json()[0]["review"]["rating"] == 5


def test_cannot_review_pending_or_rejected(client, owner, adopter):
    created = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    pending = client.post(f"/api/pets/{created['id']}/adoptions", json=INTEREST, headers=adopter).json()
    assert _review(client, pending["id"], adopter).status_code == 409

    client.patch(f"/api/adoptions/{pending['id']}", json={"status": "rejected"}, headers=owner)
    assert _review(client, pending["id"], adopter).status_code == 409
    assert client.get("/api/me/adoptions", headers=adopter).json()[0]["review"] is None


def test_only_the_adopter_can_review(client, owner, adopter):
    _, adoption = _approved(client, owner, adopter)
    stranger = register(client, name="Bia Teste", email="bia@example.com")

    assert _review(client, adoption["id"], owner).status_code == 404
    assert _review(client, adoption["id"], stranger).status_code == 404
    assert client.post(f"/api/adoptions/{adoption['id']}/review", json={"rating": 5}).status_code == 401


def test_rating_must_be_between_1_and_5(client, owner, adopter):
    _, adoption = _approved(client, owner, adopter)
    assert _review(client, adoption["id"], adopter, rating=0).status_code == 422
    assert _review(client, adoption["id"], adopter, rating=6).status_code == 422
    assert _review(client, adoption["id"], adopter, comment="x" * 501).status_code == 422
    # Comentário é opcional; só espaços vira vazio.
    response = _review(client, adoption["id"], adopter, rating=3, comment="   ")
    assert response.status_code == 201 and response.json()["comment"] is None
