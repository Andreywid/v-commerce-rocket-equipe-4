from datetime import date

# When Gold CSVs arrive: replace MOCK_TICKETS with SQLAlchemy queries on gold_tickets.
MOCK_TICKETS: list[dict] = [
    {
        "id_ticket": 1, "id_cliente": 1, "id_pedido": 3, "id_produto": 4,
        "tipo_problema": "Reembolso", "satisfacao_atendimento": "alta",
        "data_abertura": date(2025, 11, 7), "data_resolucao": date(2025, 11, 8),
        "tempo_resolucao_horas": 18.0, "agente_suporte": "Marcos R.", "nota_avaliacao": 5,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Ana Silva", "nome_produto": "Camiseta Polo",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 2, "id_cliente": 1, "id_pedido": 2, "id_produto": 2,
        "tipo_problema": "Entrega", "satisfacao_atendimento": "media",
        "data_abertura": date(2026, 2, 15), "data_resolucao": date(2026, 2, 16),
        "tempo_resolucao_horas": 30.0, "agente_suporte": "Júlia S.", "nota_avaliacao": 4,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Ana Silva", "nome_produto": "Fone Bluetooth",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 3, "id_cliente": 2, "id_pedido": 6, "id_produto": 5,
        "tipo_problema": "Produto", "satisfacao_atendimento": "baixa",
        "data_abertura": date(2025, 12, 5), "data_resolucao": date(2025, 12, 10),
        "tempo_resolucao_horas": 120.0, "agente_suporte": "Carlos M.", "nota_avaliacao": 2,
        "status_ticket": "Resolvido", "sla_estourado": True,
        "nome_cliente": "Bruno Costa", "nome_produto": "Cafeteira Express",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 4, "id_cliente": 3, "id_pedido": 9, "id_produto": 2,
        "tipo_problema": "Pagamento", "satisfacao_atendimento": "sem_avaliacao",
        "data_abertura": date(2025, 10, 9), "data_resolucao": date(2025, 10, 11),
        "tempo_resolucao_horas": 44.0, "agente_suporte": "Marcos R.", "nota_avaliacao": None,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Carla Mendes", "nome_produto": "Fone Bluetooth",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 5, "id_cliente": 3, "id_pedido": 7, "id_produto": 6,
        "tipo_problema": "Entrega", "satisfacao_atendimento": "media",
        "data_abertura": date(2026, 4, 8), "data_resolucao": date(2026, 4, 9),
        "tempo_resolucao_horas": 24.0, "agente_suporte": "Júlia S.", "nota_avaliacao": 3,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Carla Mendes", "nome_produto": "Livro Python 101",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 6, "id_cliente": 3, "id_pedido": 8, "id_produto": 8,
        "tipo_problema": "Produto", "satisfacao_atendimento": "sem_avaliacao",
        "data_abertura": date(2026, 4, 25), "data_resolucao": None,
        "tempo_resolucao_horas": None, "agente_suporte": "Carlos M.", "nota_avaliacao": None,
        "status_ticket": "Aberto", "sla_estourado": True,
        "nome_cliente": "Carla Mendes", "nome_produto": "Mochila Urbana",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 7, "id_cliente": 4, "id_pedido": 10, "id_produto": 3,
        "tipo_problema": "Entrega", "satisfacao_atendimento": "baixa",
        "data_abertura": date(2025, 10, 2), "data_resolucao": date(2025, 10, 6),
        "tempo_resolucao_horas": 96.0, "agente_suporte": "Marcos R.", "nota_avaliacao": 1,
        "status_ticket": "Resolvido", "sla_estourado": True,
        "nome_cliente": "Diego Santos", "nome_produto": "Tênis Running",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 8, "id_cliente": 4, "id_pedido": 11, "id_produto": 4,
        "tipo_problema": "Produto", "satisfacao_atendimento": "sem_avaliacao",
        "data_abertura": date(2026, 1, 10), "data_resolucao": None,
        "tempo_resolucao_horas": None, "agente_suporte": "Júlia S.", "nota_avaliacao": None,
        "status_ticket": "Aberto", "sla_estourado": True,
        "nome_cliente": "Diego Santos", "nome_produto": "Camiseta Polo",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 9, "id_cliente": 4, "id_pedido": None, "id_produto": None,
        "tipo_problema": "Pagamento", "satisfacao_atendimento": "sem_avaliacao",
        "data_abertura": date(2026, 3, 5), "data_resolucao": None,
        "tempo_resolucao_horas": None, "agente_suporte": "Carlos M.", "nota_avaliacao": None,
        "status_ticket": "Aberto", "sla_estourado": True,
        "nome_cliente": "Diego Santos", "nome_produto": None,
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 10, "id_cliente": 6, "id_pedido": 17, "id_produto": 5,
        "tipo_problema": "Produto", "satisfacao_atendimento": "alta",
        "data_abertura": date(2026, 1, 20), "data_resolucao": date(2026, 1, 21),
        "tempo_resolucao_horas": 12.0, "agente_suporte": "Marcos R.", "nota_avaliacao": 5,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Felipe Oliveira", "nome_produto": "Cafeteira Express",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 11, "id_cliente": 6, "id_pedido": 16, "id_produto": 7,
        "tipo_problema": "Entrega", "satisfacao_atendimento": "alta",
        "data_abertura": date(2026, 4, 5), "data_resolucao": date(2026, 4, 6),
        "tempo_resolucao_horas": 20.0, "agente_suporte": "Júlia S.", "nota_avaliacao": 5,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Felipe Oliveira", "nome_produto": "Smart TV 55\"",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 12, "id_cliente": 7, "id_pedido": 19, "id_produto": 4,
        "tipo_problema": "Reembolso", "satisfacao_atendimento": "sem_avaliacao",
        "data_abertura": date(2026, 4, 30), "data_resolucao": None,
        "tempo_resolucao_horas": None, "agente_suporte": "Carlos M.", "nota_avaliacao": None,
        "status_ticket": "Aberto", "sla_estourado": False,
        "nome_cliente": "Gabriela Lima", "nome_produto": "Camiseta Polo",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 13, "id_cliente": 8, "id_pedido": 20, "id_produto": 2,
        "tipo_problema": "Entrega", "satisfacao_atendimento": "media",
        "data_abertura": date(2025, 7, 12), "data_resolucao": date(2025, 7, 14),
        "tempo_resolucao_horas": 48.0, "agente_suporte": "Marcos R.", "nota_avaliacao": 3,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Henrique Ferreira", "nome_produto": "Fone Bluetooth",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 14, "id_cliente": 9, "id_pedido": 24, "id_produto": 3,
        "tipo_problema": "Reembolso", "satisfacao_atendimento": "alta",
        "data_abertura": date(2025, 12, 10), "data_resolucao": date(2025, 12, 11),
        "tempo_resolucao_horas": 16.0, "agente_suporte": "Júlia S.", "nota_avaliacao": 5,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "Isabela Martins", "nome_produto": "Tênis Running",
        "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_ticket": 15, "id_cliente": 10, "id_pedido": 27, "id_produto": 6,
        "tipo_problema": "Entrega", "satisfacao_atendimento": "alta",
        "data_abertura": date(2026, 3, 2), "data_resolucao": date(2026, 3, 3),
        "tempo_resolucao_horas": 22.0, "agente_suporte": "Carlos M.", "nota_avaliacao": 4,
        "status_ticket": "Resolvido", "sla_estourado": False,
        "nome_cliente": "João Pires", "nome_produto": "Livro Python 101",
        "data_referencia_calculo": date(2026, 5, 1),
    },
]


def get_all(
    id_cliente: int | None = None,
    tipo: str | None = None,
    status: str | None = None,
    sla_estourado: bool | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    # When Gold CSVs arrive: replace body with SQLAlchemy query on gold_tickets.
    items = MOCK_TICKETS
    if id_cliente:
        items = [t for t in items if t["id_cliente"] == id_cliente]
    if tipo:
        items = [t for t in items if t["tipo_problema"] == tipo]
    if status:
        items = [t for t in items if t["status_ticket"] == status]
    if sla_estourado is not None:
        items = [t for t in items if t["sla_estourado"] == sla_estourado]
    total = len(items)
    offset = (page - 1) * size
    return items[offset: offset + size], total


def get_by_id(id_ticket: int) -> dict | None:
    # When Gold CSVs arrive: replace with db.query(SupportTicket).filter_by(id_ticket=id_ticket).first()
    return next((t for t in MOCK_TICKETS if t["id_ticket"] == id_ticket), None)


def get_by_customer(id_cliente: int) -> list[dict]:
    return [t for t in MOCK_TICKETS if t["id_cliente"] == id_cliente]
