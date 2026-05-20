from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class DashboardKPI(Base):
    __tablename__ = "gold_vendas_kpis"

    id = Column(Integer, primary_key=True, index=True)
    ano = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    ano_mes = Column(String, nullable=False, index=True)
    qtd_pedidos = Column(Integer, nullable=False)
    qtd_pedidos_aprovados = Column(Integer, nullable=False)
    qtd_pedidos_recusados = Column(Integer, nullable=False)
    qtd_pedidos_reembolsados = Column(Integer, nullable=False)
    qtd_pedidos_processando = Column(Integer, nullable=False)
    receita_bruta = Column(Float, nullable=False)
    ticket_medio = Column(Float, nullable=False)
    qtd_clientes_unicos = Column(Integer, nullable=False)
    qtd_clientes_novos = Column(Integer, nullable=False)
    taxa_aprovacao = Column(Float, nullable=False)
    taxa_recusa = Column(Float, nullable=False)
    taxa_reembolso = Column(Float, nullable=False)
    categoria_mais_vendida = Column(String, nullable=False)
    estado_maior_receita = Column(String, nullable=False)
    data_referencia_calculo = Column(Date, nullable=False)
