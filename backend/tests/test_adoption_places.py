import pytest

from app.core import places
from app.core.config import settings

# Locais fictícios no formato da Google Places API (New).
GOOGLE_RESULT = [
    {
        "id": "longe",
        "displayName": {"text": "Abrigo Longe"},
        "formattedAddress": "Rua Exemplo, 100 - Campinas",
        "location": {"latitude": -22.91, "longitude": -47.06},
        "googleMapsUri": "https://maps.google.com/?cid=1",
        "businessStatus": "OPERATIONAL",
    },
    {
        "id": "perto",
        "displayName": {"text": "ONG Perto"},
        "formattedAddress": "Rua Teste, 1 - São Paulo",
        "location": {"latitude": -23.56, "longitude": -46.64},
        "googleMapsUri": "https://maps.google.com/?cid=2",
    },
    {
        "id": "fechado",
        "displayName": {"text": "Abrigo Fechado"},
        "formattedAddress": "Rua Fim, 2 - São Paulo",
        "location": {"latitude": -23.55, "longitude": -46.63},
        "businessStatus": "CLOSED_PERMANENTLY",
    },
]
HERE = {"lat": -23.55, "lng": -46.63}


@pytest.fixture(autouse=True)
def fake_google(monkeypatch):
    calls = []

    def fake(lat, lng):
        calls.append((lat, lng))
        return GOOGLE_RESULT

    monkeypatch.setattr(places, "_ask_google", fake)
    monkeypatch.setattr(settings, "google_places_api_key", "chave-de-teste")
    monkeypatch.setattr(settings, "places_daily_limit", 200)
    places._cache.clear()
    places._calls_today.clear()
    return calls


def test_nearest_first_and_closed_places_hidden(client):
    response = client.get("/api/adoption-places", params=HERE)

    assert response.status_code == 200
    items = response.json()
    assert [item["name"] for item in items] == ["ONG Perto", "Abrigo Longe"]
    assert items[0]["distance_km"] < 2
    assert 70 < items[1]["distance_km"] < 90
    assert items[0]["maps_url"] == "https://maps.google.com/?cid=2"
    # A chave nunca volta para o site.
    assert "chave-de-teste" not in response.text


def test_without_location_searches_from_sao_paulo(client, fake_google):
    assert client.get("/api/adoption-places").status_code == 200
    assert fake_google == [(-23.6, -46.6)]


def test_same_area_uses_cache(client, fake_google):
    client.get("/api/adoption-places", params=HERE)
    client.get("/api/adoption-places", params={"lat": -23.57, "lng": -46.62})
    assert len(fake_google) == 1


def test_without_key_page_says_not_configured(client, monkeypatch):
    monkeypatch.setattr(settings, "google_places_api_key", "")
    response = client.get("/api/adoption-places", params=HERE)
    assert response.status_code == 503
    assert "configurada" in response.json()["detail"]


def test_google_error_and_daily_limit(client, monkeypatch):
    def broken(lat, lng):
        raise OSError("sem internet")

    monkeypatch.setattr(places, "_ask_google", broken)
    assert client.get("/api/adoption-places", params=HERE).status_code == 503

    monkeypatch.setattr(settings, "places_daily_limit", 1)
    # A chamada que falhou já contou; a próxima área nova passa do limite sem chamar o Google.
    monkeypatch.setattr(places, "_ask_google", lambda lat, lng: pytest.fail("não devia chamar o Google"))
    assert client.get("/api/adoption-places", params={"lat": -10.0, "lng": -50.0}).status_code == 503
