from fastapi import HTTPException
from app.repositories import support_repository
from app.schemas.support_ticket import TicketOut, TicketListResponse, TicketCreate, TicketUpdate


def get_tickets(
    id_cliente: str | None,
    tipo: list[str] | None,
    status: list[str] | None,
    sla_estourado: bool | None,
    data_abertura: str | None,
    nome: str | None,
    satisfacao: list[str] | None,
    page: int,
    size: int,
    sort_by: str | None = None,
    order: str | None = None,
) -> TicketListResponse:
    items, total = support_repository.get_all(id_cliente, tipo, status, sla_estourado, data_abertura, nome, satisfacao, page, size, sort_by, order)
    return TicketListResponse(
        total=total, page=page, size=size,
        items=[TicketOut.model_validate(t) for t in items],
    )


def get_ticket(id_ticket: str) -> TicketOut:
    ticket = support_repository.get_by_id(id_ticket)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return TicketOut.model_validate(ticket)


def create_ticket(data: TicketCreate) -> TicketOut:
    ticket = support_repository.create(data.model_dump())
    return TicketOut.model_validate(ticket)


def update_ticket(id_ticket: str, data: TicketUpdate) -> TicketOut:
    updated = support_repository.update(id_ticket, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return TicketOut.model_validate(updated)


def delete_ticket(id_ticket: str) -> None:
    if not support_repository.delete(id_ticket):
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
