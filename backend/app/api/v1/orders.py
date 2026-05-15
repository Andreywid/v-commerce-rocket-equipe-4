from fastapi import APIRouter, Query
from app.services import order_service
from app.schemas.order import OrderOut, OrderListResponse

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderListResponse)
def list_orders(
    status: str | None = Query(None, description="Aprovado | Recusado | Reembolsado | Processando"),
    categoria: str | None = Query(None),
    estado: str | None = Query(None, description="UF do cliente, ex: SP"),
    id_cliente: int | None = Query(None),
    data_inicio: str | None = Query(None, description="YYYY-MM-DD"),
    data_fim: str | None = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return order_service.get_orders(status, categoria, estado, id_cliente, data_inicio, data_fim, page, size)


@router.get("/{id_pedido}", response_model=OrderOut)
def get_order(id_pedido: int):
    return order_service.get_order(id_pedido)
