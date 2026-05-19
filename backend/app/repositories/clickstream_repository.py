from datetime import date
from app.database import SessionLocal
from app.models.clickstream import ClickstreamResumo


def get_all(
    id_cliente: str | None = None,
    canal: str | None = None,
    data_inicio: str | None = None,
    data_fim: str | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[ClickstreamResumo], int]:
    db = SessionLocal()
    try:
        query = db.query(ClickstreamResumo)
        if id_cliente:
            query = query.filter(ClickstreamResumo.id_cliente == id_cliente)
        if canal:
            query = query.filter(ClickstreamResumo.canal_principal == canal)
        if data_inicio:
            query = query.filter(ClickstreamResumo.data >= date.fromisoformat(data_inicio))
        if data_fim:
            query = query.filter(ClickstreamResumo.data <= date.fromisoformat(data_fim))
        total = query.count()
        offset = (page - 1) * size
        items = query.order_by(ClickstreamResumo.data.desc()).offset(offset).limit(size).all()
        return items, total
    finally:
        db.close()


def get_by_id(id: int) -> ClickstreamResumo | None:
    db = SessionLocal()
    try:
        return db.query(ClickstreamResumo).filter(ClickstreamResumo.id == id).first()
    finally:
        db.close()


def get_by_customer(id_cliente: str, periodo_dias: int = 30) -> list[ClickstreamResumo]:
    db = SessionLocal()
    try:
        return (
            db.query(ClickstreamResumo)
            .filter(ClickstreamResumo.id_cliente == id_cliente)
            .order_by(ClickstreamResumo.data.desc())
            .limit(periodo_dias)
            .all()
        )
    finally:
        db.close()


def create(data: dict) -> ClickstreamResumo:
    db = SessionLocal()
    try:
        record = ClickstreamResumo(
            id_cliente=data["id_cliente"],
            data=data["data"],
            qtd_eventos=data.get("qtd_eventos", 0),
            qtd_sessoes=data.get("qtd_sessoes", 0),
            qtd_page_view=data.get("qtd_page_view", 0),
            qtd_click=data.get("qtd_click", 0),
            qtd_add_to_cart=data.get("qtd_add_to_cart", 0),
            qtd_abandon_cart=data.get("qtd_abandon_cart", 0),
            qtd_purchase=data.get("qtd_purchase", 0),
            qtd_search=data.get("qtd_search", 0),
            canal_principal=data.get("canal_principal"),
            dispositivo_principal=data.get("dispositivo_principal"),
            tempo_total_segundos=data.get("tempo_total_segundos", 0),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    finally:
        db.close()


def update(id: int, data: dict) -> ClickstreamResumo | None:
    db = SessionLocal()
    try:
        record = db.query(ClickstreamResumo).filter(ClickstreamResumo.id == id).first()
        if not record:
            return None
        for field, value in data.items():
            setattr(record, field, value)
        db.commit()
        db.refresh(record)
        return record
    finally:
        db.close()


def delete(id: int) -> bool:
    db = SessionLocal()
    try:
        record = db.query(ClickstreamResumo).filter(ClickstreamResumo.id == id).first()
        if not record:
            return False
        db.delete(record)
        db.commit()
        return True
    finally:
        db.close()
