from fastapi import HTTPException
from app.repositories import review_repository
from app.schemas.review import ReviewOut, ReviewListResponse, ReviewCreate, ReviewUpdate


def get_reviews(
    id_produto: str | None,
    id_cliente: str | None,
    sentimento: str | None,
    nota_min: int | None,
    nota_max: int | None,
    page: int,
    size: int,
) -> ReviewListResponse:
    items, total = review_repository.get_all(id_produto, id_cliente, sentimento, nota_min, nota_max, page, size)
    return ReviewListResponse(
        total=total, page=page, size=size,
        items=[ReviewOut.model_validate(r) for r in items],
    )


def get_review(id_avaliacao: str) -> ReviewOut:
    review = review_repository.get_by_id(id_avaliacao)
    if not review:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return ReviewOut.model_validate(review)


def create_review(data: ReviewCreate) -> ReviewOut:
    review = review_repository.create(data.model_dump())
    return ReviewOut.model_validate(review)


def update_review(id_avaliacao: str, data: ReviewUpdate) -> ReviewOut:
    updated = review_repository.update(id_avaliacao, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
    return ReviewOut.model_validate(updated)


def delete_review(id_avaliacao: str) -> None:
    if not review_repository.delete(id_avaliacao):
        raise HTTPException(status_code=404, detail="Avaliação não encontrada")
