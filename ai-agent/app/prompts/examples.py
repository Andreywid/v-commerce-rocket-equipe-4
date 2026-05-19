"""Exemplos curtos que ajudam o LLM a seguir o schema Gold e valores válidos."""

# ============================================
# FEW-SHOT SQL EXAMPLES (camada Gold / schema_registry)
# ============================================

SQL_EXAMPLES = [
    """
    Pergunta:
    Produtos com muitas visualizações mas poucas vendas.

    SQL:
    SELECT
        id_produto,
        nome_produto,
        categoria,
        qtd_visualizacoes,
        qtd_vendida_total,
        taxa_conversao
    FROM gold_produto_performance
    WHERE qtd_visualizacoes > (
        SELECT AVG(qtd_visualizacoes)
        FROM gold_produto_performance
    )
      AND qtd_vendida_total < (
        SELECT AVG(qtd_vendida_total)
        FROM gold_produto_performance
    )
    ORDER BY qtd_visualizacoes DESC, qtd_vendida_total ASC, taxa_conversao ASC
    LIMIT 10;
    """,

  """
  Pergunta:
  Qual região teve maior crescimento de receita?

  SQL:
  WITH receita_mensal AS (
    SELECT
      CASE
        WHEN estado_cliente IN ('Alagoas','Bahia','Ceará','Maranhão','Paraíba','Pernambuco','Piauí','Rio Grande do Norte','Sergipe') THEN 'Nordeste'
        WHEN estado_cliente IN ('Acre','Amapá','Amazonas','Pará','Rondônia','Roraima','Tocantins') THEN 'Norte'
        WHEN estado_cliente IN ('Distrito Federal','Goiás','Mato Grosso','Mato Grosso do Sul') THEN 'Centro-Oeste'
        WHEN estado_cliente IN ('Espírito Santo','Minas Gerais','Rio de Janeiro','São Paulo') THEN 'Sudeste'
        WHEN estado_cliente IN ('Paraná','Rio Grande do Sul','Santa Catarina') THEN 'Sul'
        ELSE NULL
      END AS regiao,
      DATE_TRUNC('month', data_pedido)::date AS mes,
      SUM(valor_total) AS receita
    FROM gold_pedidos_enriquecidos
    WHERE status = 'Aprovado'
      AND data_pedido >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
      AND data_pedido < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY regiao, mes
  ),
  extremos AS (
    SELECT
      regiao,
      MIN(mes) AS primeiro_mes,
      MAX(mes) AS ultimo_mes
    FROM receita_mensal
    WHERE regiao IS NOT NULL
    GROUP BY regiao
  ),
  comparacao AS (
    SELECT
      e.regiao,
      r_inicial.receita AS receita_inicial,
      r_final.receita AS receita_final,
      r_final.receita - r_inicial.receita AS crescimento_receita
    FROM extremos e
    JOIN receita_mensal r_inicial
      ON r_inicial.regiao = e.regiao AND r_inicial.mes = e.primeiro_mes
    JOIN receita_mensal r_final
      ON r_final.regiao = e.regiao AND r_final.mes = e.ultimo_mes
  )
  SELECT regiao, receita_inicial, receita_final, crescimento_receita
  FROM comparacao
  ORDER BY crescimento_receita DESC
  LIMIT 1;
  """,

  """
  Pergunta:
  Qual região teve maior crescimento de receita?

  SQL:
  WITH receita_mensal AS (
    SELECT
      CASE
        WHEN estado_cliente IN ('Alagoas','Bahia','Ceará','Maranhão','Paraíba','Pernambuco','Piauí','Rio Grande do Norte','Sergipe') THEN 'Nordeste'
        WHEN estado_cliente IN ('Acre','Amapá','Amazonas','Pará','Rondônia','Roraima','Tocantins') THEN 'Norte'
        WHEN estado_cliente IN ('Distrito Federal','Goiás','Mato Grosso','Mato Grosso do Sul') THEN 'Centro-Oeste'
        WHEN estado_cliente IN ('Espírito Santo','Minas Gerais','Rio de Janeiro','São Paulo') THEN 'Sudeste'
        WHEN estado_cliente IN ('Paraná','Rio Grande do Sul','Santa Catarina') THEN 'Sul'
        ELSE NULL
      END AS regiao,
      strftime('%Y-%m', data_pedido) AS mes,
      SUM(valor_total) AS receita
    FROM gold_pedidos_enriquecidos
    WHERE status = 'Aprovado'
      AND data_pedido >= date('now', 'start of month', '-12 months')
      AND data_pedido < date('now', 'start of month')
    GROUP BY regiao, mes
  ),
  extremos AS (
    SELECT
      regiao,
      MIN(mes) AS primeiro_mes,
      MAX(mes) AS ultimo_mes
    FROM receita_mensal
    WHERE regiao IS NOT NULL
    GROUP BY regiao
  ),
  comparacao AS (
    SELECT
      e.regiao,
      r_inicial.receita AS receita_inicial,
      r_final.receita AS receita_final,
      r_final.receita - r_inicial.receita AS crescimento_receita
    FROM extremos e
    JOIN receita_mensal r_inicial
      ON r_inicial.regiao = e.regiao AND r_inicial.mes = e.primeiro_mes
    JOIN receita_mensal r_final
      ON r_final.regiao = e.regiao AND r_final.mes = e.ultimo_mes
  )
  SELECT regiao, receita_inicial, receita_final, crescimento_receita
  FROM comparacao
  ORDER BY crescimento_receita DESC
  LIMIT 1;
  """,

    """
    Pergunta:
    Qual região teve o maior crescimento de receita no último ano?

    SQL:
    WITH receita_mensal AS (
        SELECT
            CASE
          WHEN estado_cliente IN ('Alagoas','Bahia','Ceará','Maranhão','Paraíba','Pernambuco','Piauí','Rio Grande do Norte','Sergipe') THEN 'Nordeste'
          WHEN estado_cliente IN ('Acre','Amapá','Amazonas','Pará','Rondônia','Roraima','Tocantins') THEN 'Norte'
          WHEN estado_cliente IN ('Distrito Federal','Goiás','Mato Grosso','Mato Grosso do Sul') THEN 'Centro-Oeste'
          WHEN estado_cliente IN ('Espírito Santo','Minas Gerais','Rio de Janeiro','São Paulo') THEN 'Sudeste'
          WHEN estado_cliente IN ('Paraná','Rio Grande do Sul','Santa Catarina') THEN 'Sul'
                ELSE NULL
            END AS regiao,
            DATE_TRUNC('month', data_pedido)::date AS mes,
            SUM(valor_total) AS receita
        FROM gold_pedidos_enriquecidos
        WHERE status = 'Aprovado'
          AND data_pedido >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months'
          AND data_pedido < DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY regiao, mes
    ),
    extremos AS (
        SELECT
            regiao,
            MIN(mes) AS primeiro_mes,
            MAX(mes) AS ultimo_mes
        FROM receita_mensal
        WHERE regiao IS NOT NULL
        GROUP BY regiao
    ),
    comparacao AS (
        SELECT
            e.regiao,
            r_inicial.receita AS receita_inicial,
            r_final.receita AS receita_final,
            r_final.receita - r_inicial.receita AS crescimento_receita
        FROM extremos e
        JOIN receita_mensal r_inicial
          ON r_inicial.regiao = e.regiao AND r_inicial.mes = e.primeiro_mes
        JOIN receita_mensal r_final
          ON r_final.regiao = e.regiao AND r_final.mes = e.ultimo_mes
    )
    SELECT regiao, receita_inicial, receita_final, crescimento_receita
    FROM comparacao
    ORDER BY crescimento_receita DESC
    LIMIT 1;
    """,

    """
    Pergunta:
    Qual das regiões possui a maior quantidade de vendas dos últimos 30 dias?

    SQL:
    WITH vendas_por_regiao AS (
      SELECT
        CASE
          WHEN estado_cliente IN ('Alagoas','Bahia','Ceará','Maranhão','Paraíba','Pernambuco','Piauí','Rio Grande do Norte','Sergipe') THEN 'Nordeste'
          WHEN estado_cliente IN ('Acre','Amapá','Amazonas','Pará','Rondônia','Roraima','Tocantins') THEN 'Norte'
          WHEN estado_cliente IN ('Distrito Federal','Goiás','Mato Grosso','Mato Grosso do Sul') THEN 'Centro-Oeste'
          WHEN estado_cliente IN ('Espírito Santo','Minas Gerais','Rio de Janeiro','São Paulo') THEN 'Sudeste'
          WHEN estado_cliente IN ('Paraná','Rio Grande do Sul','Santa Catarina') THEN 'Sul'
          ELSE NULL
        END AS regiao,
        COUNT(*) AS qtd_vendas
      FROM gold_pedidos_enriquecidos
      WHERE status = 'Aprovado'
        AND data_pedido >= date('now', 'start of day', '-30 days')
      GROUP BY regiao
    )
    SELECT regiao, qtd_vendas
    FROM vendas_por_regiao
    WHERE regiao IS NOT NULL
    ORDER BY qtd_vendas DESC
    LIMIT 1;
    """,

    """
    Pergunta:
    Qual foi a receita bruta em abril de 2026?

    SQL:
    SELECT receita_bruta
    FROM gold_vendas_kpis
    WHERE ano_mes = '2026-04';
    """,

    # Antes o filtro era ILIKE '%gmail.com'.
    # Foi ajustado para ILIKE '%@gmail.com' para garantir domínio real de e-mail
    # e evitar falsos positivos como "cliente@naogmail.com".
    """
    Pergunta:
    Clientes cadastrados com e-mail do Gmail

    SQL:
    SELECT id_cliente, nome, email, cidade, estado
    FROM gold_cliente_360
    WHERE email ILIKE '%@gmail.com';
    """,

    """
    Pergunta:
    Produtos ativos com preço acima de 100 reais

    SQL:
    SELECT id_produto, nome_produto, categoria, preco_atual
    FROM gold_produto_performance
    WHERE ativo = TRUE AND preco_atual > 100;
    """,

    # NOVO:
    # Exemplo de ranking por janela de 30 dias em gold_produto_performance.
    """
    Pergunta:
    Quais foram os 5 produtos mais vendidos no último mês?

    SQL:
    SELECT nome_produto, qtd_vendida_30d
    FROM gold_produto_performance
    ORDER BY qtd_vendida_30d DESC
    LIMIT 5;
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

    # NOVO:
    # Exemplo para ensinar que taxa agregada deve ser recalculada com numerador/denominador.
    # Evita erros como SUM(taxa_aprovacao) ou AVG(taxa_aprovacao).
    """
    Pergunta:
    Qual foi a taxa de aprovação agregada no primeiro trimestre de 2026?

    SQL:
    SELECT 
        SUM(qtd_pedidos_aprovados) * 1.0 / NULLIF(SUM(qtd_pedidos), 0) AS taxa_aprovacao_agregada
    FROM gold_vendas_kpis
    WHERE ano_mes BETWEEN '2026-01' AND '2026-03';
    """,

    # NOVO:
    # Exemplo para taxa de recusa agregada.
    """
    Pergunta:
    Qual foi a taxa de recusa agregada entre janeiro e março de 2026?

    SQL:
    SELECT 
        SUM(qtd_pedidos_recusados) * 1.0 / NULLIF(SUM(qtd_pedidos), 0) AS taxa_recusa_agregada
    FROM gold_vendas_kpis
    WHERE ano_mes BETWEEN '2026-01' AND '2026-03';
    """,

    # NOVO:
    # Exemplo para taxa de reembolso agregada.
    """
    Pergunta:
    Qual foi a taxa de reembolso agregada em 2026?

    SQL:
    SELECT 
        SUM(qtd_pedidos_reembolsados) * 1.0 / NULLIF(SUM(qtd_pedidos), 0) AS taxa_reembolso_agregada
    FROM gold_vendas_kpis
    WHERE ano = 2026;
    """,

    # NOVO:
    # Exemplo de faturamento agregado usando receita_bruta na tabela mensal.
    """
    Pergunta:
    Qual foi o faturamento total de 2026?

    SQL:
    SELECT SUM(receita_bruta) AS faturamento_total
    FROM gold_vendas_kpis
    WHERE ano = 2026;
    """,

    # NOVO:
    # Exemplo de análise mensal usando ano_mes.
    """
    Pergunta:
    Quantos pedidos aprovados tivemos por mês em 2026?

    SQL:
    SELECT ano_mes, qtd_pedidos_aprovados
    FROM gold_vendas_kpis
    WHERE ano = 2026
    ORDER BY ano_mes;
    """,

    # NOVO:
    # Exemplo de filtro por status e estado usando sigla UF.
    """
    Pergunta:
    Liste os pedidos reembolsados do estado de PE

    SQL:
    SELECT id_pedido, data_pedido, nome_cliente, estado_cliente, nome_produto, valor_total
    FROM gold_pedidos_enriquecidos
    WHERE status = 'Reembolsado' AND estado_cliente = 'PE'
    ORDER BY data_pedido DESC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de receita detalhada por categoria.
    # Como usa gold_pedidos_enriquecidos para receita, filtra status = 'Aprovado'.
    """
    Pergunta:
    Qual categoria gerou mais receita em abril de 2026?

    SQL:
    SELECT categoria_produto, SUM(valor_total) AS receita_total
    FROM gold_pedidos_enriquecidos
    WHERE status = 'Aprovado'
      AND ano = 2026
      AND mes = 4
    GROUP BY categoria_produto
    ORDER BY receita_total DESC
    LIMIT 1;
    """,

    # NOVO:
    # Exemplo de segmentação de clientes por LTV e UF.
    """
    Pergunta:
    Quais são os clientes de alto valor em Pernambuco?

    SQL:
    SELECT id_cliente, nome, email, cidade, estado, valor_total_gasto, segmento_ltv
    FROM gold_cliente_360
    WHERE segmento_ltv = 'Alto' AND estado = 'PE'
    ORDER BY valor_total_gasto DESC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de uso de booleano.
    """
    Pergunta:
    Quais clientes estão em risco?

    SQL:
    SELECT id_cliente, nome, email, qtd_tickets_abertos, is_em_risco
    FROM gold_cliente_360
    WHERE is_em_risco = TRUE
    ORDER BY qtd_tickets_abertos DESC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de enum de classificação de produto.
    """
    Pergunta:
    Quais produtos são problemáticos?

    SQL:
    SELECT id_produto, nome_produto, categoria, taxa_problema, qtd_tickets_associados, classificacao
    FROM gold_produto_performance
    WHERE classificacao = 'Problemático'
    ORDER BY taxa_problema DESC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de ranking por taxa de conversão.
    """
    Pergunta:
    Quais produtos tiveram maior conversão?

    SQL:
    SELECT id_produto, nome_produto, categoria, taxa_conversao, qtd_visualizacoes, qtd_vendida_total
    FROM gold_produto_performance
    WHERE ativo = TRUE
    ORDER BY taxa_conversao DESC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de média usando AVG.
    """
    Pergunta:
    Qual a nota média dos produtos por categoria?

    SQL:
    SELECT categoria_produto, AVG(nota_produto) AS nota_media_categoria
    FROM gold_avaliacoes
    GROUP BY categoria_produto
    ORDER BY nota_media_categoria DESC;
    """,

    # NOVO:
    # Exemplo com intervalo fechado-aberto em data.
    """
    Pergunta:
    Qual o NPS médio dos produtos avaliados em 2026?

    SQL:
    SELECT AVG(nota_nps) AS nps_medio
    FROM gold_avaliacoes
    WHERE data_avaliacao >= DATE '2026-01-01'
      AND data_avaliacao < DATE '2027-01-01';
    """,

    # NOVO:
    # Exemplo de enum de sentimento.
    """
    Pergunta:
    Quais avaliações negativas foram feitas sobre produtos?

    SQL:
    SELECT id_avaliacao, data_avaliacao, nome_cliente, nome_produto, nota_produto, comentario, sentimento
    FROM gold_avaliacoes
    WHERE sentimento = 'negativo'
    ORDER BY data_avaliacao DESC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de SLA estourado usando booleano e status de ticket.
    """
    Pergunta:
    Quais tickets estão com SLA estourado?

    SQL:
    SELECT id_ticket, nome_cliente, nome_produto, tipo_problema, data_abertura, tempo_resolucao_horas
    FROM gold_tickets
    WHERE sla_estourado = TRUE
      AND status_ticket = 'Aberto'
    ORDER BY data_abertura ASC
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de tempo médio de resolução por tipo de problema.
    """
    Pergunta:
    Qual o tempo médio de resolução dos tickets resolvidos por tipo de problema?

    SQL:
    SELECT tipo_problema, AVG(tempo_resolucao_horas) AS tempo_medio_resolucao_horas
    FROM gold_tickets
    WHERE status_ticket = 'Resolvido'
    GROUP BY tipo_problema
    ORDER BY tempo_medio_resolucao_horas DESC;
    """,

    # NOVO:
    # Exemplo de comportamento digital por canal.
    """
    Pergunta:
    Quantos abandonos de carrinho tivemos por canal em abril de 2026?

    SQL:
    SELECT canal_principal, SUM(qtd_abandon_cart) AS total_abandonos
    FROM gold_clickstream_resumo
    WHERE data >= DATE '2026-04-01'
      AND data < DATE '2026-05-01'
    GROUP BY canal_principal
    ORDER BY total_abandonos DESC;
    """,

    # NOVO:
    # Exemplo com período relativo.
    """
    Pergunta:
    Qual cliente teve mais eventos digitais nos últimos 30 dias?

    SQL:
    SELECT id_cliente, SUM(qtd_eventos) AS total_eventos
    FROM gold_clickstream_resumo
    WHERE data >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY id_cliente
    ORDER BY total_eventos DESC
    LIMIT 1;
    """,

    # NOVO:
    # Exemplo de filtro booleano + enum de canal.
    """
    Pergunta:
    Quais clientes ativos nos últimos 90 dias compraram pelo App?

    SQL:
    SELECT id_cliente, nome, email, canal_preferido, is_ativo_90d
    FROM gold_cliente_360
    WHERE is_ativo_90d = TRUE
      AND canal_preferido = 'App'
    LIMIT 100;
    """,

    # NOVO:
    # Exemplo de agrupamento por método de pagamento.
    """
    Pergunta:
    Qual método de pagamento teve mais pedidos aprovados?

    SQL:
    SELECT metodo_pagamento, COUNT(*) AS qtd_pedidos_aprovados
    FROM gold_pedidos_enriquecidos
    WHERE status = 'Aprovado'
    GROUP BY metodo_pagamento
    ORDER BY qtd_pedidos_aprovados DESC;
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

    # NOVO:
    # Valores adicionados para cobrir enums do Schema Gold e reduzir alucinação.
    "Desktop",
    "Tablet",
    "Indicacao",
    "Alto",
    "Medio",
    "Baixo",
    "Top Vendedor",
    "Estável",
    "Problemático",
    "Encalhado",
    "Entrega",
    "Reembolso",
    "Produto",
    "Pagamento",
    "alta",
    "media",
    "baixa",
    "sem_avaliacao",
    "positivo",
    "neutro",
    "negativo",

    "Eletronicos",
    "Alimentos",
    "Moveis",
]