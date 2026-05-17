from pydantic import BaseModel
from datetime import date
from typing import Optional


class OrderCreate(BaseModel):
    id_pedido: str
    id_produto: str
    data_pedido: date
    quantidade: int
    status: str
    metodo_pagamento: str = "PIX"


class OrderUpdate(BaseModel):
    data_pedido: Optional[date] = None
    status: Optional[str] = None
    id_produto: Optional[str] = None
    quantidade: Optional[int] = None


class OrderOut(BaseModel):
    id_pedido: str
    id_cliente: str
    id_produto: str
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

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[OrderOut]
