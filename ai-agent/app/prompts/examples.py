"""Exemplos curtos que ajudam o LLM a seguir o schema Gold e valores válidos."""

# ============================================
# FEW-SHOT SQL EXAMPLES (camada Gold / schema_registry)
# ============================================

SQL_EXAMPLES = [
    """
    Pergunta:
    Qual foi a receita bruta em abril de 2026?

    SQL:
    SELECT receita_bruta
    FROM gold_vendas_kpis
    WHERE ano_mes = '2026-04';
    """,

    """
    Pergunta:
    Clientes cadastrados com e-mail do Gmail

    SQL:
    SELECT id_cliente, nome, email, cidade, estado
    FROM gold_cliente_360
    WHERE email ILIKE '%gmail.com';
    """,

    """
    Pergunta:
    Produtos ativos com preço acima de 100 reais

    SQL:
    SELECT id_produto, nome_produto, categoria, preco_atual
    FROM gold_produto_performance
    WHERE ativo = TRUE AND preco_atual > 100;
    """,

    """
    Pergunta:
    Pedidos aprovados pagos com PIX

    SQL:
    SELECT id_pedido, data_pedido, nome_cliente, valor_total, nome_produto
    FROM gold_pedidos_enriquecidos
    WHERE status = 'Aprovado' AND metodo_pagamento = 'PIX'
    ORDER BY data_pedido DESC
    LIMIT 20;
    """,

    """
    Pergunta:
    Ticket médio agregado entre março e abril de 2026 (não média de médias)

    SQL:
    SELECT SUM(receita_bruta) / NULLIF(SUM(qtd_pedidos_aprovados), 0) AS ticket_medio_agregado
    FROM gold_vendas_kpis
    WHERE ano_mes IN ('2026-03', '2026-04');
    """,

    """
    Pergunta:
    Tickets de suporte ainda abertos

    SQL:
    SELECT id_ticket, nome_cliente, tipo_problema, data_abertura, sla_estourado
    FROM gold_tickets
    WHERE status_ticket = 'Aberto'
    ORDER BY data_abertura;
    """,
]

# ============================================
# VALUE EXAMPLES (enums / textos válidos no Gold)
# ============================================

VALUE_EXAMPLES = [
    "Aprovado",
    "Recusado",
    "Reembolsado",
    "Processando",
    "PIX",
    "Cartao",
    "Boleto",
    "Aberto",
    "Resolvido",
    "Web",
    "Mobile",
    "App",
    "Eletronicos",
    "Alimentos",
    "Moveis",
]
