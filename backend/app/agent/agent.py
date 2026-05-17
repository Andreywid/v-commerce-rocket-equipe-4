"""Façade: encaminha /agent/chat ao AgentOrchestrator do ai-agent via HTTP."""

from __future__ import annotations

from typing import Any

import httpx

from app.config import settings

# Cliente reutilizado entre requests — evita overhead de conexão TCP a cada chamada.
_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=settings.AI_AGENT_URL,
            timeout=60.0,
        )
    return _client


async def chat(message: str, session_id: str | None) -> dict[str, Any]:
    """Envia a pergunta ao ai-agent e normaliza a resposta para o contrato do backend.

    Mapeia:
      question       <- message
      conversation_id <- session_id
      explanation    -> answer
      sql            -> sql_used
      rows           -> data
    """
    payload: dict[str, Any] = {
        "question": message,
        "execute": True,           # executa o SQL gerado contra o banco Gold
        "allow_all_schema_access": True,  # auth já validada pelo JWT do backend
    }
    if session_id:
        payload["conversation_id"] = session_id

    try:
        response = await _get_client().post("/ask", json=payload)
        response.raise_for_status()
        data = response.json()
    except httpx.HTTPStatusError as exc:
        return {
            "answer": f"O agente retornou um erro ({exc.response.status_code}). Tente reformular a pergunta.",
            "sql_used": None,
            "data": [],
            "session_id": session_id,
        }
    except httpx.RequestError:
        return {
            "answer": "O agente de IA está temporariamente indisponível. Verifique se o serviço está rodando.",
            "sql_used": None,
            "data": [],
            "session_id": session_id,
        }

    return {
        "answer": data.get("explanation", "Sem resposta."),
        "sql_used": data.get("sql"),
        "data": data.get("rows", []),
        "session_id": data.get("conversation_id") or session_id,
    }
