from fastapi import HTTPException
from app.repositories import order_repository
from app.schemas.order import OrderOut, OrderListResponse


def get_orders(
    status: str | None,
    categoria: str | None,
    estado: str | None,
    id_cliente: int | None,
    data_inicio: str | None,
    data_fim: str | None,
    page: int,
    size: int,
) -> OrderListResponse:
    items, total = order_repository.get_all(
        status, categoria, estado, id_cliente, data_inicio, data_fim, page, size
    )
    return OrderListResponse(
        total=total, page=page, size=size,
        items=[OrderOut(**o) for o in items],
    )


def get_order(id_pedido: int) -> OrderOut:
    order = order_repository.get_by_id(id_pedido)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return OrderOut(**order)
