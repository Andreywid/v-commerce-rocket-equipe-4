from pydantic import BaseModel
from datetime import date
from typing import Optional


class CustomerOut(BaseModel):
    id_cliente: str
    nome: str
    email: str
    telefone: Optional[str] = None
    data_cadastro: Optional[date] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    origem: Optional[str] = None
    qtd_pedidos_total: int = 0
    valor_total_gasto: float = 0.0
    ticket_medio: float = 0.0
    data_ultimo_pedido: Optional[date] = None
    qtd_tickets_abertos: int = 0
    segmento_ltv: Optional[str] = None
    is_ativo_90d: bool = True
    is_em_risco: bool = False

    model_config = {"from_attributes": True}


class Customer360(CustomerOut):
    qtd_pedidos_aprovados: int = 0
    qtd_pedidos_recusados: int = 0
    qtd_pedidos_reembolsados: int = 0
    qtd_pedidos_processando: int = 0
    data_primeiro_pedido: Optional[date] = None
    qtd_tickets_total: int = 0
    qtd_tickets_resolvidos: int = 0
    qtd_avaliacoes: int = 0
    nota_media_dada: Optional[float] = None
    nps_medio_avaliacoes_cliente: Optional[float] = None
    qtd_eventos_clickstream: int = 0
    canal_preferido: Optional[str] = None
    data_referencia_calculo: Optional[date] = None


class CustomerListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[CustomerOut]
