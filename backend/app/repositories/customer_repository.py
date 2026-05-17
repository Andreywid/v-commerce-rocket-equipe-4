from datetime import date

# When Gold CSVs arrive: replace MOCK_CUSTOMERS with a SQLAlchemy query against gold_cliente_360.
# The service layer does not need to change — only the get_all / get_by_id functions below.
MOCK_CUSTOMERS: list[dict] = [
    {
        "id_cliente": 1, "nome": "Ana Silva", "email": "ana.silva@email.com",
        "telefone": "(11) 99201-4567", "data_cadastro": date(2023, 3, 10),
        "cidade": "São Paulo", "estado": "SP", "origem": "Web",
        "qtd_pedidos_total": 12, "qtd_pedidos_aprovados": 10, "qtd_pedidos_recusados": 1,
        "qtd_pedidos_reembolsados": 1, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 4820.50, "ticket_medio": 482.05,
        "data_primeiro_pedido": date(2023, 3, 15), "data_ultimo_pedido": date(2026, 4, 20),
        "qtd_tickets_total": 2, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 2,
        "qtd_avaliacoes": 8, "nota_media_dada": 4.3, "nps_medio_avaliacoes_cliente": 8.5,
        "qtd_eventos_clickstream": 340, "canal_preferido": "Web",
        "segmento_ltv": "Alto", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 2, "nome": "Bruno Costa", "email": "bruno.costa@email.com",
        "telefone": "(21) 98345-6789", "data_cadastro": date(2023, 7, 22),
        "cidade": "Rio de Janeiro", "estado": "RJ", "origem": "App",
        "qtd_pedidos_total": 8, "qtd_pedidos_aprovados": 7, "qtd_pedidos_recusados": 0,
        "qtd_pedidos_reembolsados": 1, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 3210.00, "ticket_medio": 401.25,
        "data_primeiro_pedido": date(2023, 7, 25), "data_ultimo_pedido": date(2026, 3, 18),
        "qtd_tickets_total": 1, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 1,
        "qtd_avaliacoes": 5, "nota_media_dada": 4.6, "nps_medio_avaliacoes_cliente": 9.0,
        "qtd_eventos_clickstream": 210, "canal_preferido": "App",
        "segmento_ltv": "Alto", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 3, "nome": "Carla Mendes", "email": "carla.mendes@email.com",
        "telefone": "(31) 97654-3210", "data_cadastro": date(2024, 1, 5),
        "cidade": "Belo Horizonte", "estado": "MG", "origem": "Indicacao",
        "qtd_pedidos_total": 5, "qtd_pedidos_aprovados": 4, "qtd_pedidos_recusados": 1,
        "qtd_pedidos_reembolsados": 0, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 1540.00, "ticket_medio": 308.00,
        "data_primeiro_pedido": date(2024, 1, 10), "data_ultimo_pedido": date(2026, 4, 5),
        "qtd_tickets_total": 3, "qtd_tickets_abertos": 1, "qtd_tickets_resolvidos": 2,
        "qtd_avaliacoes": 3, "nota_media_dada": 3.7, "nps_medio_avaliacoes_cliente": 6.0,
        "qtd_eventos_clickstream": 120, "canal_preferido": "Web",
        "segmento_ltv": "Medio", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 4, "nome": "Diego Santos", "email": "diego.santos@email.com",
        "telefone": "(71) 96543-2109", "data_cadastro": date(2022, 11, 14),
        "cidade": "Salvador", "estado": "BA", "origem": "Web",
        "qtd_pedidos_total": 3, "qtd_pedidos_aprovados": 2, "qtd_pedidos_recusados": 1,
        "qtd_pedidos_reembolsados": 0, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 670.00, "ticket_medio": 223.33,
        "data_primeiro_pedido": date(2022, 11, 20), "data_ultimo_pedido": date(2025, 9, 30),
        "qtd_tickets_total": 4, "qtd_tickets_abertos": 3, "qtd_tickets_resolvidos": 1,
        "qtd_avaliacoes": 1, "nota_media_dada": 2.0, "nps_medio_avaliacoes_cliente": 3.0,
        "qtd_eventos_clickstream": 45, "canal_preferido": "Mobile",
        "segmento_ltv": "Baixo", "is_ativo_90d": False, "is_em_risco": True,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 5, "nome": "Elena Rodrigues", "email": "elena.rodrigues@email.com",
        "telefone": "(41) 95432-1098", "data_cadastro": date(2024, 6, 3),
        "cidade": "Curitiba", "estado": "PR", "origem": "App",
        "qtd_pedidos_total": 4, "qtd_pedidos_aprovados": 4, "qtd_pedidos_recusados": 0,
        "qtd_pedidos_reembolsados": 0, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 980.00, "ticket_medio": 245.00,
        "data_primeiro_pedido": date(2024, 6, 5), "data_ultimo_pedido": date(2026, 5, 2),
        "qtd_tickets_total": 0, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 0,
        "qtd_avaliacoes": 4, "nota_media_dada": 5.0, "nps_medio_avaliacoes_cliente": 10.0,
        "qtd_eventos_clickstream": 180, "canal_preferido": "App",
        "segmento_ltv": "Medio", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 6, "nome": "Felipe Oliveira", "email": "felipe.oliveira@email.com",
        "telefone": "(11) 94321-0987", "data_cadastro": date(2022, 5, 20),
        "cidade": "Campinas", "estado": "SP", "origem": "Web",
        "qtd_pedidos_total": 18, "qtd_pedidos_aprovados": 16, "qtd_pedidos_recusados": 1,
        "qtd_pedidos_reembolsados": 1, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 9200.00, "ticket_medio": 511.11,
        "data_primeiro_pedido": date(2022, 5, 25), "data_ultimo_pedido": date(2026, 5, 10),
        "qtd_tickets_total": 2, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 2,
        "qtd_avaliacoes": 14, "nota_media_dada": 4.5, "nps_medio_avaliacoes_cliente": 9.2,
        "qtd_eventos_clickstream": 520, "canal_preferido": "Web",
        "segmento_ltv": "Alto", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 7, "nome": "Gabriela Lima", "email": "gabriela.lima@email.com",
        "telefone": "(48) 93210-9876", "data_cadastro": date(2023, 9, 18),
        "cidade": "Florianópolis", "estado": "SC", "origem": "Indicacao",
        "qtd_pedidos_total": 6, "qtd_pedidos_aprovados": 5, "qtd_pedidos_recusados": 0,
        "qtd_pedidos_reembolsados": 1, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 1870.00, "ticket_medio": 311.67,
        "data_primeiro_pedido": date(2023, 9, 20), "data_ultimo_pedido": date(2026, 4, 28),
        "qtd_tickets_total": 1, "qtd_tickets_abertos": 1, "qtd_tickets_resolvidos": 0,
        "qtd_avaliacoes": 4, "nota_media_dada": 4.0, "nps_medio_avaliacoes_cliente": 7.5,
        "qtd_eventos_clickstream": 160, "canal_preferido": "Mobile",
        "segmento_ltv": "Medio", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 8, "nome": "Henrique Ferreira", "email": "henrique.ferreira@email.com",
        "telefone": "(62) 92109-8765", "data_cadastro": date(2023, 2, 11),
        "cidade": "Goiânia", "estado": "GO", "origem": "Web",
        "qtd_pedidos_total": 2, "qtd_pedidos_aprovados": 1, "qtd_pedidos_recusados": 1,
        "qtd_pedidos_reembolsados": 0, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 199.00, "ticket_medio": 99.50,
        "data_primeiro_pedido": date(2023, 2, 15), "data_ultimo_pedido": date(2025, 7, 10),
        "qtd_tickets_total": 1, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 1,
        "qtd_avaliacoes": 1, "nota_media_dada": 3.0, "nps_medio_avaliacoes_cliente": 5.0,
        "qtd_eventos_clickstream": 30, "canal_preferido": "Web",
        "segmento_ltv": "Baixo", "is_ativo_90d": False, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 9, "nome": "Isabela Martins", "email": "isabela.martins@email.com",
        "telefone": "(85) 91098-7654", "data_cadastro": date(2023, 11, 30),
        "cidade": "Fortaleza", "estado": "CE", "origem": "App",
        "qtd_pedidos_total": 10, "qtd_pedidos_aprovados": 9, "qtd_pedidos_recusados": 0,
        "qtd_pedidos_reembolsados": 1, "qtd_pedidos_processando": 0,
        "valor_total_gasto": 5430.00, "ticket_medio": 543.00,
        "data_primeiro_pedido": date(2023, 12, 2), "data_ultimo_pedido": date(2026, 5, 8),
        "qtd_tickets_total": 2, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 2,
        "qtd_avaliacoes": 7, "nota_media_dada": 4.7, "nps_medio_avaliacoes_cliente": 9.4,
        "qtd_eventos_clickstream": 290, "canal_preferido": "App",
        "segmento_ltv": "Alto", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_cliente": 10, "nome": "João Pires", "email": "joao.pires@email.com",
        "telefone": "(11) 90987-6543", "data_cadastro": date(2024, 4, 7),
        "cidade": "Santo André", "estado": "SP", "origem": "Web",
        "qtd_pedidos_total": 7, "qtd_pedidos_aprovados": 6, "qtd_pedidos_recusados": 0,
        "qtd_pedidos_reembolsados": 0, "qtd_pedidos_processando": 1,
        "valor_total_gasto": 2340.00, "ticket_medio": 334.29,
        "data_primeiro_pedido": date(2024, 4, 10), "data_ultimo_pedido": date(2026, 5, 12),
        "qtd_tickets_total": 1, "qtd_tickets_abertos": 0, "qtd_tickets_resolvidos": 1,
        "qtd_avaliacoes": 5, "nota_media_dada": 4.2, "nps_medio_avaliacoes_cliente": 8.0,
        "qtd_eventos_clickstream": 195, "canal_preferido": "Web",
        "segmento_ltv": "Medio", "is_ativo_90d": True, "is_em_risco": False,
        "data_referencia_calculo": date(2026, 5, 1),
    },
]


def get_all(
    nome: str | None = None,
    email: str | None = None,
    estado: str | None = None,
    segmento: str | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    # When Gold CSVs arrive: replace body with SQLAlchemy query on gold_cliente_360.
    items = MOCK_CUSTOMERS
    if nome:
        items = [c for c in items if nome.lower() in c["nome"].lower()]
    if email:
        items = [c for c in items if email.lower() in c["email"].lower()]
    if estado:
        items = [c for c in items if c["estado"] == estado.upper()]
    if segmento:
        items = [c for c in items if c["segmento_ltv"] == segmento]
    total = len(items)
    offset = (page - 1) * size
    return items[offset: offset + size], total


def get_by_id(id_cliente: int) -> dict | None:
    # When Gold CSVs arrive: replace with db.query(Customer).filter_by(id_cliente=id_cliente).first()
    return next((c for c in MOCK_CUSTOMERS if c["id_cliente"] == id_cliente), None)
