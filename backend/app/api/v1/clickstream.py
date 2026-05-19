from fastapi import APIRouter, Depends, Query, status
from app.services import clickstream_service
from app.schemas.clickstream import ClickstreamOut, ClickstreamListResponse, ClickstreamCreate, ClickstreamUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/clickstream", tags=["clickstream"])


@router.get("", response_model=ClickstreamListResponse)
def list_clickstream(
    id_cliente: str | None = Query(None),
    canal: str | None = Query(None, description="Web | Mobile | App"),
    data_inicio: str | None = Query(None, description="YYYY-MM-DD"),
    data_fim: str | None = Query(None, description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return clickstream_service.get_clickstream(id_cliente, canal, data_inicio, data_fim, page, size)


@router.get("/{id}", response_model=ClickstreamOut)
def get_clickstream(id: int, current_user=Depends(get_current_user)):
    return clickstream_service.get_clickstream_by_id(id)


@router.post("", response_model=ClickstreamOut, status_code=status.HTTP_201_CREATED)
def create_clickstream(data: ClickstreamCreate, current_user=Depends(get_current_user)):
    return clickstream_service.create_clickstream(data)


@router.put("/{id}", response_model=ClickstreamOut)
def update_clickstream(id: int, data: ClickstreamUpdate, current_user=Depends(get_current_user)):
    return clickstream_service.update_clickstream(id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_clickstream(id: int, current_user=Depends(get_current_user)):
    clickstream_service.delete_clickstream(id)
