from sqlalchemy import Column, Date, Float, Integer, String
from app.database import Base


class Order(Base):
    __tablename__ = "gold_pedidos_enriquecidos"

    id_pedido = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True)
    id_produto = Column(String, index=True)

    data_pedido = Column(Date)
    quantidade = Column(Integer)
    valor_unitario = Column(Float)
    valor_total = Column(Float)
    status = Column(String)          # Aprovado | Recusado | Reembolsado | Processando
    metodo_pagamento = Column(String)  # PIX | Cartao | Boleto

    nome_cliente = Column(String)
    estado_cliente = Column(String(2), nullable=True)
    nome_produto = Column(String)
    categoria_produto = Column(String)

    ano = Column(Integer)
    mes = Column(Integer)
    trimestre = Column(Integer)
