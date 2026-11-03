from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Adoption, Favorite, Pet, User
from app.schemas import MyAdoption, PetManagement, PetRead

router = APIRouter(prefix="/me", tags=["Minha conta"])


@router.get("/pets", response_model=list[PetManagement])
def my_pets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Anúncios do usuário logado, com os interesses recebidos em cada um."""
    pets = db.scalars(
        select(Pet)
        .options(selectinload(Pet.adoptions).selectinload(Adoption.user))
        .where(Pet.owner_id == user.id)
        .order_by(Pet.created_at.desc())
    ).all()
    # Pedidos em aberto primeiro; depois os respondidos, do mais recente para o mais antigo.
    def order(adoption):
        return (adoption.status != "pending", -adoption.created_at.timestamp())

    return [{"pet": pet, "adoptions": sorted(pet.adoptions, key=order)} for pet in pets]


@router.get("/adoptions", response_model=list[MyAdoption])
def my_adoptions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Pedidos de adoção que o usuário logado enviou."""
    adoptions = db.scalars(
        select(Adoption)
        .options(selectinload(Adoption.pet).selectinload(Pet.owner))
        .where(Adoption.user_id == user.id)
        .order_by(Adoption.created_at.desc(), Adoption.id.desc())
    ).all()
    return [
        {
            "id": adoption.id,
            "message": adoption.message,
            "status": adoption.status,
            "created_at": adoption.created_at,
            "decided_at": adoption.decided_at,
            "pet": adoption.pet,
            "owner_contact": (
                {"name": adoption.pet.donor_name, "email": adoption.pet.owner.email}
                if adoption.status == "approved"
                else None
            ),
        }
        for adoption in adoptions
    ]


@router.get("/favorites", response_model=list[PetRead])
def my_favorites(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Pets que o usuário salvou, do mais recente para o mais antigo."""
    favorites = db.scalars(
        select(Favorite)
        .options(selectinload(Favorite.pet))
        .where(Favorite.user_id == user.id)
        .order_by(Favorite.created_at.desc(), Favorite.id.desc())
    ).all()
    return [favorite.pet for favorite in favorites]


@router.put("/favorites/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def add_favorite(pet_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Salva o pet. Repetir a chamada não cria outro registro."""
    if db.get(Pet, pet_id) is None:
        raise HTTPException(status_code=404, detail="Pet não encontrado.")
    exists = db.scalar(select(Favorite.id).where(Favorite.user_id == user.id, Favorite.pet_id == pet_id))
    if exists is None:
        db.add(Favorite(user_id=user.id, pet_id=pet_id))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()  # dois cliques ao mesmo tempo: o outro já salvou
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/favorites/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(pet_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Remove o pet dos favoritos. Se não estava salvo, não faz nada."""
    favorite = db.scalar(select(Favorite).where(Favorite.user_id == user.id, Favorite.pet_id == pet_id))
    if favorite is not None:
        db.delete(favorite)
        db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
