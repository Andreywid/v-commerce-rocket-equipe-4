from fastapi import APIRouter, Depends, Query, status
from app.services import clickstream_service
from app.schemas.clickstream import ClickstreamOut, ClickstreamListResponse, ClickstreamCreate
from app.core.deps import get_current_user

router = APIRouter(prefix="/clickstream", tags=["clickstream"])


@router.get("", response_model=ClickstreamListResponse)
def list_clickstream(
    id_cliente: str | None = Query(None),
    canal: str | None = Query(None, description="web | mobile | app"),
    data_inicio: str | None = Query(None, description="YYYY-MM-DD"),
    data_fim: str | None = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return clickstream_service.get_clickstream(id_cliente, canal, data_inicio, data_fim, page, size)


@router.get("/{id_cliente}/{data}", response_model=ClickstreamOut)
def get_clickstream_by_key(id_cliente: str, data: str, current_user=Depends(get_current_user)):
    return clickstream_service.get_clickstream_by_key(id_cliente, data)


@router.post("", response_model=ClickstreamOut, status_code=status.HTTP_201_CREATED)
def create_clickstream(data: ClickstreamCreate, current_user=Depends(get_current_user)):
    return clickstream_service.create_clickstream(data)
