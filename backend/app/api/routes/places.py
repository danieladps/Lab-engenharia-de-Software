from fastapi import APIRouter, HTTPException, Query

from app.core import geocoding, places
from app.schemas import AdoptionPlace

router = APIRouter(prefix="/adoption-places", tags=["Onde adotar"])

# Sem a localização de quem procura, busca a partir do centro de São Paulo.
DEFAULT_CENTER = (-23.55, -46.63)


@router.get("", response_model=list[AdoptionPlace])
def list_adoption_places(
    lat: float | None = Query(default=None, ge=-90, le=90, description="Latitude de quem procura (não é guardada)"),
    lng: float | None = Query(default=None, ge=-180, le=180, description="Longitude de quem procura (não é guardada)"),
):
    """ONGs, abrigos e centros de adoção perto de quem procura, do mais perto para o mais longe."""
    if lat is None or lng is None:
        lat, lng = DEFAULT_CENTER
    try:
        found = places.search_adoption_places(lat, lng)
    except places.PlacesNotConfigured:
        raise HTTPException(status_code=503, detail="A busca de locais de adoção ainda não foi configurada.") from None
    except places.PlacesUnavailable:
        raise HTTPException(status_code=503, detail="Não foi possível buscar os locais agora. Tente de novo mais tarde.") from None
    items = [
        {**place, "distance_km": round(geocoding.distance_km(lat, lng, place["latitude"], place["longitude"]), 1)}
        for place in found
    ]
    return sorted(items, key=lambda item: item["distance_km"])
