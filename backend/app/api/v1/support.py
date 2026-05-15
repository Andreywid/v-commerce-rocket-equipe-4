from fastapi import APIRouter, Query
from app.services import support_service
from app.schemas.support_ticket import TicketOut, TicketListResponse

router = APIRouter(prefix="/support", tags=["support"])


@router.get("", response_model=TicketListResponse)
def list_tickets(
    id_cliente: int | None = Query(None),
    tipo: str | None = Query(None, description="Entrega | Reembolso | Produto | Pagamento"),
    status: str | None = Query(None, description="Aberto | Resolvido"),
    sla_estourado: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return support_service.get_tickets(id_cliente, tipo, status, sla_estourado, page, size)


@router.get("/{id_ticket}", response_model=TicketOut)
def get_ticket(id_ticket: int):
    return support_service.get_ticket(id_ticket)
