from sqlalchemy import Boolean, Column, Date, Integer, String
from app.database import Base


class Review(Base):
    __tablename__ = "gold_avaliacoes"

    id_avaliacao = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True)
    id_pedido = Column(String, index=True)
    id_produto = Column(String, index=True)


    nota_produto = Column(Integer)   # 1-5
    nota_nps = Column(Integer)       # 0-10
    recomenda = Column(Boolean)
    comentario = Column(String, nullable=True)
    sentimento = Column(String)      # positivo | neutro | negativo
    data_avaliacao = Column(Date)

    nome_produto = Column(String)
    categoria_produto = Column(String)
    nome_cliente = Column(String)
