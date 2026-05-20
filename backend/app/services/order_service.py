from fastapi import HTTPException
from app.repositories import order_repository
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderListResponse


def get_orders(
    status: list[str] | None,
    categoria: str | None,
    estado: str | None,
    id_cliente: str | None,
    data_inicio: str | None,
    data_fim: str | None,
    nome: str | None,
    valor_min: float | None,
    valor_max: float | None,
    page: int,
    size: int,
    sort_by: str | None = None,
    order: str | None = None,
    dentro_prazo: bool | None = None,
) -> OrderListResponse:
    items, total, total_pendentes, total_aprovados, receita_total = order_repository.get_all(
        status, categoria, estado, id_cliente, data_inicio, data_fim, nome, valor_min, valor_max, page, size, sort_by, order, dentro_prazo
    )
    return OrderListResponse(
        total=total, page=page, size=size,
        items=[OrderOut.model_validate(o) for o in items],
        total_pendentes=total_pendentes,
        total_aprovados=total_aprovados,
        receita_total=receita_total,
    )


def get_order(id_pedido: str) -> OrderOut:
    order = order_repository.get_by_id(id_pedido)
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return OrderOut.model_validate(order)


def create_order(data: OrderCreate) -> OrderOut:
    existing = order_repository.get_by_id(data.id_pedido)
    if existing:
        raise HTTPException(status_code=409, detail="Já existe um pedido com esse número")
    order = order_repository.create(data.model_dump())
    if not order:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return OrderOut.model_validate(order)


def update_order(id_pedido: str, data: OrderUpdate) -> OrderOut:
    order = order_repository.update(id_pedido, data.model_dump(exclude_none=True))
    if not order:
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
    return OrderOut.model_validate(order)


def delete_order(id_pedido: str) -> None:
    if not order_repository.delete(id_pedido):
        raise HTTPException(status_code=404, detail="Pedido não encontrado")
