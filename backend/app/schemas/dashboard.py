from pydantic import BaseModel
from datetime import date


class VendasKPIMes(BaseModel):
    ano: int
    mes: int
    ano_mes: str
    qtd_pedidos: int
    qtd_pedidos_aprovados: int
    qtd_pedidos_recusados: int
    qtd_pedidos_reembolsados: int
    qtd_pedidos_processando: int
    receita_bruta: float
    ticket_medio: float
    qtd_clientes_unicos: int
    qtd_clientes_novos: int
    taxa_aprovacao: float
    taxa_recusa: float
    taxa_reembolso: float
    categoria_mais_vendida: str
    estado_maior_receita: str
    data_referencia_calculo: date


class KPIsResponse(BaseModel):
    periodo: str
    meses: list[VendasKPIMes]


class TopRegiao(BaseModel):
    estado: str
    receita: float
    percentual: float


class TopRegioesResponse(BaseModel):
    regioes: list[TopRegiao]
