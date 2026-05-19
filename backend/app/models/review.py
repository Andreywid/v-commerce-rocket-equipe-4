from sqlalchemy import Boolean, Column, Integer, String
from app.database import Base


class Review(Base):
    __tablename__ = "gold_avaliacoes"

    id_avaliacao = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True)
    id_pedido = Column(String, index=True)
    id_produto = Column(String, index=True)

    nota_produto = Column(Integer, nullable=True)
    nota_nps = Column(Integer, nullable=True)
    recomenda = Column(Boolean)
    comentario = Column(String, nullable=True)
    sentimento = Column(String, nullable=True)
    data_avaliacao = Column(String)

    nome_produto = Column(String)
    categoria_produto = Column(String, nullable=True)
    nome_cliente = Column(String)
