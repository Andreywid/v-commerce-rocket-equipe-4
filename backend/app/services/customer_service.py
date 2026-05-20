from fastapi import HTTPException
from app.repositories import customer_repository, order_repository, support_repository, review_repository, clickstream_repository
from app.schemas.customer import CustomerOut, Customer360, CustomerListResponse, CustomerCreate, CustomerUpdate, CustomerStats
from app.schemas.order import OrderOut, OrderListResponse
from app.schemas.support_ticket import TicketOut, TicketListResponse
from app.schemas.review import ReviewOut, ReviewListResponse


def get_customers(
    nome: str | None,
    email: str | None,
    estados: list[str] | None,
    segmentos: list[str] | None,
    is_recorrente: bool | None,
    min_total: float | None,
    max_total: float | None,
    page: int,
    size: int,
    sort_by: str | None = None,
    order: str | None = None,
) -> CustomerListResponse:
    items, total = customer_repository.get_all(nome, email, estados, segmentos, is_recorrente, min_total, max_total, page, size, sort_by, order)
    return CustomerListResponse(
        total=total, page=page, size=size,
        items=[CustomerOut.model_validate(c) for c in items],
    )


def get_customer_360(id_cliente: str) -> Customer360:
    customer = customer_repository.get_by_id(id_cliente)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Customer360.model_validate(customer)


def get_customer_orders(id_cliente: str, page: int, size: int) -> OrderListResponse:
    _require_customer(id_cliente)
    orders = order_repository.get_by_customer(id_cliente)
    total = len(orders)
    start = (page - 1) * size
    items = orders[start:start + size]
    return OrderListResponse(total=total, page=page, size=size, items=[OrderOut.model_validate(o) for o in items])


def get_customer_tickets(id_cliente: str, page: int, size: int) -> TicketListResponse:
    _require_customer(id_cliente)
    tickets = support_repository.get_by_customer(id_cliente)
    total = len(tickets)
    start = (page - 1) * size
    items = tickets[start:start + size]
    return TicketListResponse(total=total, page=page, size=size, items=[TicketOut.model_validate(t) for t in items])


def get_customer_reviews(id_cliente: str, page: int, size: int) -> ReviewListResponse:
    _require_customer(id_cliente)
    reviews = review_repository.get_by_customer(id_cliente)
    total = len(reviews)
    start = (page - 1) * size
    items = reviews[start:start + size]
    return ReviewListResponse(total=total, page=page, size=size, items=[ReviewOut.model_validate(r) for r in items])


def get_customer_clickstream(id_cliente: str, periodo: int) -> list[dict]:
    _require_customer(id_cliente)
    return [c.__dict__ for c in clickstream_repository.get_by_customer(id_cliente, periodo)]


def get_customer(id_cliente: str) -> CustomerOut:
    customer = customer_repository.get_by_id(id_cliente)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return CustomerOut.model_validate(customer)


def create_customer(data: CustomerCreate) -> CustomerOut:
    customer = customer_repository.create(data.model_dump())
    return CustomerOut.model_validate(customer)


def update_customer(id_cliente: str, data: CustomerUpdate) -> CustomerOut:
    updated = customer_repository.update(id_cliente, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return CustomerOut.model_validate(updated)


def delete_customer(id_cliente: str) -> None:
    if not customer_repository.delete(id_cliente):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")


def get_customer_stats() -> CustomerStats:
    return CustomerStats(**customer_repository.get_stats())


def _require_customer(id_cliente: str) -> None:
    if not customer_repository.get_by_id(id_cliente):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
