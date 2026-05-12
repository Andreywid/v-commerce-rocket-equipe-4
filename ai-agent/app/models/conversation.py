"""Modelos de memória conversacional segura do agente."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass(frozen=True)
class ConversationKey:
    """Identifica uma conversa isolada por tenant, usuário e sessão."""

    conversation_id: str
    tenant_id: str | None
    user_id: str | None


@dataclass(frozen=True)
class ConversationTurn:
    """
    Turno persistido sem linhas retornadas do banco.

    O objetivo é manter contexto operacional e auditável sem transformar a
    memória em um repositório de PII ou resultados analíticos completos.
    """

    question: str
    sql: str | None = None
    interpretation: str | None = None
    reasoning: tuple[str, ...] = field(default_factory=tuple)
    assumptions: tuple[str, ...] = field(default_factory=tuple)
    error: str | None = None
    created_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
