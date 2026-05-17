from fastapi import APIRouter, Depends, Query
from app.services import support_service
from app.schemas.support_ticket import TicketOut, TicketListResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/support", tags=["support"])


@router.get("", response_model=TicketListResponse)
def list_tickets(
    id_cliente: str | None = Query(None),
    tipo: str | None = Query(None, description="Entrega | Reembolso | Produto | Pagamento"),
    status: str | None = Query(None, description="Aberto | Resolvido"),
    sla_estourado: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return support_service.get_tickets(id_cliente, tipo, status, sla_estourado, page, size)


@router.get("/{id_ticket}", response_model=TicketOut)
def get_ticket(id_ticket: str, current_user=Depends(get_current_user)):
    return support_service.get_ticket(id_ticket)
