"""Rotas HTTP expostas pelo AI Agent."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.agents.orchestrator import AgentOrchestrator
from app.api.dependencies import deps_from_request, get_orchestrator
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
) -> AskResponse:
    """Recebe uma pergunta e devolve a resposta estruturada do orquestrador."""

    if request.execute:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Database execution is not configured for API requests yet",
        )

    result = await orchestrator.ask(
        question=request.question,
        deps=deps_from_request(request),
    )
    return AskResponse.from_orchestrator(result)
