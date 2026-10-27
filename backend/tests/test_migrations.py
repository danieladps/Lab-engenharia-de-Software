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
