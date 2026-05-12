"""Contexto compartilhado entre API, guardrails, agentes e executor."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Deps:
    """Dependências e contexto de autorização injetados no fluxo do agente."""

    conn: Any | None
    user_id: str | None = None
    tenant_id: str | None = None
    roles: frozenset[str] = field(default_factory=frozenset)
    allowed_tables: frozenset[str] | None = None
    allowed_columns: dict[str, frozenset[str]] | None = None
    allow_sensitive_pii: bool = False
    require_tenant: bool = False
