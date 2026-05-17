from datetime import date

# When Gold CSVs arrive: replace MOCK_PRODUCTS with SQLAlchemy queries on gold_produto_performance.
# CRUD (create/update/delete) will be replaced by db.add/db.commit/db.delete operations.
_next_id = 9

MOCK_PRODUCTS: list[dict] = [
    {
        "id_produto": 1, "nome_produto": "Notebook ProMax 15\"", "categoria": "Eletrônicos",
        "preco_atual": 3499.00, "ativo": True,
        "qtd_vendida_total": 85, "qtd_vendida_30d": 12, "qtd_vendida_90d": 38,
        "receita_total": 297415.00, "receita_30d": 41988.00,
        "qtd_tickets_associados": 8, "qtd_tickets_30d": 2, "taxa_problema": 0.094,
        "qtd_avaliacoes": 72, "nota_media": 4.4, "pct_recomendam": 88.9,
        "qtd_visualizacoes": 4200, "qtd_carrinho": 310, "taxa_conversao": 0.0202,
        "classificacao": "Top Vendedor", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 2, "nome_produto": "Fone Bluetooth", "categoria": "Eletrônicos",
        "preco_atual": 199.00, "ativo": True,
        "qtd_vendida_total": 210, "qtd_vendida_30d": 35, "qtd_vendida_90d": 95,
        "receita_total": 41790.00, "receita_30d": 6965.00,
        "qtd_tickets_associados": 14, "qtd_tickets_30d": 3, "taxa_problema": 0.067,
        "qtd_avaliacoes": 183, "nota_media": 4.1, "pct_recomendam": 82.0,
        "qtd_visualizacoes": 6100, "qtd_carrinho": 720, "taxa_conversao": 0.0344,
        "classificacao": "Top Vendedor", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 3, "nome_produto": "Tênis Running", "categoria": "Esportes",
        "preco_atual": 349.00, "ativo": True,
        "qtd_vendida_total": 130, "qtd_vendida_30d": 18, "qtd_vendida_90d": 52,
        "receita_total": 45370.00, "receita_30d": 6282.00,
        "qtd_tickets_associados": 6, "qtd_tickets_30d": 1, "taxa_problema": 0.046,
        "qtd_avaliacoes": 115, "nota_media": 4.6, "pct_recomendam": 93.0,
        "qtd_visualizacoes": 3800, "qtd_carrinho": 430, "taxa_conversao": 0.0342,
        "classificacao": "Top Vendedor", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 4, "nome_produto": "Camiseta Polo", "categoria": "Roupas",
        "preco_atual": 89.00, "ativo": True,
        "qtd_vendida_total": 320, "qtd_vendida_30d": 22, "qtd_vendida_90d": 70,
        "receita_total": 28480.00, "receita_30d": 1958.00,
        "qtd_tickets_associados": 18, "qtd_tickets_30d": 4, "taxa_problema": 0.056,
        "qtd_avaliacoes": 290, "nota_media": 3.8, "pct_recomendam": 71.0,
        "qtd_visualizacoes": 5500, "qtd_carrinho": 890, "taxa_conversao": 0.0582,
        "classificacao": "Estável", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 5, "nome_produto": "Cafeteira Express", "categoria": "Cozinha",
        "preco_atual": 459.00, "ativo": True,
        "qtd_vendida_total": 55, "qtd_vendida_30d": 8, "qtd_vendida_90d": 25,
        "receita_total": 25245.00, "receita_30d": 3672.00,
        "qtd_tickets_associados": 22, "qtd_tickets_30d": 5, "taxa_problema": 0.400,
        "qtd_avaliacoes": 48, "nota_media": 3.2, "pct_recomendam": 58.3,
        "qtd_visualizacoes": 2100, "qtd_carrinho": 180, "taxa_conversao": 0.0262,
        "classificacao": "Problemático", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 6, "nome_produto": "Livro Python 101", "categoria": "Livros",
        "preco_atual": 59.00, "ativo": True,
        "qtd_vendida_total": 95, "qtd_vendida_30d": 10, "qtd_vendida_90d": 30,
        "receita_total": 5605.00, "receita_30d": 590.00,
        "qtd_tickets_associados": 2, "qtd_tickets_30d": 0, "taxa_problema": 0.021,
        "qtd_avaliacoes": 88, "nota_media": 4.8, "pct_recomendam": 97.7,
        "qtd_visualizacoes": 2800, "qtd_carrinho": 380, "taxa_conversao": 0.0339,
        "classificacao": "Estável", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 7, "nome_produto": "Smart TV 55\"", "categoria": "Eletrônicos",
        "preco_atual": 2799.00, "ativo": True,
        "qtd_vendida_total": 42, "qtd_vendida_30d": 5, "qtd_vendida_90d": 18,
        "receita_total": 117558.00, "receita_30d": 13995.00,
        "qtd_tickets_associados": 5, "qtd_tickets_30d": 1, "taxa_problema": 0.119,
        "qtd_avaliacoes": 38, "nota_media": 4.5, "pct_recomendam": 89.5,
        "qtd_visualizacoes": 3100, "qtd_carrinho": 190, "taxa_conversao": 0.0135,
        "classificacao": "Top Vendedor", "data_referencia_calculo": date(2026, 5, 1),
    },
    {
        "id_produto": 8, "nome_produto": "Mochila Urbana", "categoria": "Acessórios",
        "preco_atual": 189.00, "ativo": True,
        "qtd_vendida_total": 18, "qtd_vendida_30d": 1, "qtd_vendida_90d": 4,
        "receita_total": 3402.00, "receita_30d": 189.00,
        "qtd_tickets_associados": 1, "qtd_tickets_30d": 0, "taxa_problema": 0.056,
        "qtd_avaliacoes": 15, "nota_media": 4.2, "pct_recomendam": 80.0,
        "qtd_visualizacoes": 900, "qtd_carrinho": 55, "taxa_conversao": 0.020,
        "classificacao": "Encalhado", "data_referencia_calculo": date(2026, 5, 1),
    },
]


def get_all(
    categoria: str | None = None,
    ativo: bool | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[dict], int]:
    # When Gold CSVs arrive: replace body with SQLAlchemy query on gold_produto_performance.
    items = MOCK_PRODUCTS
    if categoria:
        items = [p for p in items if p["categoria"] == categoria]
    if ativo is not None:
        items = [p for p in items if p["ativo"] == ativo]
    total = len(items)
    offset = (page - 1) * size
    return items[offset: offset + size], total


def get_by_id(id_produto: int) -> dict | None:
    return next((p for p in MOCK_PRODUCTS if p["id_produto"] == id_produto), None)


def create(data: dict) -> dict:
    # When Gold CSVs arrive: replace with db.add(Product(**data)); db.commit()
    global _next_id
    new_product = {
        **data,
        "id_produto": _next_id,
        "qtd_vendida_total": 0, "qtd_vendida_30d": 0, "qtd_vendida_90d": 0,
        "receita_total": 0.0, "receita_30d": 0.0,
        "qtd_tickets_associados": 0, "qtd_tickets_30d": 0, "taxa_problema": 0.0,
        "qtd_avaliacoes": 0, "nota_media": None, "pct_recomendam": None,
        "qtd_visualizacoes": 0, "qtd_carrinho": 0, "taxa_conversao": 0.0,
        "classificacao": "Estável", "data_referencia_calculo": date.today(),
    }
    MOCK_PRODUCTS.append(new_product)
    _next_id += 1
    return new_product


def update(id_produto: int, data: dict) -> dict | None:
    # When Gold CSVs arrive: replace with db.query(Product).filter_by(id_produto=id_produto).update(data)
    product = get_by_id(id_produto)
    if not product:
        return None
    product.update({k: v for k, v in data.items() if v is not None})
    return product


def delete(id_produto: int) -> bool:
    # When Gold CSVs arrive: replace with db.delete(product); db.commit()
    product = get_by_id(id_produto)
    if not product:
        return False
    MOCK_PRODUCTS.remove(product)
    return True
