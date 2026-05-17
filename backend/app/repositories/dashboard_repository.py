from app.database import SessionLocal
from app.models.dashboard_kpi import DashboardKPI

_PERIODOS_VALIDOS = {"3m": 3, "6m": 6, "12m": 12, "all": 9999}


def get_kpis(periodo: str = "12m") -> list[dict]:
    meses_count = _PERIODOS_VALIDOS.get(periodo, 12)
    
    db = SessionLocal()
    try:
        # Busca os KPIs ordenados por data (ano_mes) e pega os últimos N meses
        results = (
            db.query(DashboardKPI)
            .order_by(DashboardKPI.ano_mes.asc())
            .all()
        )
        
        # Converte os modelos SQLAlchemy em dicionários compatíveis com o schema
        kpis = [
            {
                "ano": k.ano,
                "mes": k.mes,
                "ano_mes": k.ano_mes,
                "qtd_pedidos": k.qtd_pedidos,
                "qtd_pedidos_aprovados": k.qtd_pedidos_aprovados,
                "qtd_pedidos_recusados": k.qtd_pedidos_recusados,
                "qtd_pedidos_reembolsados": k.qtd_pedidos_reembolsados,
                "qtd_pedidos_processando": k.qtd_pedidos_processando,
                "receita_bruta": k.receita_bruta,
                "ticket_medio": k.ticket_medio,
                "qtd_clientes_unicos": k.qtd_clientes_unicos,
                "qtd_clientes_novos": k.qtd_clientes_novos,
                "taxa_aprovacao": k.taxa_aprovacao,
                "taxa_recusa": k.taxa_recusa,
                "taxa_reembolso": k.taxa_reembolso,
                "categoria_mais_vendida": k.categoria_mais_vendida,
                "estado_maior_receita": k.estado_maior_receita,
                "data_referencia_calculo": k.data_referencia_calculo,
            }
            for k in results[-meses_count:]
        ]
        return kpis
    finally:
        db.close()
