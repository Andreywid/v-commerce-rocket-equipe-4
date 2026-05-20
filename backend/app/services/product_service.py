from fastapi import HTTPException
from app.repositories import product_repository, review_repository
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductPerformance, ProductListResponse
from app.schemas.review import ReviewOut, ReviewListResponse


def get_products(
    categorias: list[str] | None,
    ativo: bool | None,
    nome: str | None,
    preco_min: float | None,
    preco_max: float | None,
    sort_by: str | None,
    order: str | None,
    page: int,
    size: int,
) -> ProductListResponse:
    items, total = product_repository.get_all(categorias, ativo, nome, preco_min, preco_max, sort_by, order, page, size)
    return ProductListResponse(
        total=total, page=page, size=size,
        items=[ProductOut.model_validate(p) for p in items],
    )


def get_product(id_produto: str) -> ProductOut:
    product = product_repository.get_by_id(id_produto)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return ProductOut.model_validate(product)


def get_product_performance(id_produto: str) -> ProductPerformance:
    product = product_repository.get_by_id(id_produto)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return ProductPerformance.model_validate(product)


def get_product_reviews(id_produto: str, page: int, size: int) -> ReviewListResponse:
    _require_product(id_produto)
    reviews = review_repository.get_by_product(id_produto)
    total = len(reviews)
    start = (page - 1) * size
    items = reviews[start:start + size]
    return ReviewListResponse(total=total, page=page, size=size, items=[ReviewOut.model_validate(r) for r in items])


def create_product(data: ProductCreate) -> ProductOut:
    new_product = product_repository.create(data.model_dump())
    return ProductOut.model_validate(new_product)


def update_product(id_produto: str, data: ProductUpdate) -> ProductOut:
    updated = product_repository.update(id_produto, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return ProductOut.model_validate(updated)


def delete_product(id_produto: str) -> None:
    if not product_repository.delete(id_produto):
        raise HTTPException(status_code=404, detail="Produto não encontrado")


def _require_product(id_produto: str) -> None:
    if not product_repository.get_by_id(id_produto):
        raise HTTPException(status_code=404, detail="Produto não encontrado")
