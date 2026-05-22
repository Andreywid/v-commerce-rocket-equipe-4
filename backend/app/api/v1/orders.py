from fastapi import APIRouter, Depends, Query, status
from app.services import order_service
from app.schemas.order import OrderCreate, OrderUpdate, OrderOut, OrderListResponse
from app.core.deps import get_current_user, require_admin

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderListResponse)
def list_orders(
    status: list[str] | None = Query(None, description="Aprovado | Recusado | Reembolsado | Processando"),
    categoria: str | None = Query(None),
    estado: str | None = Query(None, description="Estado do cliente por extenso, ex: São Paulo"),
    id_cliente: str | None = Query(None),
    data_inicio: str | None = Query(None, description="YYYY-MM-DD"),
    data_fim: str | None = Query(None, description="YYYY-MM-DD"),
    nome: str | None = Query(None, description="Busca por produto, cliente ou número do pedido"),
    valor_min: float | None = Query(None, description="Valor mínimo do pedido"),
    valor_max: float | None = Query(None, description="Valor máximo do pedido"),
    sort_by: str | None = Query(None, description="nome_produto | valor_total | data_pedido"),
    order: str | None = Query(None, description="asc | desc"),
    dentro_prazo: bool | None = Query(None, description="true=Aprovado/Processando, false=Recusado/Reembolsado"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return order_service.get_orders(status, categoria, estado, id_cliente, data_inicio, data_fim, nome, valor_min, valor_max, page, size, sort_by, order, dentro_prazo)


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
