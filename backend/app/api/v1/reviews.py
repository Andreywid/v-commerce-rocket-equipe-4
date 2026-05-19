from fastapi import APIRouter, Depends, Query, status
from app.services import review_service
from app.schemas.review import ReviewOut, ReviewListResponse, ReviewCreate, ReviewUpdate
from app.core.deps import get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=ReviewListResponse)
def list_reviews(
    id_produto: str | None = Query(None),
    id_cliente: str | None = Query(None),
    sentimento: str | None = Query(None, description="positivo | neutro | negativo"),
    nota_min: int | None = Query(None, ge=1, le=5),
    nota_max: int | None = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user=Depends(get_current_user),
):
    return review_service.get_reviews(id_produto, id_cliente, sentimento, nota_min, nota_max, page, size)


@router.get("/{id_avaliacao}", response_model=ReviewOut)
def get_review(id_avaliacao: str, current_user=Depends(get_current_user)):
    return review_service.get_review(id_avaliacao)


@router.post("", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(data: ReviewCreate, current_user=Depends(get_current_user)):
    return review_service.create_review(data)


@router.put("/{id_avaliacao}", response_model=ReviewOut)
def update_review(id_avaliacao: str, data: ReviewUpdate, current_user=Depends(get_current_user)):
    return review_service.update_review(id_avaliacao, data)


@router.delete("/{id_avaliacao}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(id_avaliacao: str, current_user=Depends(get_current_user)):
    review_service.delete_review(id_avaliacao)
