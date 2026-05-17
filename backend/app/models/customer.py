from sqlalchemy import Boolean, Column, Date, Float, Integer, String
from app.database import Base


class Customer(Base):
    __tablename__ = "gold_cliente_360"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, index=True)
    telefone = Column(String, nullable=True)
    data_cadastro = Column(Date, nullable=True)
    cidade = Column(String, nullable=True)
    estado = Column(String(2), nullable=True)
    origem = Column(String, nullable=True)  # App | Web | Indicacao

    qtd_pedidos_total = Column(Integer, default=0)
    qtd_pedidos_aprovados = Column(Integer, default=0)
    qtd_pedidos_recusados = Column(Integer, default=0)
    qtd_pedidos_reembolsados = Column(Integer, default=0)
    qtd_pedidos_processando = Column(Integer, default=0)
    valor_total_gasto = Column(Float, default=0.0)
    ticket_medio = Column(Float, default=0.0)
    data_primeiro_pedido = Column(Date, nullable=True)
    data_ultimo_pedido = Column(Date, nullable=True)

    qtd_tickets_total = Column(Integer, default=0)
    qtd_tickets_abertos = Column(Integer, default=0)
    qtd_tickets_resolvidos = Column(Integer, default=0)

    qtd_avaliacoes = Column(Integer, default=0)
    nota_media_dada = Column(Float, nullable=True)
    nps_medio_avaliacoes_cliente = Column(Float, nullable=True)

    qtd_eventos_clickstream = Column(Integer, default=0)
    canal_preferido = Column(String, nullable=True)  # Web | Mobile | App

    segmento_ltv = Column(String, nullable=True)  # Alto | Medio | Baixo
    is_ativo_90d = Column(Boolean, default=True)
    is_em_risco = Column(Boolean, default=False)
    data_referencia_calculo = Column(Date, nullable=True)
