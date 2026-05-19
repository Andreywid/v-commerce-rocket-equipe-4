from datetime import date
from sqlalchemy import asc, desc
from app.database import SessionLocal
from app.models.product import Product

_SORTABLE = {
    "qtd_vendida_total": Product.qtd_vendida_total,
    "nota_media":        Product.nota_media,
    "preco_atual":       Product.preco_atual,
    "receita_total":     Product.receita_total,
}
_NULLABLE_SORT = {"nota_media"}

def get_all(
    categorias: list[str] | None = None,
    ativo: bool | None = None,
    nome: str | None = None,
    preco_min: float | None = None,
    preco_max: float | None = None,
    sort_by: str | None = None,
    order: str | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Product], int]:
    db = SessionLocal()
    try:
        query = db.query(Product)
        if categorias:
            query = query.filter(Product.categoria.in_(categorias))
        if ativo is not None:
            query = query.filter(Product.ativo == ativo)
        if nome:
            query = query.filter(Product.nome_produto.ilike(f"%{nome}%"))
        if preco_min is not None:
            query = query.filter(Product.preco_atual >= preco_min)
        if preco_max is not None:
            query = query.filter(Product.preco_atual <= preco_max)
        if sort_by and sort_by in _SORTABLE:
            col = _SORTABLE[sort_by]
            if sort_by in _NULLABLE_SORT:
                query = query.filter(col.isnot(None))
            query = query.order_by(asc(col) if order == "asc" else desc(col))

        total = query.count()
        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()
        return items, total
    finally:
        db.close()


def get_by_id(id_produto: str) -> Product | None:
    db = SessionLocal()
    try:
        return db.query(Product).filter(Product.id_produto == id_produto).first()
    finally:
        db.close()


def create(data: dict) -> Product:
    db = SessionLocal()
    try:
        # Gera o próximo ID no padrão PROD-XXXX
        last_product = db.query(Product).filter(Product.id_produto.like("PROD-%")).order_by(Product.id_produto.desc()).first()
        if last_product:
            last_id_num = int(last_product.id_produto.split("-")[1])
            new_id = f"PROD-{(last_id_num + 1):04d}"
        else:
            new_id = "PROD-0001"
            
        new_product = Product(**data, id_produto=new_id)
        # Campos calculados iniciam zerados/default para novos produtos
        new_product.qtd_vendida_total = 0
        new_product.receita_total = 0.0
        new_product.classificacao = "Estável"
        new_product.data_referencia_calculo = date.today()
        
        db.add(new_product)
        db.commit()
        db.refresh(new_product)
        return new_product
    finally:
        db.close()


def update(id_produto: str, data: dict) -> Product | None:
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id_produto == id_produto).first()
        if not product:
            return None
        
        for key, value in data.items():
            if value is not None:
                setattr(product, key, value)
        
        db.commit()
        db.refresh(product)
        return product
    finally:
        db.close()


def delete(id_produto: str) -> bool:
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id_produto == id_produto).first()
        if not product:
            return False
        db.delete(product)
        db.commit()
        return True
    finally:
        db.close()
