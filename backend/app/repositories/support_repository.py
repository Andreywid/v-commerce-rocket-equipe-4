import uuid
from datetime import date
from sqlalchemy import asc, desc
from app.database import SessionLocal
from app.models.support_ticket import SupportTicket

_SORTABLE = {
    "id_ticket":    SupportTicket.id_ticket,
    "data_abertura": SupportTicket.data_abertura,
    "status_ticket": SupportTicket.status_ticket,
}

def get_all(
    id_cliente: str | None = None,
    tipo: list[str] | None = None,
    status: list[str] | None = None,
    sla_estourado: bool | None = None,
    data_abertura: str | None = None,
    nome: str | None = None,
    satisfacao: list[str] | None = None,
    page: int = 1,
    size: int = 20,
    sort_by: str | None = None,
    order: str | None = None,
) -> tuple[list[SupportTicket], int, int, int]:
    db = SessionLocal()
    try:
        query = db.query(SupportTicket)
        if id_cliente:
            query = query.filter(SupportTicket.id_cliente == id_cliente)
        if tipo:
            query = query.filter(SupportTicket.tipo_problema.in_(tipo))
        if status:
            query = query.filter(SupportTicket.status_ticket.in_(status))
        if satisfacao:
            query = query.filter(SupportTicket.satisfacao_atendimento.in_(satisfacao))
        if data_abertura:
            query = query.filter(SupportTicket.data_abertura >= data_abertura)
        if nome:
            from sqlalchemy import or_
            pattern = f"%{nome}%"
            query = query.filter(
                or_(
                    SupportTicket.nome_cliente.ilike(pattern),
                    SupportTicket.id_ticket.ilike(pattern),
                    SupportTicket.tipo_problema.ilike(pattern),
                )
            )
        if sla_estourado is not None:
            query = query.filter(SupportTicket.sla_estourado == sla_estourado)
        
        col = _SORTABLE.get(sort_by) if sort_by else None
        if col is not None:
            query = query.order_by(asc(col) if order != "desc" else desc(col))

        total           = query.count()
        total_abertos   = query.filter(SupportTicket.status_ticket == "Aberto").count()
        total_resolvidos = query.filter(SupportTicket.status_ticket == "Resolvido").count()

        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()
        return items, total, total_abertos, total_resolvidos
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


def create(data: dict) -> SupportTicket:
    db = SessionLocal()
    try:
        ticket = SupportTicket(
            id_ticket=f"TKT-{uuid.uuid4().hex[:8].upper()}",
            id_cliente=data["id_cliente"],
            id_pedido=data.get("id_pedido"),
            id_produto=data.get("id_produto"),
            tipo_problema=data["tipo_problema"],
            satisfacao_atendimento="sem_avaliacao",
            data_abertura=data.get("data_abertura") or date.today(),
            data_resolucao=None,
            tempo_resolucao_horas=None,
            agente_suporte=data["agente_suporte"],
            nota_avaliacao=None,
            status_ticket="Aberto",
            sla_estourado=False,
            nome_cliente=data["nome_cliente"],
            nome_produto=data.get("nome_produto"),
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
        return ticket
    finally:
        db.close()


def update(id_ticket: str, data: dict) -> SupportTicket | None:
    db = SessionLocal()
    try:
        ticket = db.query(SupportTicket).filter(SupportTicket.id_ticket == id_ticket).first()
        if not ticket:
            return None
        for field, value in data.items():
            if value is not None:
                setattr(ticket, field, value)
        db.commit()
        db.refresh(ticket)
        return ticket
    finally:
        db.close()


def delete(id_ticket: str) -> bool:
    db = SessionLocal()
    try:
        ticket = db.query(SupportTicket).filter(SupportTicket.id_ticket == id_ticket).first()
        if not ticket:
            return False
        db.delete(ticket)
        db.commit()
        return True
    finally:
        db.close()
