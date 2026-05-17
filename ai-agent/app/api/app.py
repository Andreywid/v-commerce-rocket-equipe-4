"""Factory da aplicação FastAPI do AI Agent."""

from __future__ import annotations

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

from app.api.routes import router


def create_app() -> FastAPI:
    """Cria a aplicação FastAPI e registra as rotas públicas do agente."""

    api = FastAPI(
        title="V-Commerce AI Agent",
        version="0.1.0",
    )
    api.include_router(router)
    return api


app = create_app()