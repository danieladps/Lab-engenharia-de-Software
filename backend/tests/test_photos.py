from tests.conftest import sample_pet

# Arquivos mínimos com a assinatura de cada formato (não são fotos reais).
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 100
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100
WEBP = b"RIFF\x00\x00\x00\x00WEBPVP8 " + b"\x00" * 100


def _upload(client, headers, data, content_type="image/jpeg"):
    return client.post("/api/photos", content=data, headers={**headers, "Content-Type": content_type})


def test_upload_and_show_photo(client, owner):
    response = _upload(client, owner, JPEG)
    assert response.status_code == 201
    body = response.json()
    assert body["url"] == f"/api/photos/{body['id']}"

    shown = client.get(body["url"])
    assert shown.status_code == 200
    assert shown.content == JPEG
    assert shown.headers["content-type"] == "image/jpeg"
    assert shown.headers["x-content-type-options"] == "nosniff"


def test_type_comes_from_the_file_not_the_header(client, owner):
    for data, expected in [(PNG, "image/png"), (WEBP, "image/webp")]:
        url = _upload(client, owner, data, content_type="image/jpeg").json()["url"]
        assert client.get(url).headers["content-type"] == expected


def test_rejects_non_images_and_big_files(client, owner):
    assert _upload(client, owner, b"<svg onload=alert(1)>", "image/svg+xml").status_code == 415
    assert _upload(client, owner, b"%PDF-1.7 ...", "image/jpeg").status_code == 415
    assert _upload(client, owner, JPEG + b"\x00" * (2 * 1024 * 1024)).status_code == 413


def test_upload_requires_login(client):
    assert client.post("/api/photos", content=JPEG, headers={"Content-Type": "image/jpeg"}).status_code == 401
    assert client.get("/api/photos/999").status_code == 404


def test_pet_can_use_uploaded_photo(client, owner):
    url = _upload(client, owner, JPEG).json()["url"]
    created = client.post("/api/pets", json=sample_pet(image_url=url), headers=owner)
    assert created.status_code == 201
    assert created.json()["image_url"] == url


def test_pet_photo_link_must_work_for_everyone(client, owner):
    # Links que só abrem no computador de quem colou são recusados.
    for url in ("blob:https://web.whatsapp.com/abc-123", "file:///C:/fotos/nina.jpg", "javascript:alert(1)", "/api/photos/abc"):
        response = client.post("/api/pets", json=sample_pet(image_url=url), headers=owner)
        assert response.status_code == 422, url

    pet = client.post("/api/pets", json=sample_pet(), headers=owner).json()
    assert client.patch(f"/api/pets/{pet['id']}", json={"image_url": "file:///C:/nina.jpg"}, headers=owner).status_code == 422
