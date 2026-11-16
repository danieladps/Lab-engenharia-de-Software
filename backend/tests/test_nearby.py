import pytest

from app.core import geocoding
from tests.conftest import sample_pet

# Coordenadas aproximadas do centro de cada cidade (fictícias o bastante para o teste).
CITIES = {
    "São Paulo": (-23.55, -46.63),
    "Campinas": (-22.91, -47.06),
    "Rio de Janeiro": (-22.91, -43.17),
}
# Quem procura está no centro de São Paulo.
HERE = {"lat": -23.55, "lng": -46.63}


@pytest.fixture(autouse=True)
def fake_geocoder(monkeypatch):
    calls = []

    def fake(city):
        calls.append(city)
        return CITIES.get(city.strip())

    monkeypatch.setattr(geocoding, "geocode_city", fake)
    return calls


def _publish(client, owner, **pet):
    response = client.post("/api/pets", json=sample_pet(**pet), headers=owner)
    assert response.status_code == 201, response.text
    return response.json()


def test_nearest_first_with_distance(client, owner):
    _publish(client, owner, name="Rio", city="Rio de Janeiro")
    _publish(client, owner, name="Camp", city="Campinas")
    _publish(client, owner, name="Sampa", city="São Paulo")

    items = client.get("/api/pets", params=HERE).json()
    assert [item["name"] for item in items] == ["Sampa", "Camp", "Rio"]
    assert items[0]["distance_km"] == 0
    assert 70 < items[1]["distance_km"] < 90  # São Paulo–Campinas, em linha reta
    assert 330 < items[2]["distance_km"] < 380  # São Paulo–Rio


def test_max_distance(client, owner):
    _publish(client, owner, name="Camp", city="Campinas")
    _publish(client, owner, name="Rio", city="Rio de Janeiro")
    items = client.get("/api/pets", params={**HERE, "max_km": 100}).json()
    assert [item["name"] for item in items] == ["Camp"]


def test_unknown_city_goes_last_and_without_location_nothing_changes(client, owner):
    _publish(client, owner, name="Longe", city="Cidade Inventada")
    _publish(client, owner, name="Perto", city="São Paulo")

    near = client.get("/api/pets", params=HERE).json()
    assert [(item["name"], item["distance_km"]) for item in near] == [("Perto", 0), ("Longe", None)]
    # Sem lat/lng, a busca continua igual (mais novos primeiro, sem distância).
    plain = client.get("/api/pets").json()
    assert [item["name"] for item in plain] == ["Perto", "Longe"]
    assert all(item["distance_km"] is None for item in plain)


def test_editing_city_updates_location(client, owner):
    pet = _publish(client, owner, name="Nina", city="Rio de Janeiro")
    client.patch(f"/api/pets/{pet['id']}", json={"city": "São Paulo"}, headers=owner)
    assert client.get("/api/pets", params=HERE).json()[0]["distance_km"] == 0


def test_old_pets_get_location_on_first_nearby_search(client, owner, monkeypatch, fake_geocoder):
    # Simula um anúncio de antes da localização: a API de mapas não respondeu na hora de publicar.
    monkeypatch.setattr(geocoding, "geocode_city", lambda city: None)
    _publish(client, owner, name="Antigo", city="Campinas")
    assert client.get("/api/pets", params=HERE).json()[0]["distance_km"] is None

    monkeypatch.setattr(geocoding, "geocode_city", lambda city: CITIES.get(city))
    assert client.get("/api/pets", params=HERE).json()[0]["distance_km"] > 70


def test_invalid_coordinates(client):
    assert client.get("/api/pets", params={"lat": 100, "lng": 0}).status_code == 422
    assert client.get("/api/pets", params={"lat": 0, "lng": 0, "max_km": 0}).status_code == 422


def test_distance_formula():
    assert geocoding.distance_km(0, 0, 0, 0) == 0
    # 1 grau de latitude tem cerca de 111 km.
    assert 110 < geocoding.distance_km(0, 0, 1, 0) < 112
