from tests.conftest import INTEREST, register, sample_pet


def _request(client, owner, adopter, **pet):
    created = client.post("/api/pets", json=sample_pet(**pet), headers=owner).json()
    adoption = client.post(f"/api/pets/{created['id']}/adoptions", json=INTEREST, headers=adopter).json()
    return created, adoption


def _unread(client, headers):
    return client.get("/api/me/notifications/unread", headers=headers).json()["unread"]


def test_owner_is_notified_of_new_request(client, owner, adopter):
    pet, adoption = _request(client, owner, adopter)

    items = client.get("/api/me/notifications", headers=owner).json()
    assert [(n["kind"], n["adoption_id"], n["pet"]["name"], n["other_name"], n["read"]) for n in items] == [
        ("adoption_requested", adoption["id"], pet["name"], "Alex Teste", False)
    ]
    assert _unread(client, owner) == 1
    # Quem pediu não recebe aviso do próprio pedido.
    assert client.get("/api/me/notifications", headers=adopter).json() == []
    # Só nome, nunca e-mail.
    assert "@" not in str(items)


def test_adopter_is_notified_of_the_answer(client, owner, adopter):
    _, approved = _request(client, owner, adopter)
    _, rejected = _request(client, owner, adopter, name="Bob")
    client.patch(f"/api/adoptions/{approved['id']}", json={"status": "approved"}, headers=owner)
    client.patch(f"/api/adoptions/{rejected['id']}", json={"status": "rejected"}, headers=owner)

    items = client.get("/api/me/notifications", headers=adopter).json()
    assert [(n["kind"], n["adoption_id"], n["other_name"]) for n in items] == [
        ("adoption_rejected", rejected["id"], "Casa Teste"),
        ("adoption_approved", approved["id"], "Casa Teste"),
    ]
    assert _unread(client, adopter) == 2


def test_mark_all_read_only_touches_own_notifications(client, owner, adopter):
    _, adoption = _request(client, owner, adopter)
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)

    assert client.post("/api/me/notifications/read", headers=adopter).status_code == 204
    assert _unread(client, adopter) == 0
    assert all(n["read"] for n in client.get("/api/me/notifications", headers=adopter).json())
    # Os avisos do dono continuam não lidos.
    assert _unread(client, owner) == 1


def test_notifications_are_private(client, owner, adopter):
    _request(client, owner, adopter)
    stranger = register(client, name="Bia Teste", email="bia@example.com")

    assert client.get("/api/me/notifications").status_code == 401
    assert client.get("/api/me/notifications/unread").status_code == 401
    assert client.post("/api/me/notifications/read").status_code == 401
    assert client.get("/api/me/notifications", headers=stranger).json() == []
    assert _unread(client, stranger) == 0


def test_deleting_the_pet_removes_its_notifications(client, owner, adopter):
    pet, adoption = _request(client, owner, adopter)
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "rejected"}, headers=owner)

    assert client.delete(f"/api/pets/{pet['id']}", headers=owner).status_code == 204
    assert client.get("/api/me/notifications", headers=owner).json() == []
    assert client.get("/api/me/notifications", headers=adopter).json() == []
