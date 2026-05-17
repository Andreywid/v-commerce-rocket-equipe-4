from pydantic import BaseModel
from datetime import date
from typing import Optional


class ProductCreate(BaseModel):
    nome_produto: str
    categoria: str
    preco_atual: float
    ativo: bool = True
    estoque: Optional[int] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None


class ProductUpdate(BaseModel):
    nome_produto: Optional[str] = None
    categoria: Optional[str] = None
    preco_atual: Optional[float] = None
    ativo: Optional[bool] = None
    estoque: Optional[int] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None


class ProductOut(BaseModel):
    id_produto: str
    nome_produto: str
    categoria: str
    preco_atual: Optional[float] = None
    ativo: bool
    estoque: Optional[int] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None
    qtd_vendida_total: int = 0
    receita_total: float = 0.0
    nota_media: Optional[float] = None
    qtd_tickets_associados: int = 0
    classificacao: Optional[str] = None

    model_config = {"from_attributes": True}


class ProductPerformance(ProductOut):
    qtd_vendida_30d: int = 0
    qtd_vendida_90d: int = 0
    receita_30d: float = 0.0
    qtd_tickets_30d: int = 0
    taxa_problema: float = 0.0
    qtd_avaliacoes: int = 0
    pct_recomendam: Optional[float] = None
    qtd_visualizacoes: int = 0
    qtd_carrinho: int = 0
    taxa_conversao: float = 0.0
    data_referencia_calculo: Optional[date] = None


class ProductListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[ProductOut]
