from app.database import SessionLocal
from app.models.support_ticket import SupportTicket

def get_all(
    id_cliente: str | None = None,
    tipo: str | None = None,
    status: str | None = None,
    sla_estourado: bool | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[SupportTicket], int]:
    db = SessionLocal()
    try:
        query = db.query(SupportTicket)
        if id_cliente:
            query = query.filter(SupportTicket.id_cliente == id_cliente)
        if tipo:
            query = query.filter(SupportTicket.tipo_problema == tipo)
        if status:
            query = query.filter(SupportTicket.status_ticket == status)
        if sla_estourado is not None:
            query = query.filter(SupportTicket.sla_estourado == sla_estourado)
        
        total = query.count()
        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()
        return items, total
    finally:
        db.close()


def get_by_id(id_ticket: str) -> SupportTicket | None:
    db = SessionLocal()
    try:
        return db.query(SupportTicket).filter(SupportTicket.id_ticket == id_ticket).first()
    finally:
        db.close()


def get_by_customer(id_cliente: str) -> list[SupportTicket]:
    db = SessionLocal()
    try:
        return db.query(SupportTicket).filter(SupportTicket.id_cliente == id_cliente).all()
    finally:
        db.close()
