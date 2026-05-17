from app.database import SessionLocal
from app.models.review import Review

def get_by_product(id_produto: str) -> list[Review]:
    db = SessionLocal()
    try:
        return db.query(Review).filter(Review.id_produto == id_produto).all()
    finally:
        db.close()


def get_by_customer(id_cliente: str) -> list[Review]:
    db = SessionLocal()
    try:
        return db.query(Review).filter(Review.id_cliente == id_cliente).all()
    finally:
        db.close()
