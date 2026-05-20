from fastapi import APIRouter, Depends, Query, status
from app.services import support_service
from app.schemas.support_ticket import TicketOut, TicketListResponse, TicketCreate, TicketUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/support", tags=["support"])


@router.get("", response_model=TicketListResponse)
def list_tickets(
    id_cliente: str | None = Query(None),
    tipo: list[str] | None = Query(None, description="Entrega | Reembolso | Produto | Pagamento"),
    status_ticket: list[str] | None = Query(None, alias="status", description="Aberto | Resolvido"),
    sla_estourado: bool | None = Query(None),
    data_abertura: str | None = Query(None, description="YYYY-MM-DD — filtra tickets abertos a partir desta data"),
    nome: str | None = Query(None, description="Busca por cliente, ticket ou tipo"),
    satisfacao: list[str] | None = Query(None, description="alta | media | baixa | sem_avaliacao"),
    sort_by: str | None = Query(None, description="id_ticket | data_abertura | status_ticket"),
    order: str | None = Query(None, description="asc | desc"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return support_service.get_tickets(id_cliente, tipo, status_ticket, sla_estourado, data_abertura, nome, satisfacao, page, size, sort_by, order)


@router.get("/{id_ticket}", response_model=TicketOut)
def get_ticket(id_ticket: str, current_user=Depends(get_current_user)):
    return support_service.get_ticket(id_ticket)


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(data: TicketCreate, current_user=Depends(get_current_user)):
    return support_service.create_ticket(data)


@router.put("/{id_ticket}", response_model=TicketOut)
def update_ticket(id_ticket: str, data: TicketUpdate, current_user=Depends(get_current_user)):
    return support_service.update_ticket(id_ticket, data)


@router.delete("/{id_ticket}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(id_ticket: str, current_user=Depends(get_current_user)):
    support_service.delete_ticket(id_ticket)
