from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Pet, User
from app.schemas import PetCreate, PetRead

router = APIRouter(prefix="/pets", tags=["Adoção"])


@router.get("", response_model=list[PetRead])
def list_pets(
    species: str | None = None,
    size: str | None = None,
    city: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(Pet).where(Pet.status == "available")
    if species and species != "Todos":
        query = query.where(Pet.species == species)
    if size and size != "Todos":
        query = query.where(Pet.size == size)
    if city:
        query = query.where(Pet.city.ilike(f"%{city.strip()}%"))
    return db.scalars(query.order_by(Pet.created_at.desc())).all()


@router.post("", response_model=PetRead, status_code=status.HTTP_201_CREATED)
def create_pet(
    payload: PetCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pet = Pet(**payload.model_dump(), owner_id=user.id)
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
