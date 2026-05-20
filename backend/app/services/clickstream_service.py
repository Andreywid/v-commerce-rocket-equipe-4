from fastapi import HTTPException
from app.repositories import clickstream_repository
from app.schemas.clickstream import ClickstreamOut, ClickstreamListResponse, ClickstreamCreate, ClickstreamUpdate


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


def get_clickstream_by_id(id: int) -> ClickstreamOut:
    record = clickstream_repository.get_by_id(id)
    if not record:
        raise HTTPException(status_code=404, detail="Registro de clickstream não encontrado")
    return ClickstreamOut.model_validate(record)


def create_clickstream(data: ClickstreamCreate) -> ClickstreamOut:
    record = clickstream_repository.create(data.model_dump())
    return ClickstreamOut.model_validate(record)


def update_clickstream(id: int, data: ClickstreamUpdate) -> ClickstreamOut:
    updated = clickstream_repository.update(id, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Registro de clickstream não encontrado")
    return ClickstreamOut.model_validate(updated)


def delete_clickstream(id: int) -> None:
    if not clickstream_repository.delete(id):
        raise HTTPException(status_code=404, detail="Registro de clickstream não encontrado")
