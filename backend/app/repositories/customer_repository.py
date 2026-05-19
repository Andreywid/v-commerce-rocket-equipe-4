import uuid
from datetime import date
from sqlalchemy import asc, desc, func, or_
from app.database import SessionLocal
from app.models.customer import Customer

_SORTABLE = {
    "nome":               Customer.nome,
    "data_ultimo_pedido": Customer.data_ultimo_pedido,
    "valor_total_gasto":  Customer.valor_total_gasto,
}

def get_all(
    nome: str | None = None,
    email: str | None = None,
    estados: list[str] | None = None,
    segmentos: list[str] | None = None,
    is_recorrente: bool | None = None,
    min_total: float | None = None,
    max_total: float | None = None,
    page: int = 1,
    size: int = 20,
    sort_by: str | None = None,
    order: str | None = None,
) -> tuple[list[Customer], int]:
    db = SessionLocal()
    try:
        query = db.query(Customer)
        if nome:
            query = query.filter(or_(
                Customer.nome.ilike(f"%{nome}%"),
                Customer.id_cliente.ilike(f"%{nome}%"),
            ))
        if email:
            query = query.filter(Customer.email.ilike(f"%{email}%"))
        if estados:
            query = query.filter(Customer.estado.in_([e.upper() for e in estados]))
        if segmentos:
            query = query.filter(Customer.segmento_ltv.in_(segmentos))
        if is_recorrente is True:
            query = query.filter(Customer.qtd_pedidos_total >= 2)
        elif is_recorrente is False:
            query = query.filter(Customer.qtd_pedidos_total < 2)
        if min_total is not None:
            query = query.filter(Customer.valor_total_gasto >= min_total)
        if max_total is not None:
            query = query.filter(Customer.valor_total_gasto <= max_total)

        col = _SORTABLE.get(sort_by) if sort_by else None
        if col is not None:
            query = query.order_by(asc(col) if order != "desc" else desc(col))

        total = query.count()
        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()
        return items, total
    finally:
        db.close()


def get_by_id(id_cliente: str) -> Customer | None:
    db = SessionLocal()
    try:
        return db.query(Customer).filter(Customer.id_cliente == id_cliente).first()
    finally:
        db.close()


def create(data: dict) -> Customer:
    db = SessionLocal()
    try:
        customer = Customer(
            id_cliente=f"CLI-{uuid.uuid4().hex[:8].upper()}",
            nome=data["nome"],
            email=data["email"],
            telefone=data.get("telefone"),
            data_cadastro=data.get("data_cadastro") or date.today(),
            cidade=data.get("cidade"),
            estado=data.get("estado"),
            origem=data.get("origem"),
            qtd_pedidos_total=0,
            qtd_pedidos_aprovados=0,
            qtd_pedidos_recusados=0,
            qtd_pedidos_reembolsados=0,
            qtd_pedidos_processando=0,
            valor_total_gasto=0.0,
            ticket_medio=0.0,
            qtd_tickets_total=0,
            qtd_tickets_abertos=0,
            qtd_tickets_resolvidos=0,
            qtd_avaliacoes=0,
            qtd_eventos_clickstream=0,
            segmento_ltv="Baixo",
            is_ativo_90d=True,
            is_em_risco=False,
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
    finally:
        db.close()


def update(id_cliente: str, data: dict) -> Customer | None:
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id_cliente == id_cliente).first()
        if not customer:
            return None
        for field, value in data.items():
            setattr(customer, field, value)
        db.commit()
        db.refresh(customer)
        return customer
    finally:
        db.close()


def delete(id_cliente: str) -> bool:
    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id_cliente == id_cliente).first()
        if not customer:
            return False
        db.delete(customer)
        db.commit()
        return True
    finally:
        db.close()


def get_stats() -> dict:
    db = SessionLocal()
    try:
        total = db.query(func.count(Customer.id_cliente)).scalar() or 0
        nps_raw = db.query(func.avg(Customer.nps_medio_avaliacoes_cliente)).scalar()
        nota_raw = db.query(func.avg(Customer.nota_media_dada)).scalar()
        em_risco = db.query(func.count(Customer.id_cliente)).filter(Customer.is_em_risco == True).scalar() or 0
        ativos = db.query(func.count(Customer.id_cliente)).filter(Customer.is_ativo_90d == True).scalar() or 0

        top = (
            db.query(Customer.estado, func.count(Customer.id_cliente).label("cnt"))
            .filter(Customer.estado.isnot(None))
            .group_by(Customer.estado)
            .order_by(func.count(Customer.id_cliente).desc())
            .first()
        )

        segmentos_raw = (
            db.query(Customer.segmento_ltv, func.count(Customer.id_cliente).label("cnt"))
            .filter(Customer.segmento_ltv.isnot(None))
            .group_by(Customer.segmento_ltv)
            .all()
        )

        return {
            "total_clientes": total,
            "nps_medio": round(nps_raw, 2) if nps_raw is not None else None,
            "nota_media": round(nota_raw, 2) if nota_raw is not None else None,
            "top_estado": top.estado if top else None,
            "top_estado_percentual": round(top.cnt / total * 100, 1) if top and total else None,
            "clientes_em_risco": em_risco,
            "clientes_ativos_90d": ativos,
            "segmentos": {r.segmento_ltv: r.cnt for r in segmentos_raw},
        }
    finally:
        db.close()
