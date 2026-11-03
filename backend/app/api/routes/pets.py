from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Pet, User
from app.schemas import PetCreate, PetRead, PetUpdate

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
    for field, value in payload.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(pet, field, value.strip() if isinstance(value, str) else value)
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
