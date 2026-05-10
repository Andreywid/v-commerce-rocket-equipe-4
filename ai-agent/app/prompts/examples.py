# ============================================
# FEW-SHOT SQL EXAMPLES
# ============================================

SQL_EXAMPLES = [
    """
    Pergunta:
    Qual foi o total faturado ontem?

    SQL:
    SELECT SUM(valor) AS total_faturado
    FROM vendas
    WHERE data = CURRENT_DATE - INTERVAL '1 day';
    """,

    """
    Pergunta:
    Clientes cadastrados com gmail

    SQL:
    SELECT *
    FROM clientes
    WHERE email ILIKE '%gmail.com';
    """,

    """
    Pergunta:
    Produtos acima de 100 reais

    SQL:
    SELECT *
    FROM produtos
    WHERE preco > 100;
    """,
]

# ============================================
# VALUE EXAMPLES
# ============================================

VALUE_EXAMPLES = [
    "gmail.com",
    "hotmail.com",
    "Notebook",
    "Mouse Gamer",
]
