from sqlalchemy import Boolean, Column, Date, Float, Integer, String
from app.database import Base


class SupportTicket(Base):
    __tablename__ = "gold_tickets"

    id_ticket = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, index=True)
    id_pedido = Column(Integer, nullable=True)
    id_produto = Column(Integer, nullable=True, index=True)

    tipo_problema = Column(String)      # Entrega | Reembolso | Produto | Pagamento
    satisfacao_atendimento = Column(String)  # alta | media | baixa | sem_avaliacao
    data_abertura = Column(Date)
    data_resolucao = Column(Date, nullable=True)
    tempo_resolucao_horas = Column(Float, nullable=True)
    agente_suporte = Column(String)
    nota_avaliacao = Column(Integer, nullable=True)  # 1-5

    status_ticket = Column(String)      # Aberto | Resolvido
    sla_estourado = Column(Boolean, default=False)

    nome_cliente = Column(String)
    nome_produto = Column(String, nullable=True)
    data_referencia_calculo = Column(Date, nullable=True)
