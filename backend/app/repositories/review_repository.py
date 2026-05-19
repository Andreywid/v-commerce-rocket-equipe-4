import uuid
from datetime import date
from app.database import SessionLocal
from app.models.review import Review


def get_all(
    id_produto: str | None = None,
    id_cliente: str | None = None,
    sentimento: str | None = None,
    nota_min: int | None = None,
    nota_max: int | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Review], int]:
    db = SessionLocal()
    try:
        query = db.query(Review)
        if id_produto:
            query = query.filter(Review.id_produto == id_produto)
        if id_cliente:
            query = query.filter(Review.id_cliente == id_cliente)
        if sentimento:
            query = query.filter(Review.sentimento == sentimento)
        if nota_min is not None:
            query = query.filter(Review.nota_produto >= nota_min)
        if nota_max is not None:
            query = query.filter(Review.nota_produto <= nota_max)
        total = query.count()
        offset = (page - 1) * size
        items = query.offset(offset).limit(size).all()
        return items, total
    finally:
        db.close()


def get_by_id(id_avaliacao: str) -> Review | None:
    db = SessionLocal()
    try:
        return db.query(Review).filter(Review.id_avaliacao == id_avaliacao).first()
    finally:
        db.close()


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


def create(data: dict) -> Review:
    db = SessionLocal()
    try:
        review = Review(
            id_avaliacao=f"REV-{uuid.uuid4().hex[:8].upper()}",
            id_cliente=data["id_cliente"],
            id_pedido=data["id_pedido"],
            id_produto=data["id_produto"],
            nota_produto=data["nota_produto"],
            nota_nps=data["nota_nps"],
            recomenda=data["recomenda"],
            comentario=data.get("comentario"),
            sentimento=data.get("sentimento") or _sentimento_from_nota(data["nota_produto"]),
            data_avaliacao=data.get("data_avaliacao") or date.today(),
            nome_produto=data["nome_produto"],
            categoria_produto=data["categoria_produto"],
            nome_cliente=data["nome_cliente"],
        )
        db.add(review)
        db.commit()
        db.refresh(review)
        return review
    finally:
        db.close()


def update(id_avaliacao: str, data: dict) -> Review | None:
    db = SessionLocal()
    try:
        review = db.query(Review).filter(Review.id_avaliacao == id_avaliacao).first()
        if not review:
            return None
        for field, value in data.items():
            setattr(review, field, value)
        # recalcula sentimento se nota mudou e sentimento não foi fornecido explicitamente
        if "nota_produto" in data and "sentimento" not in data:
            review.sentimento = _sentimento_from_nota(data["nota_produto"])
        db.commit()
        db.refresh(review)
        return review
    finally:
        db.close()


def delete(id_avaliacao: str) -> bool:
    db = SessionLocal()
    try:
        review = db.query(Review).filter(Review.id_avaliacao == id_avaliacao).first()
        if not review:
            return False
        db.delete(review)
        db.commit()
        return True
    finally:
        db.close()


def _sentimento_from_nota(nota: int) -> str:
    if nota >= 4:
        return "positivo"
    if nota == 3:
        return "neutro"
    return "negativo"
