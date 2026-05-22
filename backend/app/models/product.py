from sqlalchemy import Boolean, Column, Date, Float, Integer, String
from app.database import Base


class Product(Base):
    __tablename__ = "gold_produto_performance"

    id_produto = Column(String, primary_key=True, index=True)
    nome_produto = Column(String, index=True)

    categoria = Column(String)
    preco_atual = Column(Float)
    ativo = Column(Boolean, default=True)
    fornecedor = Column(String, nullable=True)
    peso_kg = Column(Float, nullable=True)
    estoque_disponivel = Column(Integer, nullable=True)
    data_cadastro_produto = Column(Date, nullable=True)

    qtd_vendida_total = Column(Integer, default=0)
    qtd_vendida_30d = Column(Integer, default=0)
    qtd_vendida_90d = Column(Integer, default=0)
    receita_total = Column(Float, default=0.0)
    receita_30d = Column(Float, default=0.0)

    qtd_tickets_associados = Column(Integer, default=0)
    qtd_tickets_30d = Column(Integer, default=0)
    taxa_problema = Column(Float, nullable=True)

    qtd_avaliacoes = Column(Integer, default=0)
    nota_media = Column(Float, nullable=True)
    pct_recomendam = Column(Float, nullable=True)

    qtd_visualizacoes = Column(Integer, default=0)
    qtd_carrinho = Column(Integer, default=0)
    taxa_conversao = Column(Float, nullable=True)

    # Top Vendedor | Estavel | Problematico | Encalhado
    classificacao = Column(String, nullable=True)
    data_referencia_calculo = Column(Date, nullable=True)
