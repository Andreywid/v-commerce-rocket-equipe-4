from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any
from app.core.deps import get_current_user
from app.agent.agent import chat as agent_chat

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
async def chat(body: ChatRequest, current_user=Depends(get_current_user)):
    result = await agent_chat(body.message, body.session_id)
    return ChatResponse(**result)


@router.get("/suggestions", response_model=list[str])
def get_suggestions(current_user=Depends(get_current_user)):
    return SUGGESTED_QUESTIONS
