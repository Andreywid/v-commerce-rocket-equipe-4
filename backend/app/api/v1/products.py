from fastapi import APIRouter, Query, status
from app.services import product_service
from app.schemas.product import ProductCreate, ProductUpdate, ProductOut, ProductPerformance, ProductListResponse
from app.schemas.review import ReviewOut

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    categoria: str | None = Query(None),
    ativo: bool | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    return product_service.get_products(categoria, ativo, page, size)


@router.get("/{id_produto}/performance", response_model=ProductPerformance)
def get_product_performance(id_produto: int):
    return product_service.get_product_performance(id_produto)


@router.get("/{id_produto}/avaliacoes", response_model=list[ReviewOut])
def get_product_reviews(id_produto: int):
    return product_service.get_product_reviews(id_produto)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(body: ProductCreate):
    return product_service.create_product(body)


@router.put("/{id_produto}", response_model=ProductOut)
def update_product(id_produto: int, body: ProductUpdate):
    return product_service.update_product(id_produto, body)


@router.delete("/{id_produto}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id_produto: int):
    product_service.delete_product(id_produto)
