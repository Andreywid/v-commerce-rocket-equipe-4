"""Modelos Pydantic usados na interface HTTP do AI Agent."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.models.responses import OrchestratorResult


class HealthResponse(BaseModel):
    """Resposta simples usada pelo endpoint de saúde da API."""

    status: str = "ok"


class AskRequest(BaseModel):
    """Contrato de entrada para perguntas em linguagem natural ao agente."""

    question: str = Field(min_length=1)
    user_id: str | None = None
    tenant_id: str | None = None
    roles: list[str] = Field(default_factory=list)
    allowed_tables: list[str] | None = None
    allowed_columns: dict[str, list[str]] | None = None
    allow_sensitive_pii: bool = False
    require_tenant: bool = False
    execute: bool = False


class AskResponse(BaseModel):
    """Contrato público retornado pelo endpoint ``/ask``."""

    explanation: str
    sql: str | None = None
    rows: list[dict[str, Any]] = Field(default_factory=list)
    interpretation: str | None = None
    reasoning: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    error: str | None = None

    @classmethod
    def from_orchestrator(cls, result: OrchestratorResult) -> "AskResponse":
        """Converte o resultado interno do orquestrador para o modelo da API."""

        return cls(
            explanation=result.explanation,
            sql=result.sql,
            rows=result.rows,
            interpretation=result.interpretation,
            reasoning=result.reasoning,
            assumptions=result.assumptions,
            error=result.error,
        )
