from pydantic import BaseModel
from datetime import date
from typing import Optional


class ReviewOut(BaseModel):
    id_avaliacao: int
    id_cliente: int
    id_pedido: Optional[int] = None
    id_produto: int
    nota_produto: int
    nota_nps: int
    recomenda: bool
    comentario: Optional[str] = None
    sentimento: str
    data_avaliacao: date
    nome_produto: str
    categoria_produto: str
    nome_cliente: str
