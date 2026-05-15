from fastapi import HTTPException
from app.repositories import product_repository, review_repository
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductPerformance, ProductListResponse
from app.schemas.review import ReviewOut


def get_products(
    categoria: str | None,
    ativo: bool | None,
    page: int,
    size: int,
) -> ProductListResponse:
    items, total = product_repository.get_all(categoria, ativo, page, size)
    return ProductListResponse(
        total=total, page=page, size=size,
        items=[ProductOut(**p) for p in items],
    )


def get_product_performance(id_produto: int) -> ProductPerformance:
    product = product_repository.get_by_id(id_produto)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return ProductPerformance(**product)


def get_product_reviews(id_produto: int) -> list[ReviewOut]:
    _require_product(id_produto)
    reviews = review_repository.get_by_product(id_produto)
    return [ReviewOut(**r) for r in reviews]


def create_product(data: ProductCreate) -> ProductOut:
    new_product = product_repository.create(data.model_dump())
    return ProductOut(**new_product)


def update_product(id_produto: int, data: ProductUpdate) -> ProductOut:
    updated = product_repository.update(id_produto, data.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return ProductOut(**updated)


def delete_product(id_produto: int) -> None:
    if not product_repository.delete(id_produto):
        raise HTTPException(status_code=404, detail="Produto não encontrado")


def _require_product(id_produto: int) -> None:
    if not product_repository.get_by_id(id_produto):
        raise HTTPException(status_code=404, detail="Produto não encontrado")
