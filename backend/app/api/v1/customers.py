from fastapi import APIRouter, Query
from app.services import customer_service
from app.schemas.customer import CustomerOut, Customer360, CustomerListResponse
from app.schemas.order import OrderOut
from app.schemas.support_ticket import TicketOut
from app.schemas.review import ReviewOut

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    nome: str | None = Query(None),
    email: str | None = Query(None),
    estado: str | None = Query(None, description="UF com 2 letras, ex: SP"),
    segmento: str | None = Query(None, description="Alto | Medio | Baixo"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return customer_service.get_customers(nome, email, estado, segmento, page, size)


@router.get("/{id_cliente}/perfil-360", response_model=Customer360)
def get_customer_360(id_cliente: int):
    return customer_service.get_customer_360(id_cliente)


@router.get("/{id_cliente}/orders", response_model=list[OrderOut])
def get_customer_orders(id_cliente: int):
    return customer_service.get_customer_orders(id_cliente)


@router.get("/{id_cliente}/tickets", response_model=list[TicketOut])
def get_customer_tickets(id_cliente: int):
    return customer_service.get_customer_tickets(id_cliente)


@router.get("/{id_cliente}/avaliacoes", response_model=list[ReviewOut])
def get_customer_reviews(id_cliente: int):
    return customer_service.get_customer_reviews(id_cliente)


@router.get("/{id_cliente}/comportamento")
def get_customer_clickstream(
    id_cliente: int,
    periodo: int = Query(30, description="Janela em dias"),
):
    return customer_service.get_customer_clickstream(id_cliente, periodo)
