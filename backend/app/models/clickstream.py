from sqlalchemy import Column, Date, Integer, String, UniqueConstraint
from app.database import Base


class ClickstreamResumo(Base):
    __tablename__ = "gold_clickstream_resumo"
    __table_args__ = (UniqueConstraint("id_cliente", "data", name="uq_cliente_data"),)

    id = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, index=True)
    data = Column(Date)

    qtd_eventos = Column(Integer, default=0)
    qtd_sessoes = Column(Integer, default=0)

    qtd_page_view = Column(Integer, default=0)
    qtd_click = Column(Integer, default=0)
    qtd_add_to_cart = Column(Integer, default=0)
    qtd_abandon_cart = Column(Integer, default=0)
    qtd_purchase = Column(Integer, default=0)
    qtd_search = Column(Integer, default=0)

    canal_principal = Column(String, nullable=True)        # Web | Mobile | App
    dispositivo_principal = Column(String, nullable=True)  # Desktop | Mobile | Tablet
    tempo_total_segundos = Column(Integer, default=0)
    data_referencia_calculo = Column(Date, nullable=True)
