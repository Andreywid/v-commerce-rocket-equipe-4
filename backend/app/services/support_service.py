from fastapi import HTTPException
from app.repositories import support_repository
from app.schemas.support_ticket import TicketOut, TicketListResponse


def get_tickets(
    id_cliente: str | None,
    tipo: str | None,
    status: str | None,
    sla_estourado: bool | None,
    page: int,
    size: int,
) -> TicketListResponse:
    items, total = support_repository.get_all(id_cliente, tipo, status, sla_estourado, page, size)
    return TicketListResponse(
        total=total, page=page, size=size,
        items=[TicketOut.model_validate(t) for t in items],
    )


def get_ticket(id_ticket: str) -> TicketOut:
    ticket = support_repository.get_by_id(id_ticket)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado")
    return TicketOut.model_validate(ticket)
