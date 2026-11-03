from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine

from app.db.base import Base


def test_migrations_match_models(tmp_path):
    """Garante que toda mudança nos modelos tem uma migração correspondente."""
    url = f"sqlite:///{tmp_path / 'migracao.db'}"
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", url)

    command.upgrade(config, "head")
    engine = create_engine(url)
    with engine.connect() as connection:
        diff = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    engine.dispose()
    command.downgrade(config, "base")

    assert diff == []


def test_migrations_keep_existing_data(tmp_path):
    """Recriar tabelas no SQLite não pode apagar em cascata pedidos e favoritos."""
    import sqlite3

    url = f"sqlite:///{tmp_path / 'dados.db'}"
    config = Config("alembic.ini")
    config.set_main_option("sqlalchemy.url", url)
    command.upgrade(config, "0002")

    # Dados fictícios inseridos direto, como estariam num banco em uso.
    db = sqlite3.connect(tmp_path / "dados.db")
    db.execute("INSERT INTO users (id, name, email, password_hash, city, created_at) VALUES (1, 'Dono', 'dono@example.com', 'x', 'SP', '2026-01-01'), (2, 'Ana', 'ana@example.com', 'x', 'SP', '2026-01-01')")
    db.execute("INSERT INTO pets (id, owner_id, name, species, breed, size, age_years, city, description, image_url, donor_name, status, created_at) VALUES (1, 1, 'Nina', 'Cão', 'SRD', 'small', 1, 'SP', 'Descrição de teste.', 'https://example.com/n.jpg', 'Dono', 'adoption_pending', '2026-01-01')")
    db.execute("INSERT INTO adoptions (pet_id, user_id, message, status, created_at) VALUES (1, 2, 'Mensagem de teste.', 'pending', '2026-01-02')")
    db.execute("INSERT INTO favorites (user_id, pet_id, created_at) VALUES (2, 1, '2026-01-02')")
    db.commit()
    db.close()

    command.upgrade(config, "head")

    db = sqlite3.connect(tmp_path / "dados.db")
    assert db.execute("SELECT status FROM adoptions").fetchall() == [("pending",)]
    assert db.execute("SELECT COUNT(*) FROM favorites").fetchone()[0] == 1
    db.close()
