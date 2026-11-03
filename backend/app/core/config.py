from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "sqlite:///./petlume_mvp.db"
    cors_origins: str = "http://localhost:5173"
    seed_demo_data: bool = True
    demo_user_password: str = ""
    # Chave que assina os tokens de login. Obrigatória e só no .env (nunca no código).
    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        """Provedores de Postgres (Neon, Supabase, Render) entregam a URL como
        postgres:// ou postgresql://; o SQLAlchemy precisa saber que o driver é o psycopg."""
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value[len(prefix):]
        return value


settings = Settings()
