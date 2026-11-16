"""Localização das cidades dos anúncios.

Cada anúncio guarda as coordenadas do centro da cidade (não o endereço de quem
anunciou). Elas vêm do Nominatim, a API pública de mapas do OpenStreetMap.
"""
import json
import math
import unicodedata
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import settings

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
# O Nominatim pede um nome que identifique quem chama a API.
USER_AGENT = "PetLume/1.0 (projeto academico de adocao de pets)"

# Cidade -> coordenadas, para não perguntar de novo a mesma cidade.
_cache: dict[str, tuple[float, float] | None] = {}


def _key(city: str) -> str:
    text = unicodedata.normalize("NFKD", city.strip().lower())
    return "".join(ch for ch in text if not unicodedata.combining(ch))


def _ask_nominatim(city: str) -> tuple[float, float] | None:
    query = urlencode({"city": city, "country": "Brasil", "format": "jsonv2", "limit": 1})
    request = Request(f"{NOMINATIM_URL}?{query}", headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=5) as response:
        results = json.load(response)
    if not results:
        return None
    return float(results[0]["lat"]), float(results[0]["lon"])


def geocode_city(city: str) -> tuple[float, float] | None:
    """Coordenadas do centro da cidade, ou None se não achar ou a API não responder."""
    if not settings.geocoding_enabled or not city.strip():
        return None
    key = _key(city)
    if key not in _cache:
        try:
            _cache[key] = _ask_nominatim(city.strip())
        except Exception:  # Sem internet ou API fora do ar: o anúncio sai sem distância.
            return None
    return _cache[key]


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Distância em linha reta entre dois pontos (fórmula de Haversine)."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))
