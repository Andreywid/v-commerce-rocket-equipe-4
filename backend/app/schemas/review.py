from pydantic import BaseModel
from datetime import date
from typing import Optional


class ReviewOut(BaseModel):
    id_avaliacao: str
    id_cliente: str
    id_pedido: str
    id_produto: str
    nota_produto: int
    nota_nps: int
    recomenda: bool
    comentario: Optional[str] = None
    sentimento: str
    data_avaliacao: date
    nome_produto: str
    categoria_produto: str
    nome_cliente: str

    model_config = {"from_attributes": True}



class ReviewListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[ReviewOut]
