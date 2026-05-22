from fastapi import HTTPException
from app.repositories import clickstream_repository
from app.schemas.clickstream import ClickstreamOut, ClickstreamListResponse, ClickstreamCreate


def get_clickstream(
    id_cliente: str | None,
    canal: str | None,
    data_inicio: str | None,
    data_fim: str | None,
    page: int,
    size: int,
) -> ClickstreamListResponse:
    items, total = clickstream_repository.get_all(id_cliente, canal, data_inicio, data_fim, page, size)
    return ClickstreamListResponse(
        total=total, page=page, size=size,
        items=[ClickstreamOut.model_validate(r) for r in items],
    )


def get_clickstream_by_key(id_cliente: str, data: str) -> ClickstreamOut:
    record = clickstream_repository.get_by_key(id_cliente, data)
    if not record:
        raise HTTPException(status_code=404, detail="Registro de clickstream não encontrado")
    return ClickstreamOut.model_validate(record)


def create_clickstream(data: ClickstreamCreate) -> ClickstreamOut:
    record = clickstream_repository.create(data.model_dump())
    return ClickstreamOut.model_validate(record)
