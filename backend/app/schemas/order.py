from pydantic import BaseModel
from datetime import date
from typing import Optional


class OrderOut(BaseModel):
    id_pedido: int
    id_cliente: int
    id_produto: int
    data_pedido: date
    quantidade: int
    valor_unitario: float
    valor_total: float
    status: str
    metodo_pagamento: str
    nome_cliente: str
    estado_cliente: Optional[str] = None
    nome_produto: str
    categoria_produto: str
    ano: int
    mes: int
    trimestre: int


class OrderListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[OrderOut]
