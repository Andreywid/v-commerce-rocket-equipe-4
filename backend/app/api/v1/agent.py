from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/agent", tags=["agent"])

SUGGESTED_QUESTIONS = [
    "Quais foram os 5 produtos mais vendidos no último mês?",
    "Qual a receita total por categoria em 2026?",
    "Quais clientes do estado de SP gastaram mais de R$3.000?",
    "Qual o ticket médio por método de pagamento?",
    "Quantos tickets estão abertos com SLA estourado?",
    "Qual produto tem a maior taxa de problemas de suporte?",
]


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    sql_used: str | None = None
    data: list[Any] = []
    session_id: str | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    # Integration point: the AI team implements app/agent/agent.py and exposes:
    #   async def chat(message: str, session_id: str | None) -> AgentResponse
    # Uncomment below and remove the placeholder when the agent module is ready:
    #
    # from app.agent.agent import chat as agent_chat
    # result = await agent_chat(body.message, body.session_id)
    # return ChatResponse(**result)

    return ChatResponse(
        answer="Agente de IA ainda não integrado. O time de IA está desenvolvendo este módulo.",
        sql_used=None,
        data=[],
        session_id=body.session_id,
    )


@router.get("/suggestions", response_model=list[str])
def get_suggestions():
    return SUGGESTED_QUESTIONS
