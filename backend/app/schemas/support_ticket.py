from pydantic import BaseModel, field_validator
from datetime import date, datetime
from typing import Literal, Optional


def _parse_date_flexible(v) -> date | None:
    if v is None or isinstance(v, date):
        return v
    s = str(v)
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        pass
    try:
        return datetime.strptime(s, "%d/%m/%Y").date()
    except ValueError:
        pass
    return date.fromisoformat(s)


class TicketOut(BaseModel):
    id_ticket: str
    id_cliente: str
    id_pedido: Optional[str] = None
    id_produto: Optional[str] = None
    tipo_problema: str
    satisfacao_atendimento: str
    data_abertura: date
    data_resolucao: Optional[date] = None
    tempo_resolucao_horas: Optional[float] = None
    agente_suporte: str
    nota_avaliacao: Optional[int] = None
    status_ticket: str
    sla_estourado: bool = False
    nome_cliente: str
    nome_produto: Optional[str] = None
    data_referencia_calculo: Optional[date] = None

    model_config = {"from_attributes": True}

    @field_validator("data_abertura", "data_resolucao", "data_referencia_calculo", mode="before")
    @classmethod
    def parse_dates(cls, v):
        return _parse_date_flexible(v)


class TicketListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[TicketOut]


class TicketCreate(BaseModel):
    id_cliente: str
    id_pedido: Optional[str] = None
    id_produto: Optional[str] = None
    tipo_problema: Literal["Entrega", "Reembolso", "Produto", "Pagamento"]
    agente_suporte: str
    nome_cliente: str
    nome_produto: Optional[str] = None
    data_abertura: Optional[date] = None


class TicketUpdate(BaseModel):
    tipo_problema: Optional[Literal["Entrega", "Reembolso", "Produto", "Pagamento"]] = None
    satisfacao_atendimento: Optional[Literal["alta", "media", "baixa", "sem_avaliacao"]] = None
    agente_suporte: Optional[str] = None
    nota_avaliacao: Optional[int] = None
    status_ticket: Optional[Literal["Aberto", "Resolvido"]] = None
    data_resolucao: Optional[date] = None
    tempo_resolucao_horas: Optional[float] = None
    sla_estourado: Optional[bool] = None
