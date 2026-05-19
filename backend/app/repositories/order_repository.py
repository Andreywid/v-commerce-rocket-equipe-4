from datetime import date
from app.database import SessionLocal
from app.models.order import Order
from sqlalchemy import asc, desc, or_

_SORTABLE = {
    "nome_produto": Order.nome_produto,
    "valor_total":  Order.valor_total,
    "data_pedido":  Order.data_pedido,
}

def get_all(
    status: list[str] | None = None,
    categoria: str | None = None,
    estado: str | None = None,
    id_cliente: str | None = None,
    data_inicio: str | None = None,
    data_fim: str | None = None,
    nome: str | None = None,
    valor_min: float | None = None,
    valor_max: float | None = None,
    page: int = 1,
    size: int = 20,
    sort_by: str | None = None,
    order: str | None = None,
) -> tuple[list[Order], int]:
    db = SessionLocal()
    try:
        query = db.query(Order)

        if status:
            query = query.filter(Order.status.in_(status))
        if valor_min is not None:
            query = query.filter(Order.valor_total >= valor_min)
        if valor_max is not None:
            query = query.filter(Order.valor_total <= valor_max)
        if categoria:
            query = query.filter(Order.categoria_produto == categoria)
        if estado:
            query = query.filter(Order.estado_cliente == estado.upper())
        if id_cliente:
            query = query.filter(Order.id_cliente == id_cliente)
        if data_inicio:
            query = query.filter(Order.data_pedido >= date.fromisoformat(data_inicio))
        if data_fim:
            query = query.filter(Order.data_pedido <= date.fromisoformat(data_fim))
        if nome:
            pattern = f"%{nome}%"
            query = query.filter(
                or_(
                    Order.nome_produto.ilike(pattern),
                    Order.nome_cliente.ilike(pattern),
                    Order.id_pedido.ilike(pattern),
                )
            )
            
        col = _SORTABLE.get(sort_by) if sort_by else None
        if col is not None:
            query = query.order_by(asc(col) if order != "desc" else desc(col))
        else:
            query = query.order_by(desc(Order.data_pedido))

        total = query.count()
        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()
        
        return items, total
    finally:
        db.close()


def get_by_id(id_pedido: str) -> Order | None:
    db = SessionLocal()
    try:
        return db.query(Order).filter(Order.id_pedido == id_pedido).first()
    finally:
        db.close()


def create(data: dict) -> Order | None:
    from app.models.product import Product
    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id_produto == data["id_produto"]).first()
        if not product:
            return None

        d = data["data_pedido"] if isinstance(data["data_pedido"], date) else date.fromisoformat(str(data["data_pedido"]))
        quantidade = int(data["quantidade"])
        valor_unitario = float(product.preco_atual)

        order = Order(
            id_pedido=data["id_pedido"],
            id_cliente="CLI-MANUAL",
            id_produto=product.id_produto,
            data_pedido=d,
            quantidade=quantidade,
            valor_unitario=valor_unitario,
            valor_total=round(valor_unitario * quantidade, 2),
            status=data["status"],
            metodo_pagamento=data.get("metodo_pagamento", "PIX"),
            nome_cliente="—",
            estado_cliente=None,
            nome_produto=product.nome_produto,
            categoria_produto=product.categoria,
            ano=d.year,
            mes=d.month,
            trimestre=(d.month - 1) // 3 + 1,
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        return order
    finally:
        db.close()


def update(id_pedido: str, data: dict) -> Order | None:
    from app.models.product import Product
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id_pedido == id_pedido).first()
        if not order:
            return None

        if "id_produto" in data and data["id_produto"] and data["id_produto"] != order.id_produto:
            product = db.query(Product).filter(Product.id_produto == data["id_produto"]).first()
            if product:
                order.id_produto = product.id_produto
                order.nome_produto = product.nome_produto
                order.categoria_produto = product.categoria
                order.valor_unitario = float(product.preco_atual)

        if "data_pedido" in data and data["data_pedido"]:
            d = data["data_pedido"] if isinstance(data["data_pedido"], date) else date.fromisoformat(str(data["data_pedido"]))
            order.data_pedido = d
            order.ano = d.year
            order.mes = d.month
            order.trimestre = (d.month - 1) // 3 + 1

        if "status" in data and data["status"]:
            order.status = data["status"]

        if "quantidade" in data and data["quantidade"]:
            order.quantidade = int(data["quantidade"])

        order.valor_total = round(float(order.valor_unitario) * int(order.quantidade), 2)

        db.commit()
        db.refresh(order)
        return order
    finally:
        db.close()


def delete(id_pedido: str) -> bool:
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id_pedido == id_pedido).first()
        if not order:
            return False
        db.delete(order)
        db.commit()
        return True
    finally:
        db.close()


def get_by_customer(id_cliente: str) -> list[Order]:
    db = SessionLocal()
    try:
        return db.query(Order).filter(Order.id_cliente == id_cliente).all()
    finally:
        db.close()
