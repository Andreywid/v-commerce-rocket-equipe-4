from fastapi import HTTPException
from app.repositories import customer_repository, order_repository, support_repository, review_repository, clickstream_repository
from app.schemas.customer import CustomerOut, Customer360, CustomerListResponse
from app.schemas.order import OrderOut, OrderListResponse
from app.schemas.support_ticket import TicketOut, TicketListResponse
from app.schemas.review import ReviewOut, ReviewListResponse


def get_customers(
    nome: str | None,
    email: str | None,
    estado: str | None,
    segmento: str | None,
    page: int,
    size: int,
) -> CustomerListResponse:
    items, total = customer_repository.get_all(nome, email, estado, segmento, page, size)
    return CustomerListResponse(
        total=total, page=page, size=size,
        items=[CustomerOut(**c) for c in items],
    )


def get_customer_360(id_cliente: int) -> Customer360:
    customer = customer_repository.get_by_id(id_cliente)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Customer360(**customer)


def get_customer_orders(id_cliente: int, page: int, size: int) -> OrderListResponse:
    _require_customer(id_cliente)
    orders = order_repository.get_by_customer(id_cliente)
    total = len(orders)
    start = (page - 1) * size
    items = orders[start:start + size]
    return OrderListResponse(total=total, page=page, size=size, items=[OrderOut(**o) for o in items])


def get_customer_tickets(id_cliente: int, page: int, size: int) -> TicketListResponse:
    _require_customer(id_cliente)
    tickets = support_repository.get_by_customer(id_cliente)
    total = len(tickets)
    start = (page - 1) * size
    items = tickets[start:start + size]
    return TicketListResponse(total=total, page=page, size=size, items=[TicketOut(**t) for t in items])


def get_customer_reviews(id_cliente: int, page: int, size: int) -> ReviewListResponse:
    _require_customer(id_cliente)
    reviews = review_repository.get_by_customer(id_cliente)
    total = len(reviews)
    start = (page - 1) * size
    items = reviews[start:start + size]
    return ReviewListResponse(total=total, page=page, size=size, items=[ReviewOut(**r) for r in items])


def get_customer_clickstream(id_cliente: int, periodo: int) -> list[dict]:
    _require_customer(id_cliente)
    return clickstream_repository.get_by_customer(id_cliente, periodo)


def _require_customer(id_cliente: int) -> None:
    if not customer_repository.get_by_id(id_cliente):
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
