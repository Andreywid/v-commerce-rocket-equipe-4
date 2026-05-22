from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Literal, Optional


class CustomerOut(BaseModel):
    id_cliente: str
    nome: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    data_cadastro: Optional[date] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    origem: Optional[str] = None
    maior_de_idade: Optional[bool] = None
    qtd_pedidos_total: int = 0
    valor_total_gasto: Optional[float] = None
    ticket_medio: Optional[float] = None
    data_ultimo_pedido: Optional[date] = None
    qtd_tickets_abertos: int = 0
    segmento_ltv: Optional[str] = None
    is_ativo_90d: Optional[bool] = None
    is_em_risco: bool = False

    model_config = {"from_attributes": True}


class CustomerCreate(BaseModel):
    nome: str
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    data_cadastro: Optional[date] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    origem: Optional[Literal["app", "web", "indicacao"]] = None


class CustomerUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    origem: Optional[Literal["app", "web", "indicacao"]] = None
    segmento_ltv: Optional[Literal["Alto", "Medio", "Baixo"]] = None
    is_ativo_90d: Optional[bool] = None
    is_em_risco: Optional[bool] = None


class Customer360(CustomerOut):
    qtd_pedidos_aprovados: int = 0
    qtd_pedidos_recusados: int = 0
    qtd_pedidos_reembolsados: int = 0
    qtd_pedidos_processando: int = 0
    data_primeiro_pedido: Optional[date] = None
    qtd_tickets_total: int = 0
    qtd_tickets_resolvidos: int = 0
    qtd_avaliacoes: Optional[int] = None
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
    segmento_alto: int = 0


class CustomerStats(BaseModel):
    total_clientes: int
    nps_medio: Optional[float] = None
    nota_media: Optional[float] = None
    top_estado: Optional[str] = None
    top_estado_percentual: Optional[float] = None
    clientes_em_risco: int
    clientes_ativos_90d: int
    segmentos: dict[str, int]
