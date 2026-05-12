"""Dependências da API e conversores entre payload HTTP e contexto interno."""

from __future__ import annotations

from app.agents.orchestrator import AgentOrchestrator
from app.models.api import AskRequest
from app.models.deps import Deps


def get_orchestrator() -> AgentOrchestrator:
    """Instancia o orquestrador usado pelos endpoints HTTP."""

    return AgentOrchestrator(debug=False)


def deps_from_request(request: AskRequest) -> Deps:
    """Traduz permissões do request em ``Deps`` para guardrails e execução."""

    allowed_columns = None
    if request.allowed_columns is not None:
        allowed_columns = {
            table: frozenset(columns)
            for table, columns in request.allowed_columns.items()
        }

    return Deps(
        conn=None,
        user_id=request.user_id,
        tenant_id=request.tenant_id,
        roles=frozenset(request.roles),
        allowed_tables=(
            frozenset(request.allowed_tables)
            if request.allowed_tables is not None
            else None
        ),
        allowed_columns=allowed_columns,
        allow_sensitive_pii=request.allow_sensitive_pii,
        require_tenant=request.require_tenant,
    )
