from pydantic import BaseModel
from datetime import date
from typing import Optional


class ProductCreate(BaseModel):
    nome_produto: str
    categoria: str
    preco_atual: float
    ativo: bool = True
    estoque_disponivel: Optional[int] = None


class ProductUpdate(BaseModel):
    nome_produto: Optional[str] = None
    categoria: Optional[str] = None
    preco_atual: Optional[float] = None
    ativo: Optional[bool] = None
    estoque_disponivel: Optional[int] = None


class ProductOut(BaseModel):
    id_produto: str
    nome_produto: str
    categoria: str
    preco_atual: Optional[float] = None
    ativo: bool
    fornecedor: Optional[str] = None
    peso_kg: Optional[float] = None
    estoque_disponivel: Optional[int] = None
    data_cadastro_produto: Optional[date] = None
    qtd_vendida_total: int = 0
    receita_total: float = 0.0
    nota_media: Optional[float] = None
    qtd_tickets_associados: int = 0
    taxa_conversao: Optional[float] = None
    classificacao: Optional[str] = None

    model_config = {"from_attributes": True}


class ProductPerformance(ProductOut):
    qtd_vendida_30d: int = 0
    qtd_vendida_90d: int = 0
    receita_30d: float = 0.0
    qtd_tickets_30d: int = 0
    taxa_problema: Optional[float] = None
    qtd_avaliacoes: int = 0
    pct_recomendam: Optional[float] = None
    qtd_visualizacoes: int = 0
    qtd_carrinho: int = 0
    data_referencia_calculo: Optional[date] = None


class ProductListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[ProductOut]
