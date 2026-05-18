"""Configuração compartilhada dos modelos LLM usados pelos agentes."""

from __future__ import annotations

import os

DEFAULT_MODEL = "google-gla:gemini-2.5-flash-lite"


def get_model_name(default: str = DEFAULT_MODEL) -> str:
    """Retorna o modelo configurado por ambiente ou o Gemini 2.5 Flash-Lite."""

    return os.getenv("LLM_MODEL", default)


def configure_provider_api_keys() -> None:
    """
    Compatibiliza o ``API_KEY`` genérico com o provider Google do PydanticAI.

    O PydanticAI espera ``GOOGLE_API_KEY`` para modelos ``google-gla:*``.
    """

    if not os.getenv("GOOGLE_API_KEY") and os.getenv("API_KEY"):
        os.environ["GOOGLE_API_KEY"] = os.environ["API_KEY"]
