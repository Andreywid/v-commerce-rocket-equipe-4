"""Modelos internos usados pelos fluxos de CLI."""

from __future__ import annotations

from dataclasses import dataclass

from app.models.responses import OrchestratorResult


@dataclass(frozen=True)
class CliRunContext:
    """Contexto compartilhado entre o modo pergunta única e o chat terminal."""

    conversation_id: str | None
    user_id: str | None
    tenant_id: str | None
    roles: frozenset[str]
    allowed_tables: frozenset[str] | None
    allowed_columns: dict[str, frozenset[str]] | None
    allow_all_schema_access: bool
    allow_sensitive_pii: bool
    require_tenant: bool
    debug_memory: bool


@dataclass(frozen=True)
class CliAskResult:
    """Resultado da execução de uma pergunta via CLI."""

    conversation_id: str
    previous_turn_count: int
    response: OrchestratorResult
