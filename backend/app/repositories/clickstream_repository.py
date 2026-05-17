from datetime import date
from app.database import SessionLocal
from app.models.clickstream import ClickstreamResumo

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
