from sqlalchemy import select

from app.core.config import settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Pet


def seed_demo_data() -> None:
    if not settings.seed_demo_data:
        return
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        existing_pet = db.scalar(select(Pet.id).limit(1))
        if existing_pet is None:
            db.add_all(
                [
                    Pet(
                        name="Pingo", species="Cão", breed="Vira-lata caramelo", size="medium", age_years=2,
                        city="São Paulo", description="Carinhoso, curioso e apaixonado por passeios. Está vacinado e pronto para conhecer uma nova família.",
                        image_url="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85", donor_name="Casa Amora",
                    ),
                    Pet(
                        name="Amora", species="Gato", breed="SRD", size="small", age_years=1,
                        city="São Paulo", description="Companheira tranquila que adora uma janela ensolarada. Castrada e com vacinação em dia.",
                        image_url="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85", donor_name="Casa Amora",
                    ),
                    Pet(
                        name="Bento", species="Cão", breed="Beagle", size="medium", age_years=4,
                        city="Santo André", description="Um amigo alegre e sociável, acostumado a conviver com pessoas e outros animais.",
                        image_url="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=85", donor_name="Lar dos Bichos",
                    ),
                ]
            )
            db.commit()
            print("Anúncios de demonstração adicionados.")


if __name__ == "__main__":
    seed_demo_data()
