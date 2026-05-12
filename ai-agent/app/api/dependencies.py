"""Dependências da API e conversores entre payload HTTP e contexto interno."""

from __future__ import annotations

from typing import Any

from app.agents.orchestrator import AgentOrchestrator
from app.memory.conversation_store import (
    InMemoryConversationStore,
    get_default_conversation_store,
)
from app.models.api import AskRequest
from app.models.deps import Deps


def get_orchestrator() -> AgentOrchestrator:
    """Instancia o orquestrador usado pelos endpoints HTTP."""

    return AgentOrchestrator(debug=False)


def get_conversation_store() -> InMemoryConversationStore:
    """Retorna o store volátil de memória conversacional curta."""

    return get_default_conversation_store()


def deps_from_request(request: AskRequest, *, conn: Any | None = None) -> Deps:
    """Traduz permissões do request em ``Deps`` para guardrails e execução."""

    allowed_columns = None
    if request.allowed_columns is not None:
        allowed_columns = {
            table: frozenset(columns)
            for table, columns in request.allowed_columns.items()
        }

    return Deps(
        conn=conn,
        conversation_id=request.conversation_id,
        user_id=request.user_id,
        tenant_id=request.tenant_id,
        roles=frozenset(request.roles),
        allowed_tables=(
            frozenset(request.allowed_tables)
            if request.allowed_tables is not None
            else None
        ),
        allowed_columns=allowed_columns,
        allow_all_schema_access=request.allow_all_schema_access,
        allow_sensitive_pii=request.allow_sensitive_pii,
        require_tenant=request.require_tenant,
    )
