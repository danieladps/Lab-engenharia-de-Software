"""Carrega dados fictícios para a demonstração. Rode antes: alembic upgrade head."""

import secrets

from sqlalchemy import inspect, select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal, engine
from app.models import Pet, User

# Contas fictícias (domínio .example não existe). Nada de dado real aqui.
DEMO_USERS = [
    {"name": "Casa Amora", "email": "abrigo@petlume.example", "city": "São Paulo"},
    {"name": "Visitante Demo", "email": "visitante@petlume.example", "city": "São Paulo"},
]


def seed_demo_data() -> None:
    if not settings.seed_demo_data:
        return
    if not inspect(engine).has_table("users"):
        raise SystemExit("Banco sem tabelas. Rode primeiro: alembic upgrade head")

    with SessionLocal() as db:
        if db.scalar(select(User.id).limit(1)) is not None:
            print("O banco já tem dados; nada foi adicionado.")
            return

        # A senha das contas de demonstração vem do .env; se não houver, é gerada agora.
        password = settings.demo_user_password or secrets.token_urlsafe(9)
        users = [User(**data, password_hash=hash_password(password)) for data in DEMO_USERS]
        db.add_all(users)
        db.flush()
        shelter = users[0]
        db.add_all(
            [
                Pet(
                    owner_id=shelter.id, name="Pingo", species="Cão", breed="Vira-lata caramelo", size="medium", age_years=2,
                    city="São Paulo", description="Carinhoso, curioso e apaixonado por passeios. Está vacinado e pronto para conhecer uma nova família.",
                    image_url="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85", donor_name="Casa Amora",
                ),
                Pet(
                    owner_id=shelter.id, name="Amora", species="Gato", breed="SRD", size="small", age_years=1,
                    city="São Paulo", description="Companheira tranquila que adora uma janela ensolarada. Castrada e com vacinação em dia.",
                    image_url="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85", donor_name="Casa Amora",
                ),
                Pet(
                    owner_id=shelter.id, name="Bento", species="Cão", breed="Beagle", size="medium", age_years=4,
                    city="Santo André", description="Um amigo alegre e sociável, acostumado a conviver com pessoas e outros animais.",
                    image_url="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=85", donor_name="Casa Amora",
                ),
            ]
        )
        db.commit()

    print("Dados de demonstração adicionados. Contas para entrar no site:")
    for data in DEMO_USERS:
        print(f"  {data['name']}: {data['email']}")
    if settings.demo_user_password:
        print("  Senha: a definida em DEMO_USER_PASSWORD no .env")
    else:
        print(f"  Senha (gerada agora, anote): {password}")


if __name__ == "__main__":
    seed_demo_data()
