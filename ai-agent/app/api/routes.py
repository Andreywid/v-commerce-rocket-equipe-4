"""Rotas HTTP expostas pelo AI Agent."""

from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends

from app.agents.orchestrator import AgentOrchestrator
from app.api.dependencies import (
    deps_from_request,
    get_conversation_store,
    get_orchestrator,
)
from app.database.mock_gold import ensure_mock_sqlite
from app.memory.conversation_store import (
    InMemoryConversationStore,
    build_question_with_memory_and_context,
)
from app.models.api import AskRequest, AskResponse, HealthResponse


router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Confirma que a API está respondendo."""

    return HealthResponse()


@router.post("/ask", response_model=AskResponse)
async def ask(
    request: AskRequest,
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
    conversation_store: InMemoryConversationStore = Depends(get_conversation_store),
) -> AskResponse:
    """Recebe uma pergunta e devolve a resposta estruturada do orquestrador."""

    conversation_id = (
        request.conversation_id
        or conversation_store.new_conversation_id()
    )
    previous_turns = conversation_store.list_turns(
        conversation_id=conversation_id,
        tenant_id=request.tenant_id,
        user_id=request.user_id,
    )

    conn: sqlite3.Connection | None = None
    try:
        if request.execute:
            mock_path = ensure_mock_sqlite()
            conn = sqlite3.connect(mock_path)

        # Usa a versão enriquecida que extrai dados concretos dos turnos anteriores
        question_for_agent = build_question_with_memory_and_context(
            request.question,
            previous_turns,
            conn=conn,
        )

        deps = deps_from_request(request, conn=conn)
        deps.conversation_id = conversation_id

        result = await orchestrator.ask(
            question=question_for_agent,
            deps=deps,
        )
    finally:
        if conn is not None:
            conn.close()

    conversation_store.append_result(
        conversation_id=conversation_id,
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        question=request.question,
        result=result,
    )

    return AskResponse.from_orchestrator(
        result,
        conversation_id=conversation_id,
    )
