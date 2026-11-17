"""Locais de adoção (ONGs, abrigos, centros de zoonoses) pela Google Places API.

A chave fica só no servidor (variável GOOGLE_PLACES_API_KEY). O site chama a
nossa API, nunca o Google direto, e o resultado fica guardado por algumas horas
para economizar a cota gratuita.
"""
import json
import time
from datetime import date
from urllib.request import Request, urlopen

from app.core.config import settings

SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
SEARCH_TEXT = "ONG de adoção de animais abrigo de cães e gatos"
# Só os campos do plano "Pro" (mais barato). Telefone e avaliação custariam mais.
FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.googleMapsUri",
        "places.businessStatus",
    ]
)
RADIUS_METERS = 30000.0
CACHE_SECONDS = 12 * 60 * 60


class PlacesNotConfigured(Exception):
    """Sem chave da API: a busca de locais fica desligada."""


class PlacesUnavailable(Exception):
    """O Google não respondeu ou o limite do dia acabou."""


# (lat, lng arredondados) -> (quando buscou, locais)
_cache: dict[tuple[float, float], tuple[float, list[dict]]] = {}
_calls_today: dict[date, int] = {}


def _area_key(lat: float, lng: float) -> tuple[float, float]:
    # Uma casa decimal (~11 km): quem está no mesmo bairro usa a mesma busca.
    return round(lat, 1), round(lng, 1)


def _ask_google(lat: float, lng: float) -> list[dict]:
    body = {
        "textQuery": SEARCH_TEXT,
        "languageCode": "pt-BR",
        "regionCode": "BR",
        "pageSize": 20,
        "locationBias": {"circle": {"center": {"latitude": lat, "longitude": lng}, "radius": RADIUS_METERS}},
    }
    request = Request(
        SEARCH_URL,
        data=json.dumps(body).encode(),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.google_places_api_key,
            "X-Goog-FieldMask": FIELD_MASK,
        },
    )
    with urlopen(request, timeout=8) as response:
        return json.load(response).get("places", [])


def _simplify(place: dict) -> dict | None:
    location = place.get("location") or {}
    name = (place.get("displayName") or {}).get("text")
    if not name or "latitude" not in location or place.get("businessStatus", "OPERATIONAL") != "OPERATIONAL":
        return None
    return {
        "id": place["id"],
        "name": name,
        "address": place.get("formattedAddress", ""),
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "maps_url": place.get("googleMapsUri"),
    }


def search_adoption_places(lat: float, lng: float) -> list[dict]:
    """Locais de adoção perto do ponto. Usa o cache quando a área já foi buscada."""
    if not settings.google_places_api_key:
        raise PlacesNotConfigured
    key = _area_key(lat, lng)
    cached = _cache.get(key)
    if cached and time.time() - cached[0] < CACHE_SECONDS:
        return cached[1]

    # Teto de chamadas por dia: protege a cota gratuita se alguém abusar da página.
    today = date.today()
    if today not in _calls_today:
        _calls_today.clear()
        _calls_today[today] = 0
    if _calls_today[today] >= settings.places_daily_limit:
        raise PlacesUnavailable
    _calls_today[today] += 1
    try:
        raw = _ask_google(*key)
    except Exception as error:  # Sem internet, chave inválida ou cota estourada no Google.
        raise PlacesUnavailable from error
    places = [item for item in (_simplify(place) for place in raw) if item]
    _cache[key] = (time.time(), places)
    return places
