from datetime import date

# Mock data espelhando gold_vendas_kpis do contrato.
# Quando o banco gold chegar: substituir MOCK_KPI_DATA por uma query SQLAlchemy/SQL aqui.
# O restante do código (service, router) não precisa mudar.
MOCK_KPI_DATA: list[dict] = [
    {
        "ano": 2025, "mes": 5, "ano_mes": "2025-05",
        "qtd_pedidos": 1054, "qtd_pedidos_aprovados": 841,
        "qtd_pedidos_recusados": 132, "qtd_pedidos_reembolsados": 42, "qtd_pedidos_processando": 39,
        "receita_bruta": 128340.00, "ticket_medio": 152.60,
        "qtd_clientes_unicos": 789, "qtd_clientes_novos": 198,
        "taxa_aprovacao": 79.79, "taxa_recusa": 12.52, "taxa_reembolso": 3.98,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 6, 1),
    },
    {
        "ano": 2025, "mes": 6, "ano_mes": "2025-06",
        "qtd_pedidos": 1087, "qtd_pedidos_aprovados": 872,
        "qtd_pedidos_recusados": 128, "qtd_pedidos_reembolsados": 44, "qtd_pedidos_processando": 43,
        "receita_bruta": 135200.00, "ticket_medio": 155.04,
        "qtd_clientes_unicos": 812, "qtd_clientes_novos": 187,
        "taxa_aprovacao": 80.22, "taxa_recusa": 11.78, "taxa_reembolso": 4.05,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 7, 1),
    },
    {
        "ano": 2025, "mes": 7, "ano_mes": "2025-07",
        "qtd_pedidos": 1142, "qtd_pedidos_aprovados": 913,
        "qtd_pedidos_recusados": 140, "qtd_pedidos_reembolsados": 48, "qtd_pedidos_processando": 41,
        "receita_bruta": 141800.00, "ticket_medio": 155.26,
        "qtd_clientes_unicos": 854, "qtd_clientes_novos": 215,
        "taxa_aprovacao": 79.95, "taxa_recusa": 12.26, "taxa_reembolso": 4.20,
        "categoria_mais_vendida": "Esportes", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 8, 1),
    },
    {
        "ano": 2025, "mes": 8, "ano_mes": "2025-08",
        "qtd_pedidos": 1198, "qtd_pedidos_aprovados": 961,
        "qtd_pedidos_recusados": 148, "qtd_pedidos_reembolsados": 50, "qtd_pedidos_processando": 39,
        "receita_bruta": 149300.00, "ticket_medio": 155.36,
        "qtd_clientes_unicos": 891, "qtd_clientes_novos": 224,
        "taxa_aprovacao": 80.22, "taxa_recusa": 12.35, "taxa_reembolso": 4.17,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 9, 1),
    },
    {
        "ano": 2025, "mes": 9, "ano_mes": "2025-09",
        "qtd_pedidos": 1234, "qtd_pedidos_aprovados": 991,
        "qtd_pedidos_recusados": 153, "qtd_pedidos_reembolsados": 51, "qtd_pedidos_processando": 39,
        "receita_bruta": 156700.00, "ticket_medio": 158.12,
        "qtd_clientes_unicos": 920, "qtd_clientes_novos": 231,
        "taxa_aprovacao": 80.31, "taxa_recusa": 12.40, "taxa_reembolso": 4.13,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 10, 1),
    },
    {
        "ano": 2025, "mes": 10, "ano_mes": "2025-10",
        "qtd_pedidos": 1312, "qtd_pedidos_aprovados": 1054,
        "qtd_pedidos_recusados": 161, "qtd_pedidos_reembolsados": 55, "qtd_pedidos_processando": 42,
        "receita_bruta": 167500.00, "ticket_medio": 158.92,
        "qtd_clientes_unicos": 978, "qtd_clientes_novos": 248,
        "taxa_aprovacao": 80.34, "taxa_recusa": 12.27, "taxa_reembolso": 4.19,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 11, 1),
    },
    {
        # Black Friday — pico de novembro
        "ano": 2025, "mes": 11, "ano_mes": "2025-11",
        "qtd_pedidos": 1876, "qtd_pedidos_aprovados": 1512,
        "qtd_pedidos_recusados": 221, "qtd_pedidos_reembolsados": 78, "qtd_pedidos_processando": 65,
        "receita_bruta": 248900.00, "ticket_medio": 164.62,
        "qtd_clientes_unicos": 1354, "qtd_clientes_novos": 489,
        "taxa_aprovacao": 80.60, "taxa_recusa": 11.78, "taxa_reembolso": 4.16,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2025, 12, 1),
    },
    {
        # Natal
        "ano": 2025, "mes": 12, "ano_mes": "2025-12",
        "qtd_pedidos": 1654, "qtd_pedidos_aprovados": 1328,
        "qtd_pedidos_recusados": 198, "qtd_pedidos_reembolsados": 72, "qtd_pedidos_processando": 56,
        "receita_bruta": 218700.00, "ticket_medio": 164.69,
        "qtd_clientes_unicos": 1198, "qtd_clientes_novos": 356,
        "taxa_aprovacao": 80.29, "taxa_recusa": 11.97, "taxa_reembolso": 4.35,
        "categoria_mais_vendida": "Brinquedos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2026, 1, 1),
    },
    {
        "ano": 2026, "mes": 1, "ano_mes": "2026-01",
        "qtd_pedidos": 1143, "qtd_pedidos_aprovados": 912,
        "qtd_pedidos_recusados": 147, "qtd_pedidos_reembolsados": 52, "qtd_pedidos_processando": 32,
        "receita_bruta": 147200.00, "ticket_medio": 161.40,
        "qtd_clientes_unicos": 854, "qtd_clientes_novos": 189,
        "taxa_aprovacao": 79.79, "taxa_recusa": 12.86, "taxa_reembolso": 4.55,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2026, 2, 1),
    },
    {
        "ano": 2026, "mes": 2, "ano_mes": "2026-02",
        "qtd_pedidos": 1089, "qtd_pedidos_aprovados": 872,
        "qtd_pedidos_recusados": 139, "qtd_pedidos_reembolsados": 48, "qtd_pedidos_processando": 30,
        "receita_bruta": 138900.00, "ticket_medio": 159.29,
        "qtd_clientes_unicos": 814, "qtd_clientes_novos": 174,
        "taxa_aprovacao": 80.07, "taxa_recusa": 12.76, "taxa_reembolso": 4.41,
        "categoria_mais_vendida": "Roupas", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2026, 3, 1),
    },
    {
        "ano": 2026, "mes": 3, "ano_mes": "2026-03",
        "qtd_pedidos": 1198, "qtd_pedidos_aprovados": 965,
        "qtd_pedidos_recusados": 148, "qtd_pedidos_reembolsados": 49, "qtd_pedidos_processando": 36,
        "receita_bruta": 155400.00, "ticket_medio": 161.04,
        "qtd_clientes_unicos": 892, "qtd_clientes_novos": 201,
        "taxa_aprovacao": 80.55, "taxa_recusa": 12.35, "taxa_reembolso": 4.09,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2026, 4, 1),
    },
    {
        "ano": 2026, "mes": 4, "ano_mes": "2026-04",
        "qtd_pedidos": 1267, "qtd_pedidos_aprovados": 1019,
        "qtd_pedidos_recusados": 156, "qtd_pedidos_reembolsados": 52, "qtd_pedidos_processando": 40,
        "receita_bruta": 164800.00, "ticket_medio": 161.73,
        "qtd_clientes_unicos": 942, "qtd_clientes_novos": 218,
        "taxa_aprovacao": 80.43, "taxa_recusa": 12.31, "taxa_reembolso": 4.11,
        "categoria_mais_vendida": "Eletrônicos", "estado_maior_receita": "SP",
        "data_referencia_calculo": date(2026, 5, 1),
    },
]

_PERIODOS_VALIDOS = {"3m": 3, "6m": 6, "12m": 12}


def get_kpis(periodo: str = "12m") -> list[dict]:
    meses = _PERIODOS_VALIDOS.get(periodo, 12)
    return MOCK_KPI_DATA[-meses:]
