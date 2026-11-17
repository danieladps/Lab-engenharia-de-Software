from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core import geocoding
from app.db.session import get_db
from app.models import Pet, User
from app.schemas import PetCreate, PetRead, PetUpdate

router = APIRouter(prefix="/pets", tags=["Adoção"])

LISTED_STATUSES = ("available", "adoption_pending")


@router.get("", response_model=list[PetRead])
def list_pets(
    species: str | None = None,
    size: str | None = None,
    city: str | None = None,
    lat: float | None = Query(default=None, ge=-90, le=90, description="Latitude de quem procura (não é guardada)"),
    lng: float | None = Query(default=None, ge=-180, le=180, description="Longitude de quem procura (não é guardada)"),
    max_km: float | None = Query(default=None, gt=0, le=5000, description="Distância máxima, com lat e lng"),
    db: Session = Depends(get_db),
):
    # Pets com pedido em andamento continuam na busca (com a etiqueta "Pedido recebido"):
    # se o pedido for recusado, o pet volta a aceitar outros. Só os já adotados saem.
    query = select(Pet).where(Pet.status.in_(LISTED_STATUSES))
    if species and species != "Todos":
        query = query.where(Pet.species == species)
    if size and size != "Todos":
        query = query.where(Pet.size == size)
    if city:
        query = query.where(Pet.city.ilike(f"%{city.strip()}%"))
    pets = db.scalars(query.order_by(Pet.created_at.desc())).all()
    if lat is None or lng is None:
        return pets

    _fill_missing_coordinates(pets, db)
    items = []
    for pet in pets:
        distance = None
        if pet.latitude is not None and pet.longitude is not None:
            distance = round(geocoding.distance_km(lat, lng, pet.latitude, pet.longitude), 1)
        if max_km is not None and (distance is None or distance > max_km):
            continue
        items.append(PetRead.model_validate(pet).model_copy(update={"distance_km": distance}))
    # Mais perto primeiro; anúncios sem cidade encontrada vão para o fim.
    items.sort(key=lambda item: (item.distance_km is None, item.distance_km or 0))
    return items


def _fill_missing_coordinates(pets, db: Session, limit: int = 10) -> None:
    """Anúncios antigos (de antes da localização) ganham coordenadas na primeira busca por perto."""
    missing = [pet for pet in pets if pet.latitude is None]
    if not missing:
        return
    found: dict[str, tuple[float, float] | None] = {}
    for pet in missing:
        if pet.city not in found and len(found) >= limit:
            continue
        if pet.city not in found:
            found[pet.city] = geocoding.geocode_city(pet.city)
        if found[pet.city]:
            pet.latitude, pet.longitude = found[pet.city]
    db.commit()


@router.post("", response_model=PetRead, status_code=status.HTTP_201_CREATED)
def create_pet(
    payload: PetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = Pet(**payload.model_dump(), owner_id=user.id)
    coordinates = geocoding.geocode_city(pet.city)
    if coordinates:
        pet.latitude, pet.longitude = coordinates
    db.add(pet)
    db.commit()
    db.refresh(pet)
    return pet


@router.get("/{pet_id}", response_model=PetRead)
def get_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.scalar(select(Pet).where(Pet.id == pet_id))
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet não encontrado.")
    return pet


def _own_pet(pet_id: int, user: User, db: Session) -> Pet:
    """Busca um pet do usuário logado. Para os outros, o pet "não existe"."""
    pet = db.get(Pet, pet_id)
    if pet is None or pet.owner_id != user.id:
        raise HTTPException(status_code=404, detail="Pet não encontrado.")
    return pet


@router.patch("/{pet_id}", response_model=PetRead)
def update_pet(
    pet_id: int,
    payload: PetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """O dono corrige os dados do anúncio. O status (disponível, adotado...) não muda por aqui."""
    pet = _own_pet(pet_id, user, db)
    old_city = pet.city
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(pet, field, value.strip() if isinstance(value, str) else value)
    if pet.city != old_city:
        coordinates = geocoding.geocode_city(pet.city)
        pet.latitude, pet.longitude = coordinates if coordinates else (None, None)
    db.commit()
    db.refresh(pet)
    return pet


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(pet_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove o anúncio. Só vale para pets disponíveis, para não apagar pedidos em andamento ou aprovados."""
    pet = _own_pet(pet_id, user, db)
    if pet.status == "adoption_pending":
        raise HTTPException(status_code=409, detail="Responda o pedido de adoção em aberto antes de remover o anúncio.")
    if pet.status == "adopted":
        raise HTTPException(status_code=409, detail="Este pet já foi adotado; o anúncio fica como histórico da adoção.")
    db.delete(pet)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
