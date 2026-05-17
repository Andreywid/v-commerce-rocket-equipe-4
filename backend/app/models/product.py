from sqlalchemy import Boolean, Column, Date, Float, Integer, String
from app.database import Base


class Product(Base):
    __tablename__ = "gold_produto_performance"

    id_produto = Column(String, primary_key=True, index=True)
    nome_produto = Column(String, index=True)

    categoria = Column(String)
    preco_atual = Column(Float)
    ativo = Column(Boolean, default=True)
    
    # Novos campos para suporte ao CRUD e Frontend
    estoque = Column(Integer, nullable=True)
    descricao = Column(String, nullable=True)
    imagem_url = Column(String, nullable=True)

    qtd_vendida_total = Column(Integer, default=0)
    qtd_vendida_30d = Column(Integer, default=0)
    qtd_vendida_90d = Column(Integer, default=0)
    receita_total = Column(Float, default=0.0)
    receita_30d = Column(Float, default=0.0)

    qtd_tickets_associados = Column(Integer, default=0)
    qtd_tickets_30d = Column(Integer, default=0)
    taxa_problema = Column(Float, default=0.0)

    qtd_avaliacoes = Column(Integer, default=0)
    nota_media = Column(Float, nullable=True)
    pct_recomendam = Column(Float, nullable=True)

    qtd_visualizacoes = Column(Integer, default=0)
    qtd_carrinho = Column(Integer, default=0)
    taxa_conversao = Column(Float, default=0.0)

    # Top Vendedor | Estável | Problemático | Encalhado
    classificacao = Column(String, nullable=True)
    data_referencia_calculo = Column(Date, nullable=True)
