from sqlalchemy import Boolean, Column, Float, Integer, String
from app.database import Base


class SupportTicket(Base):
    __tablename__ = "gold_tickets"

    id_ticket = Column(String, primary_key=True, index=True)
    id_cliente = Column(String, index=True)
    id_pedido = Column(String, nullable=True)
    id_produto = Column(String, nullable=True)

    tipo_problema = Column(String)
    satisfacao_atendimento = Column(String)
    data_abertura = Column(String)
    data_resolucao = Column(String, nullable=True)
    tempo_resolucao_horas = Column(Float, nullable=True)
    agente_suporte = Column(String)
    nota_avaliacao = Column(Integer, nullable=True)

    status_ticket = Column(String)
    sla_estourado = Column(Boolean, default=False)

    nome_cliente = Column(String)
    nome_produto = Column(String, nullable=True)
    maior_de_idade = Column(Boolean, nullable=True)
    data_referencia_calculo = Column(String, nullable=True)
