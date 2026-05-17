from app.database import SessionLocal
from app.models.customer import Customer

def get_all(
    nome: str | None = None,
    email: str | None = None,
    estado: str | None = None,
    segmento: str | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Customer], int]:
    db = SessionLocal()
    try:
        query = db.query(Customer)
        if nome:
            query = query.filter(Customer.nome.ilike(f"%{nome}%"))
        if email:
            query = query.filter(Customer.email.ilike(f"%{email}%"))
        if estado:
            query = query.filter(Customer.estado == estado.upper())
        if segmento:
            query = query.filter(Customer.segmento_ltv == segmento)
        
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
