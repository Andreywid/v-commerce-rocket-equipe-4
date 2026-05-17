from fastapi import APIRouter, Depends, Query, status
from app.services import order_service
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderListResponse
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderListResponse)
def list_orders(
    status: str | None = Query(None, description="Aprovado | Recusado | Reembolsado | Processando"),
    categoria: str | None = Query(None),
    estado: str | None = Query(None, description="UF do cliente, ex: SP"),
    id_cliente: str | None = Query(None),
    data_inicio: str | None = Query(None, description="YYYY-MM-DD"),
    data_fim: str | None = Query(None, description="YYYY-MM-DD"),
    nome: str | None = Query(None, description="Busca por produto, cliente ou número do pedido"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return order_service.get_orders(status, categoria, estado, id_cliente, data_inicio, data_fim, nome, page, size)


@router.get("/{id_pedido}", response_model=OrderOut)
def get_order(id_pedido: str, current_user=Depends(get_current_user)):
    return order_service.get_order(id_pedido)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(body: OrderCreate, current_user=Depends(require_admin)):
    return order_service.create_order(body)


@router.put("/{id_pedido}", response_model=OrderOut)
def update_order(id_pedido: str, body: OrderUpdate, current_user=Depends(require_admin)):
    return order_service.update_order(id_pedido, body)


@router.delete("/{id_pedido}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(id_pedido: str, current_user=Depends(require_admin)):
    order_service.delete_order(id_pedido)
