from sqlalchemy import Column, Integer, String
from app.database import Base


class ClickstreamResumo(Base):
    __tablename__ = "gold_clickstream_resumo"

    id_cliente = Column(String, primary_key=True, index=True)
    data = Column(String, primary_key=True)

    qtd_eventos = Column(Integer, default=0)
    qtd_sessoes = Column(Integer, default=0)

    qtd_page_view = Column(Integer, default=0)
    qtd_click = Column(Integer, default=0)
    qtd_add_to_cart = Column(Integer, default=0)
    qtd_abandon_cart = Column(Integer, default=0)
    qtd_purchase = Column(Integer, default=0)
    qtd_search = Column(Integer, default=0)

    canal_principal = Column(String, nullable=True)        # web | mobile | app
    dispositivo_principal = Column(String, nullable=True)  # celular | computador | tablet
    tempo_total_segundos = Column(Integer, default=0)
    data_referencia_calculo = Column(String, nullable=True)
