from tests.conftest import INTEREST, register, sample_pet


def _conversation(client, owner, adopter, **pet):
    created = client.post("/api/pets", json=sample_pet(**pet), headers=owner).json()
    adoption = client.post(f"/api/pets/{created['id']}/adoptions", json=INTEREST, headers=adopter).json()
    return created, adoption


def _send(client, adoption_id, headers, body="Olá! Podemos combinar uma visita?"):
    return client.post(f"/api/adoptions/{adoption_id}/messages", json={"body": body}, headers=headers)


def test_both_sides_can_talk(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)

    assert _send(client, adoption["id"], adopter, "Oi, posso visitar no sábado?").status_code == 201
    assert _send(client, adoption["id"], owner, "Pode sim, às 10h.").status_code == 201

    detail = client.get(f"/api/adoptions/{adoption['id']}/messages", headers=adopter).json()
    assert [(m["body"], m["mine"]) for m in detail["messages"]] == [("Oi, posso visitar no sábado?", True), ("Pode sim, às 10h.", False)]
    assert detail["request_message"] == INTEREST["message"]
    assert detail["role"] == "adopter" and detail["other_name"] == "Casa Teste"
    assert detail["can_send"] is True
    assert client.get(f"/api/adoptions/{adoption['id']}/messages", headers=owner).json()["other_name"] == "Alex Teste"


def test_outsiders_cannot_read_or_send(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)
    _send(client, adoption["id"], adopter, "Mensagem particular.")
    stranger = register(client, name="Bia Teste", email="bia@example.com")

    assert client.get(f"/api/adoptions/{adoption['id']}/messages").status_code == 401
    assert client.get(f"/api/adoptions/{adoption['id']}/messages", headers=stranger).status_code == 404
    assert _send(client, adoption["id"], stranger).status_code == 404
    assert client.get("/api/me/conversations", headers=stranger).json() == []


def test_conversation_list_for_both_roles(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)
    _send(client, adoption["id"], adopter, "Primeira mensagem.")

    for headers, role in [(adopter, "adopter"), (owner, "owner")]:
        items = client.get("/api/me/conversations", headers=headers).json()
        assert [(item["adoption_id"], item["role"]) for item in items] == [(adoption["id"], role)]
        assert items[0]["last_message"]["body"] == "Primeira mensagem."
        assert items[0]["pet"]["name"] == "Nina"
    # Só nome, nunca e-mail, na lista de conversas.
    assert "@" not in str(client.get("/api/me/conversations", headers=owner).json())


def test_unread_count_and_mark_as_read(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)
    _send(client, adoption["id"], adopter, "Um.")
    _send(client, adoption["id"], adopter, "Dois.")

    assert client.get("/api/me/conversations", headers=owner).json()[0]["unread"] == 2
    # As próprias mensagens não contam como não lidas.
    assert client.get("/api/me/conversations", headers=adopter).json()[0]["unread"] == 0

    client.get(f"/api/adoptions/{adoption['id']}/messages", headers=owner)

    assert client.get("/api/me/conversations", headers=owner).json()[0]["unread"] == 0


def test_rejected_conversation_is_read_only(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)
    _send(client, adoption["id"], adopter, "Antes da resposta.")
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "rejected"}, headers=owner)

    detail = client.get(f"/api/adoptions/{adoption['id']}/messages", headers=adopter).json()
    assert detail["can_send"] is False
    assert [m["body"] for m in detail["messages"]] == ["Antes da resposta."]
    assert _send(client, adoption["id"], adopter).status_code == 409
    assert _send(client, adoption["id"], owner).status_code == 409


def test_approved_conversation_keeps_working(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)
    client.patch(f"/api/adoptions/{adoption['id']}", json={"status": "approved"}, headers=owner)
    assert _send(client, adoption["id"], adopter, "Obrigado! Quando busco?").status_code == 201


def test_message_validation(client, owner, adopter):
    _, adoption = _conversation(client, owner, adopter)
    assert _send(client, adoption["id"], adopter, "").status_code == 422
    assert _send(client, adoption["id"], adopter, "   ").status_code == 422
    assert _send(client, adoption["id"], adopter, "x" * 2001).status_code == 422


def test_most_recent_conversation_first(client, owner, adopter):
    _, first = _conversation(client, owner, adopter, name="Nina")
    _, second = _conversation(client, owner, adopter, name="Bolt")
    _send(client, first["id"], adopter, "Mensagem mais nova na conversa da Nina.")

    names = [item["pet"]["name"] for item in client.get("/api/me/conversations", headers=adopter).json()]
    assert names == ["Nina", "Bolt"]


def test_dates_are_sent_with_timezone(client, owner, adopter):
    """Sem o fuso, o navegador mostraria o horário 3h adiantado no Brasil."""
    _, adoption = _conversation(client, owner, adopter)
    sent = _send(client, adoption["id"], adopter).json()
    pet = client.get("/api/me/pets", headers=owner).json()[0]

    for value in [sent["created_at"], pet["pet"]["created_at"], pet["adoptions"][0]["created_at"]]:
        assert value.endswith("Z") or value.endswith("+00:00"), value
