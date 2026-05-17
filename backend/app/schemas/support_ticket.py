from pydantic import BaseModel
from datetime import date
from typing import Optional


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


class TicketListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[TicketOut]
