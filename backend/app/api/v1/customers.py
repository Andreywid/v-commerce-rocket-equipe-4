from fastapi import APIRouter, Depends, Query, status
from app.services import customer_service
from app.schemas.customer import CustomerOut, Customer360, CustomerListResponse, CustomerCreate, CustomerUpdate, CustomerStats
from app.schemas.order import OrderListResponse
from app.schemas.support_ticket import TicketListResponse
from app.schemas.review import ReviewListResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    nome: str | None = Query(None),
    email: str | None = Query(None),
    estado: list[str] | None = Query(None, description="UF(s), ex: SP"),
    segmento: list[str] | None = Query(None, description="Alto | Medio | Baixo"),
    is_recorrente: bool | None = Query(None, description="true=Recorrente, false=Novo"),
    min_total: float | None = Query(None, description="Valor total mínimo"),
    max_total: float | None = Query(None, description="Valor total máximo"),
    sort_by: str | None = Query(None, description="nome | data_ultimo_pedido | valor_total_gasto"),
    order: str | None = Query(None, description="asc | desc"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return customer_service.get_customers(nome, email, estado, segmento, is_recorrente, min_total, max_total, page, size, sort_by, order)


@router.get("/stats", response_model=CustomerStats)
def get_customer_stats(current_user=Depends(get_current_user)):
    return customer_service.get_customer_stats()


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(data: CustomerCreate, current_user=Depends(get_current_user)):
    return customer_service.create_customer(data)


@router.get("/{id_cliente}", response_model=CustomerOut)
def get_customer(id_cliente: str, current_user=Depends(get_current_user)):
    return customer_service.get_customer(id_cliente)


@router.put("/{id_cliente}", response_model=CustomerOut)
def update_customer(id_cliente: str, data: CustomerUpdate, current_user=Depends(get_current_user)):
    return customer_service.update_customer(id_cliente, data)


@router.delete("/{id_cliente}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(id_cliente: str, current_user=Depends(get_current_user)):
    customer_service.delete_customer(id_cliente)


@router.get("/{id_cliente}/perfil-360", response_model=Customer360)
def get_customer_360(id_cliente: str, current_user=Depends(get_current_user)):
    return customer_service.get_customer_360(id_cliente)


@router.get("/{id_cliente}/orders", response_model=OrderListResponse)
def get_customer_orders(
    id_cliente: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return customer_service.get_customer_orders(id_cliente, page, size)


@router.get("/{id_cliente}/tickets", response_model=TicketListResponse)
def get_customer_tickets(
    id_cliente: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return customer_service.get_customer_tickets(id_cliente, page, size)


@router.get("/{id_cliente}/avaliacoes", response_model=ReviewListResponse)
def get_customer_reviews(
    id_cliente: str,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return customer_service.get_customer_reviews(id_cliente, page, size)


@router.get("/{id_cliente}/comportamento")
def get_customer_clickstream(
    id_cliente: str,
    periodo: int = Query(30, description="Janela em dias"),
    current_user=Depends(get_current_user),
):
    return customer_service.get_customer_clickstream(id_cliente, periodo)
