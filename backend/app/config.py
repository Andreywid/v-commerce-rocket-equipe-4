from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vcommerce.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str
    ADMIN_NAME: str = "Admin V-Commerce"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
