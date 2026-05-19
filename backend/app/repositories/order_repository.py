from datetime import date

# When Gold CSVs arrive: replace MOCK_ORDERS with SQLAlchemy queries on gold_pedidos_enriquecidos.
MOCK_ORDERS: list[dict] = [
    {"id_pedido": 1,  "id_cliente": 1,  "id_produto": 1,  "data_pedido": date(2026, 4, 20), "quantidade": 1, "valor_unitario": 3499.00, "valor_total": 3499.00, "status": "Aprovado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Ana Silva",       "estado_cliente": "SP", "nome_produto": "Notebook ProMax 15\"",  "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 4, "trimestre": 2},
    {"id_pedido": 2,  "id_cliente": 1,  "id_produto": 2,  "data_pedido": date(2026, 2, 10), "quantidade": 2, "valor_unitario": 199.00,  "valor_total": 398.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Ana Silva",       "estado_cliente": "SP", "nome_produto": "Fone Bluetooth",       "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 2, "trimestre": 1},
    {"id_pedido": 3,  "id_cliente": 1,  "id_produto": 4,  "data_pedido": date(2025, 11, 5), "quantidade": 3, "valor_unitario": 89.00,   "valor_total": 267.00,  "status": "Reembolsado", "metodo_pagamento": "Boleto",  "nome_cliente": "Ana Silva",       "estado_cliente": "SP", "nome_produto": "Camiseta Polo",        "categoria_produto": "Roupas",      "ano": 2025, "mes": 11, "trimestre": 4},
    {"id_pedido": 4,  "id_cliente": 2,  "id_produto": 7,  "data_pedido": date(2026, 3, 18), "quantidade": 1, "valor_unitario": 2799.00, "valor_total": 2799.00, "status": "Aprovado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Bruno Costa",     "estado_cliente": "RJ", "nome_produto": "Smart TV 55\"",        "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 3, "trimestre": 1},
    {"id_pedido": 5,  "id_cliente": 2,  "id_produto": 3,  "data_pedido": date(2026, 1, 22), "quantidade": 1, "valor_unitario": 349.00,  "valor_total": 349.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Bruno Costa",     "estado_cliente": "RJ", "nome_produto": "Tênis Running",        "categoria_produto": "Esportes",    "ano": 2026, "mes": 1, "trimestre": 1},
    {"id_pedido": 6,  "id_cliente": 2,  "id_produto": 5,  "data_pedido": date(2025, 12, 3), "quantidade": 1, "valor_unitario": 459.00,  "valor_total": 459.00,  "status": "Reembolsado", "metodo_pagamento": "Cartao",  "nome_cliente": "Bruno Costa",     "estado_cliente": "RJ", "nome_produto": "Cafeteira Express",    "categoria_produto": "Cozinha",     "ano": 2025, "mes": 12, "trimestre": 4},
    {"id_pedido": 7,  "id_cliente": 3,  "id_produto": 6,  "data_pedido": date(2026, 4, 5),  "quantidade": 2, "valor_unitario": 59.00,   "valor_total": 118.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Carla Mendes",    "estado_cliente": "MG", "nome_produto": "Livro Python 101",     "categoria_produto": "Livros",      "ano": 2026, "mes": 4, "trimestre": 2},
    {"id_pedido": 8,  "id_cliente": 3,  "id_produto": 8,  "data_pedido": date(2026, 2, 14), "quantidade": 1, "valor_unitario": 189.00,  "valor_total": 189.00,  "status": "Aprovado",    "metodo_pagamento": "Boleto",  "nome_cliente": "Carla Mendes",    "estado_cliente": "MG", "nome_produto": "Mochila Urbana",       "categoria_produto": "Acessórios",  "ano": 2026, "mes": 2, "trimestre": 1},
    {"id_pedido": 9,  "id_cliente": 3,  "id_produto": 2,  "data_pedido": date(2025, 10, 8), "quantidade": 1, "valor_unitario": 199.00,  "valor_total": 199.00,  "status": "Recusado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Carla Mendes",    "estado_cliente": "MG", "nome_produto": "Fone Bluetooth",       "categoria_produto": "Eletrônicos", "ano": 2025, "mes": 10, "trimestre": 4},
    {"id_pedido": 10, "id_cliente": 4,  "id_produto": 3,  "data_pedido": date(2025, 9, 30), "quantidade": 1, "valor_unitario": 349.00,  "valor_total": 349.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Diego Santos",    "estado_cliente": "BA", "nome_produto": "Tênis Running",        "categoria_produto": "Esportes",    "ano": 2025, "mes": 9, "trimestre": 3},
    {"id_pedido": 11, "id_cliente": 4,  "id_produto": 4,  "data_pedido": date(2025, 6, 12), "quantidade": 2, "valor_unitario": 89.00,   "valor_total": 178.00,  "status": "Aprovado",    "metodo_pagamento": "Boleto",  "nome_cliente": "Diego Santos",    "estado_cliente": "BA", "nome_produto": "Camiseta Polo",        "categoria_produto": "Roupas",      "ano": 2025, "mes": 6, "trimestre": 2},
    {"id_pedido": 12, "id_cliente": 4,  "id_produto": 1,  "data_pedido": date(2024, 12, 1), "quantidade": 1, "valor_unitario": 3499.00, "valor_total": 3499.00, "status": "Recusado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Diego Santos",    "estado_cliente": "BA", "nome_produto": "Notebook ProMax 15\"",  "categoria_produto": "Eletrônicos", "ano": 2024, "mes": 12, "trimestre": 4},
    {"id_pedido": 13, "id_cliente": 5,  "id_produto": 3,  "data_pedido": date(2026, 5, 2),  "quantidade": 1, "valor_unitario": 349.00,  "valor_total": 349.00,  "status": "Aprovado",    "metodo_pagamento": "App",     "nome_cliente": "Elena Rodrigues", "estado_cliente": "PR", "nome_produto": "Tênis Running",        "categoria_produto": "Esportes",    "ano": 2026, "mes": 5, "trimestre": 2},
    {"id_pedido": 14, "id_cliente": 5,  "id_produto": 8,  "data_pedido": date(2026, 3, 11), "quantidade": 1, "valor_unitario": 189.00,  "valor_total": 189.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Elena Rodrigues", "estado_cliente": "PR", "nome_produto": "Mochila Urbana",       "categoria_produto": "Acessórios",  "ano": 2026, "mes": 3, "trimestre": 1},
    {"id_pedido": 15, "id_cliente": 6,  "id_produto": 1,  "data_pedido": date(2026, 5, 10), "quantidade": 1, "valor_unitario": 3499.00, "valor_total": 3499.00, "status": "Aprovado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Felipe Oliveira", "estado_cliente": "SP", "nome_produto": "Notebook ProMax 15\"",  "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 5, "trimestre": 2},
    {"id_pedido": 16, "id_cliente": 6,  "id_produto": 7,  "data_pedido": date(2026, 4, 2),  "quantidade": 1, "valor_unitario": 2799.00, "valor_total": 2799.00, "status": "Aprovado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Felipe Oliveira", "estado_cliente": "SP", "nome_produto": "Smart TV 55\"",        "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 4, "trimestre": 2},
    {"id_pedido": 17, "id_cliente": 6,  "id_produto": 5,  "data_pedido": date(2026, 1, 15), "quantidade": 2, "valor_unitario": 459.00,  "valor_total": 918.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Felipe Oliveira", "estado_cliente": "SP", "nome_produto": "Cafeteira Express",    "categoria_produto": "Cozinha",     "ano": 2026, "mes": 1, "trimestre": 1},
    {"id_pedido": 18, "id_cliente": 7,  "id_produto": 2,  "data_pedido": date(2026, 4, 28), "quantidade": 1, "valor_unitario": 199.00,  "valor_total": 199.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Gabriela Lima",   "estado_cliente": "SC", "nome_produto": "Fone Bluetooth",       "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 4, "trimestre": 2},
    {"id_pedido": 19, "id_cliente": 7,  "id_produto": 4,  "data_pedido": date(2026, 3, 5),  "quantidade": 2, "valor_unitario": 89.00,   "valor_total": 178.00,  "status": "Reembolsado", "metodo_pagamento": "Boleto",  "nome_cliente": "Gabriela Lima",   "estado_cliente": "SC", "nome_produto": "Camiseta Polo",        "categoria_produto": "Roupas",      "ano": 2026, "mes": 3, "trimestre": 1},
    {"id_pedido": 20, "id_cliente": 8,  "id_produto": 2,  "data_pedido": date(2025, 7, 10), "quantidade": 1, "valor_unitario": 199.00,  "valor_total": 199.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "Henrique Ferreira","estado_cliente": "GO", "nome_produto": "Fone Bluetooth",       "categoria_produto": "Eletrônicos", "ano": 2025, "mes": 7, "trimestre": 3},
    {"id_pedido": 21, "id_cliente": 8,  "id_produto": 6,  "data_pedido": date(2025, 3, 22), "quantidade": 1, "valor_unitario": 59.00,   "valor_total": 59.00,   "status": "Recusado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Henrique Ferreira","estado_cliente": "GO", "nome_produto": "Livro Python 101",     "categoria_produto": "Livros",      "ano": 2025, "mes": 3, "trimestre": 1},
    {"id_pedido": 22, "id_cliente": 9,  "id_produto": 1,  "data_pedido": date(2026, 5, 8),  "quantidade": 1, "valor_unitario": 3499.00, "valor_total": 3499.00, "status": "Aprovado",    "metodo_pagamento": "App",     "nome_cliente": "Isabela Martins", "estado_cliente": "CE", "nome_produto": "Notebook ProMax 15\"",  "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 5, "trimestre": 2},
    {"id_pedido": 23, "id_cliente": 9,  "id_produto": 7,  "data_pedido": date(2026, 4, 15), "quantidade": 1, "valor_unitario": 2799.00, "valor_total": 2799.00, "status": "Aprovado",    "metodo_pagamento": "Cartao",  "nome_cliente": "Isabela Martins", "estado_cliente": "CE", "nome_produto": "Smart TV 55\"",        "categoria_produto": "Eletrônicos", "ano": 2026, "mes": 4, "trimestre": 2},
    {"id_pedido": 24, "id_cliente": 9,  "id_produto": 3,  "data_pedido": date(2025, 12, 8), "quantidade": 1, "valor_unitario": 349.00,  "valor_total": 349.00,  "status": "Reembolsado", "metodo_pagamento": "PIX",     "nome_cliente": "Isabela Martins", "estado_cliente": "CE", "nome_produto": "Tênis Running",        "categoria_produto": "Esportes",    "ano": 2025, "mes": 12, "trimestre": 4},
    {"id_pedido": 25, "id_cliente": 10, "id_produto": 5,  "data_pedido": date(2026, 5, 12), "quantidade": 1, "valor_unitario": 459.00,  "valor_total": 459.00,  "status": "Processando", "metodo_pagamento": "PIX",     "nome_cliente": "João Pires",      "estado_cliente": "SP", "nome_produto": "Cafeteira Express",    "categoria_produto": "Cozinha",     "ano": 2026, "mes": 5, "trimestre": 2},
    {"id_pedido": 26, "id_cliente": 10, "id_produto": 8,  "data_pedido": date(2026, 4, 18), "quantidade": 1, "valor_unitario": 189.00,  "valor_total": 189.00,  "status": "Aprovado",    "metodo_pagamento": "Boleto",  "nome_cliente": "João Pires",      "estado_cliente": "SP", "nome_produto": "Mochila Urbana",       "categoria_produto": "Acessórios",  "ano": 2026, "mes": 4, "trimestre": 2},
    {"id_pedido": 27, "id_cliente": 10, "id_produto": 6,  "data_pedido": date(2026, 2, 28), "quantidade": 3, "valor_unitario": 59.00,   "valor_total": 177.00,  "status": "Aprovado",    "metodo_pagamento": "PIX",     "nome_cliente": "João Pires",      "estado_cliente": "SP", "nome_produto": "Livro Python 101",     "categoria_produto": "Livros",      "ano": 2026, "mes": 2, "trimestre": 1},
]


def get_all(
    status: str | None = None,
    categoria: str | None = None,
    estado: str | None = None,
    id_cliente: int | None = None,
    data_inicio: str | None = None,
    data_fim: str | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    # When Gold CSVs arrive: replace body with SQLAlchemy query on gold_pedidos_enriquecidos.
    items = MOCK_ORDERS
    if status:
        items = [o for o in items if o["status"] == status]
    if categoria:
        items = [o for o in items if o["categoria_produto"] == categoria]
    if estado:
        items = [o for o in items if o["estado_cliente"] == estado.upper()]
    if id_cliente:
        items = [o for o in items if o["id_cliente"] == id_cliente]
    if data_inicio:
        d = date.fromisoformat(data_inicio)
        items = [o for o in items if o["data_pedido"] >= d]
    if data_fim:
        d = date.fromisoformat(data_fim)
        items = [o for o in items if o["data_pedido"] <= d]
    total = len(items)
    offset = (page - 1) * size
    return items[offset: offset + size], total


def get_by_id(id_pedido: int) -> dict | None:
    # When Gold CSVs arrive: replace with db.query(Order).filter_by(id_pedido=id_pedido).first()
    return next((o for o in MOCK_ORDERS if o["id_pedido"] == id_pedido), None)


def get_by_customer(id_cliente: int) -> list[dict]:
    return [o for o in MOCK_ORDERS if o["id_cliente"] == id_cliente]
