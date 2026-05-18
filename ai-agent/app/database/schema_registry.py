from app.prompts.schema_prompt_intro import GOLD_SCHEMA_PROMPT_INTRO

GOLD_SCHEMA = {
    "gold_vendas_kpis": {
        "descricao": "Tabela agregada com KPIs de vendas mensais. Use para perguntas sobre desempenho mensal, faturamento total, pedidos e taxas por período.",
        "granularidade": "Uma linha por mês.",
        "chave_primaria": ["ano_mes"],
        "regras_ia": [
            "Use esta tabela para análises mensais e agregadas.",
            "Não use esta tabela para listar pedidos individuais.",
            "Não some ticket_medio diretamente.",
            "Para faturamento, use receita_bruta.",
            "Para calcular ticket médio em vários meses, use SUM(receita_bruta) / SUM(qtd_pedidos_aprovados).",
            "Para recalcular taxas em múltiplos meses, divida a soma do subconjunto pela soma do total. Ex: SUM(qtd_pedidos_aprovados) / SUM(qtd_pedidos) para calcular a taxa de aprovação agregada."
        ],
        "colunas": {
            "ano": {
                "descricao": "Ano de referência.",
                "tipo": "inteiro"
            },
            "mes": {
                "descricao": "Mês de referência.",
                "tipo": "inteiro"
            },
            "ano_mes": {
                "descricao": "Mês e ano de referência.",
                "tipo": "texto",
                "exemplo": "2024-11"
            },
            "qtd_pedidos": {
                "descricao": "Total de pedidos no mês.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_aprovados": {
                "descricao": "Pedidos aprovados no mês.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_recusados": {
                "descricao": "Pedidos recusados no mês.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_reembolsados": {
                "descricao": "Pedidos reembolsados no mês.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_processando": {
                "descricao": "Pedidos em processamento no mês.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "receita_bruta": {
                "descricao": "Soma do valor_total dos pedidos aprovados.",
                "tipo": "decimal",
                "agregacao": "SUM"
            },
            "ticket_medio": {
                "descricao": "Receita bruta dividida pela quantidade de pedidos aprovados.",
                "tipo": "decimal",
                "agregacao": "NAO_SOMAR"
            },
            "qtd_clientes_unicos": {
                "descricao": "Quantidade de clientes distintos que compraram no mês.",
                "tipo": "inteiro",
                "agregacao": "NAO_SOMAR_DIRETAMENTE"
            },
            "qtd_clientes_novos": {
                "descricao": "Clientes cujo primeiro pedido aconteceu neste mês.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "taxa_aprovacao": {
                "descricao": "Percentual de pedidos aprovados sobre o total.",
                "tipo": "decimal",
                "agregacao": "RECALCULAR"
            },
            "taxa_recusa": {
                "descricao": "Percentual de pedidos recusados sobre o total.",
                "tipo": "decimal",
                "agregacao": "RECALCULAR"
            },
            "taxa_reembolso": {
                "descricao": "Percentual de pedidos reembolsados sobre o total.",
                "tipo": "decimal",
                "agregacao": "RECALCULAR"
            },
            "categoria_mais_vendida": {
                "descricao": "Categoria mais vendida no mês.",
                "tipo": "texto"
            },
            "estado_maior_receita": {
                "descricao": "Estado com maior receita no mês.",
                "tipo": "texto"
            },
            "data_referencia_calculo": {
                "descricao": "Data da última atualização do cálculo.",
                "tipo": "data"
            }
        }
    },

    "gold_cliente_360": {
        "descricao": "Visão consolidada por cliente. Use para perguntas sobre perfil, histórico de compras, suporte, avaliações e comportamento de clientes.",
        "granularidade": "Uma linha por cliente.",
        "chave_primaria": ["id_cliente"],
        "regras_ia": [
            "Use esta tabela para perguntas sobre clientes individuais ou segmentos de clientes.",
            "Não use esta tabela para análises detalhadas de pedidos individuais.",
            "Para comportamento por dia, use gold_clickstream_resumo.",
            "Para avaliações individuais, use gold_avaliacoes.",
            "Nordeste, Norte, Sul, Sudeste e Centro-Oeste são nomes de região: expanda para estado IN ('Estado',...) conforme o mapeamento de regiões do Brasil; não rejeite a pergunta só por usar o nome da região nem peça esclarecimento de granularidade geográfica quando a região puder ser inferida."
        ],
        "colunas": {
            "id_cliente": {
                "descricao": "ID único do cliente.",
                "tipo": "inteiro"
            },
            "nome": {
                "descricao": "Nome completo do cliente.",
                "tipo": "texto"
            },
            "email": {
                "descricao": "E-mail do cliente.",
                "tipo": "texto"
            },
            "telefone": {
                "descricao": "Telefone do cliente.",
                "tipo": "texto"
            },
            "data_cadastro": {
                "descricao": "Data de cadastro do cliente.",
                "tipo": "data"
            },
            "cidade": {
                "descricao": "Cidade do cliente.",
                "tipo": "texto"
            },
            "estado": {
                "descricao": "Nome completo do estado do cliente (Pernambuco, São Paulo, etc.). Se o usuário disser Nordeste, Sudeste, Sul, Norte ou Centro-Oeste, filtre com IN nos estados daquela região (ex.: Nordeste = Alagoas, Bahia, Ceará, etc.).",
                "tipo": "texto"
            },
            "origem": {
                "descricao": "Canal de origem do cliente.",
                "tipo": "enum",
                "valores_validos": ["App", "Web", "Indicacao"]
            },
            "qtd_pedidos_total": {
                "descricao": "Quantidade total de pedidos do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_aprovados": {
                "descricao": "Quantidade de pedidos aprovados do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_recusados": {
                "descricao": "Quantidade de pedidos recusados do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_reembolsados": {
                "descricao": "Quantidade de pedidos reembolsados do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_pedidos_processando": {
                "descricao": "Quantidade de pedidos em processamento do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "valor_total_gasto": {
                "descricao": "Valor total gasto pelo cliente.",
                "tipo": "decimal",
                "agregacao": "SUM"
            },
            "ticket_medio": {
                "descricao": "Gasto médio por pedido do cliente.",
                "tipo": "decimal",
                "agregacao": "NAO_SOMAR"
            },
            "data_primeiro_pedido": {
                "descricao": "Data do primeiro pedido do cliente.",
                "tipo": "data"
            },
            "data_ultimo_pedido": {
                "descricao": "Data do último pedido do cliente.",
                "tipo": "data"
            },
            "qtd_tickets_total": {
                "descricao": "Total de tickets de suporte do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_tickets_abertos": {
                "descricao": "Tickets de suporte ainda abertos.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_tickets_resolvidos": {
                "descricao": "Tickets de suporte resolvidos.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_avaliacoes": {
                "descricao": "Quantidade de avaliações feitas pelo cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "nota_media_dada": {
                "descricao": "Média das notas de produto dadas pelo cliente.",
                "tipo": "decimal",
                "agregacao": "AVG"
            },
            "nps_medio_avaliacoes_cliente": {
                "descricao": "Média das notas NPS dadas pelo cliente.",
                "tipo": "decimal",
                "agregacao": "AVG"
            },
            "qtd_eventos_clickstream": {
                "descricao": "Quantidade total de eventos digitais do cliente.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "canal_preferido": {
                "descricao": "Canal mais utilizado pelo cliente.",
                "tipo": "enum",
                "valores_validos": ["Web", "Mobile", "App"]
            },
            "segmento_ltv": {
                "descricao": "Classificação do cliente por valor.",
                "tipo": "enum",
                "valores_validos": ["Alto", "Medio", "Baixo"]
            },
            "is_ativo_90d": {
                "descricao": "Indica se o cliente comprou nos últimos 90 dias.",
                "tipo": "booleano"
            },
            "is_em_risco": {
                "descricao": "Indica se o cliente está em risco, considerando 3 ou mais tickets abertos.",
                "tipo": "booleano"
            },
            "data_referencia_calculo": {
                "descricao": "Data da última atualização do cálculo.",
                "tipo": "data"
            }
        }
    },

    "gold_produto_performance": {
        "descricao": "Tabela de desempenho por produto. Use para perguntas sobre vendas, receita, avaliações, problemas e conversão de produtos.",
        "granularidade": "Uma linha por produto.",
        "chave_primaria": ["id_produto"],
        "regras_ia": [
            "Use esta tabela para análises agregadas por produto.",
            "Não use esta tabela para listar pedidos individuais.",
            "Para detalhes de pedidos de um produto, use gold_pedidos_enriquecidos.",
            "Não some taxa_conversao diretamente.",
            "Não some taxa_problema diretamente.",
            "Para 'último mês' ou 'últimos 30 dias', use colunas *_30d (qtd_vendida_30d, receita_30d, qtd_tickets_30d).",
            "Para 'últimos 90 dias', use colunas *_90d.",
            "Use colunas *_total apenas para histórico/total, sem filtro de data nesta tabela."
        ],
        "colunas": {
            "id_produto": {
                "descricao": "ID único do produto.",
                "tipo": "inteiro"
            },
            "nome_produto": {
                "descricao": "Nome do produto.",
                "tipo": "texto"
            },
            "categoria": {
                "descricao": "Categoria do produto.",
                "tipo": "texto"
            },
            "preco_atual": {
                "descricao": "Preço atual do produto.",
                "tipo": "decimal"
            },
            "ativo": {
                "descricao": "Indica se o produto está ativo para venda.",
                "tipo": "booleano"
            },
            "qtd_vendida_total": {
                "descricao": "Quantidade total vendida do produto.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_vendida_30d": {
                "descricao": "Quantidade vendida nos últimos 30 dias.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_vendida_90d": {
                "descricao": "Quantidade vendida nos últimos 90 dias.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "receita_total": {
                "descricao": "Receita total gerada pelo produto.",
                "tipo": "decimal",
                "agregacao": "SUM"
            },
            "receita_30d": {
                "descricao": "Receita gerada nos últimos 30 dias.",
                "tipo": "decimal",
                "agregacao": "SUM"
            },
            "qtd_tickets_associados": {
                "descricao": "Quantidade de tickets relacionados ao produto.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_tickets_30d": {
                "descricao": "Quantidade de tickets nos últimos 30 dias.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "taxa_problema": {
                "descricao": "Relação entre tickets e quantidade vendida.",
                "tipo": "decimal",
                "agregacao": "NAO_SOMAR"
            },
            "qtd_avaliacoes": {
                "descricao": "Quantidade de avaliações do produto.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "nota_media": {
                "descricao": "Nota média do produto.",
                "tipo": "decimal",
                "agregacao": "AVG"
            },
            "pct_recomendam": {
                "descricao": "Percentual de clientes que recomendam o produto.",
                "tipo": "decimal",
                "agregacao": "NAO_SOMAR"
            },
            "qtd_visualizacoes": {
                "descricao": "Quantidade de visualizações do produto.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_carrinho": {
                "descricao": "Quantidade de vezes que o produto foi adicionado ao carrinho.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "taxa_conversao": {
                "descricao": "Vendas divididas por visualizações.",
                "tipo": "decimal",
                "agregacao": "NAO_SOMAR"
            },
            "classificacao": {
                "descricao": "Classificação comercial do produto.",
                "tipo": "enum",
                "valores_validos": ["Top Vendedor", "Estável", "Problemático", "Encalhado"]
            },
            "data_referencia_calculo": {
                "descricao": "Data da última atualização do cálculo.",
                "tipo": "data"
            }
        }
    },

    "gold_pedidos_enriquecidos": {
        "descricao": "Tabela detalhada de pedidos com dados de cliente e produto já integrados. Use para análises granulares por pedido.",
        "granularidade": "Uma linha por pedido.",
        "chave_primaria": ["id_pedido"],
        "chaves_estrangeiras": {
            "id_cliente": "gold_cliente_360.id_cliente",
            "id_produto": "gold_produto_performance.id_produto"
        },
        "regras_ia": [
            "Use esta tabela para consultas detalhadas de pedidos.",
            "Use esta tabela quando a pergunta envolver status, método de pagamento, cliente, produto ou categoria por pedido.",
            "Para KPIs mensais prontos, prefira gold_vendas_kpis.",
            "Para receita, considere apenas status = 'Aprovado', salvo se o usuário pedir outro status.",
            "Filtros por região (Nordeste, Sudeste, etc.): use estado_cliente IN (lista de estados da região por extenso), nunca compare estado_cliente à palavra 'Nordeste'. Se a pergunta pedir 'região', trate como macro-região derivada de estado_cliente por CASE e agregue a receita ou contagem antes de ordenar. No CASE de macro-região, use ELSE NULL para valores que não são estados válidos e filtre regiao IS NOT NULL antes de ranquear; não use 'Indefinida' como região analítica."
        ],
        "colunas": {
            "id_pedido": {
                "descricao": "ID único do pedido.",
                "tipo": "inteiro"
            },
            "id_cliente": {
                "descricao": "ID do cliente relacionado ao pedido.",
                "tipo": "inteiro"
            },
            "id_produto": {
                "descricao": "ID do produto relacionado ao pedido.",
                "tipo": "inteiro"
            },
            "data_pedido": {
                "descricao": "Data do pedido.",
                "tipo": "data"
            },
            "quantidade": {
                "descricao": "Quantidade de unidades compradas.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "valor_unitario": {
                "descricao": "Valor unitário do produto no pedido.",
                "tipo": "decimal"
            },
            "valor_total": {
                "descricao": "Valor total do pedido, calculado como valor_unitario vezes quantidade.",
                "tipo": "decimal",
                "agregacao": "SUM"
            },
            "status": {
                "descricao": "Status do pedido.",
                "tipo": "enum",
                "valores_validos": ["Aprovado", "Recusado", "Reembolsado", "Processando"]
            },
            "metodo_pagamento": {
                "descricao": "Método de pagamento usado no pedido.",
                "tipo": "enum",
                "valores_validos": ["PIX", "Cartao", "Boleto"]
            },
            "nome_cliente": {
                "descricao": "Nome do cliente, campo denormalizado.",
                "tipo": "texto"
            },
            "estado_cliente": {
                "descricao": "UF do cliente no pedido nome completo (Pernambuco, São Paulo, etc) . Macro-regiões (Nordeste, etc.) devem ser expandidas para IN com lista de nome de estados, não usadas como valor literal.",
                "tipo": "texto"
            },
            "nome_produto": {
                "descricao": "Nome do produto, campo denormalizado.",
                "tipo": "texto"
            },
            "categoria_produto": {
                "descricao": "Categoria do produto.",
                "tipo": "texto"
            },
            "ano": {
                "descricao": "Ano do pedido.",
                "tipo": "inteiro"
            },
            "mes": {
                "descricao": "Mês do pedido.",
                "tipo": "inteiro"
            },
            "trimestre": {
                "descricao": "Trimestre do pedido.",
                "tipo": "inteiro"
            }
        }
    },

    "gold_tickets": {
        "descricao": "Tabela de chamados de suporte. Use para perguntas sobre problemas, SLA, tempo de resolução e qualidade do atendimento.",
        "granularidade": "Uma linha por ticket.",
        "chave_primaria": ["id_ticket"],
        "chaves_estrangeiras": {
            "id_cliente": "gold_cliente_360.id_cliente",
            "id_produto": "gold_produto_performance.id_produto",
            "id_pedido": "gold_pedidos_enriquecidos.id_pedido"
        },
        "regras_ia": [
            "Use esta tabela para análise de suporte e problemas.",
            "Para tickets em aberto, filtre status_ticket = 'Aberto'.",
            "Para SLA estourado, filtre sla_estourado = true.",
            "data_resolucao pode ser nula quando o ticket estiver aberto."
        ],
        "colunas": {
            "id_ticket": {
                "descricao": "ID único do ticket.",
                "tipo": "inteiro"
            },
            "id_cliente": {
                "descricao": "ID do cliente relacionado ao ticket.",
                "tipo": "inteiro"
            },
            "id_pedido": {
                "descricao": "ID do pedido relacionado ao ticket.",
                "tipo": "inteiro"
            },
            "id_produto": {
                "descricao": "ID do produto relacionado ao ticket.",
                "tipo": "inteiro"
            },
            "tipo_problema": {
                "descricao": "Tipo de problema reportado.",
                "tipo": "enum",
                "valores_validos": ["Entrega", "Reembolso", "Produto", "Pagamento"]
            },
            "satisfacao_atendimento": {
                "descricao": "Satisfação do cliente com o atendimento.",
                "tipo": "enum",
                "valores_validos": ["alta", "media", "baixa", "sem_avaliacao"]
            },
            "data_abertura": {
                "descricao": "Data de abertura do ticket.",
                "tipo": "data"
            },
            "data_resolucao": {
                "descricao": "Data de resolução do ticket. Pode ser nula se estiver aberto.",
                "tipo": "data"
            },
            "tempo_resolucao_horas": {
                "descricao": "Tempo de resolução em horas.",
                "tipo": "decimal",
                "agregacao": "AVG"
            },
            "agente_suporte": {
                "descricao": "Agente responsável pelo suporte.",
                "tipo": "texto"
            },
            "nota_avaliacao": {
                "descricao": "Nota de avaliação do atendimento, de 1 a 5.",
                "tipo": "inteiro",
                "agregacao": "AVG"
            },
            "status_ticket": {
                "descricao": "Status do ticket.",
                "tipo": "enum",
                "valores_validos": ["Aberto", "Resolvido"]
            },
            "sla_estourado": {
                "descricao": "Indica se o ticket passou de 48 horas aberto.",
                "tipo": "booleano"
            },
            "nome_cliente": {
                "descricao": "Nome do cliente, campo denormalizado.",
                "tipo": "texto"
            },
            "nome_produto": {
                "descricao": "Nome do produto, campo denormalizado.",
                "tipo": "texto"
            },
            "data_referencia_calculo": {
                "descricao": "Data da última atualização do cálculo.",
                "tipo": "data"
            }
        }
    },

    "gold_avaliacoes": {
        "descricao": "Tabela de avaliações e feedbacks dos clientes. Use para perguntas sobre notas, NPS, recomendação, comentários e sentimento.",
        "granularidade": "Uma linha por avaliação.",
        "chave_primaria": ["id_avaliacao"],
        "chaves_estrangeiras": {
            "id_cliente": "gold_cliente_360.id_cliente",
            "id_produto": "gold_produto_performance.id_produto",
            "id_pedido": "gold_pedidos_enriquecidos.id_pedido"
        },
        "regras_ia": [
            "Use esta tabela para análises de feedback individual.",
            "Para média de nota de produto, use AVG(nota_produto).",
            "Para média de NPS, use AVG(nota_nps).",
            "Não invente sentimento além dos valores válidos."
        ],
        "colunas": {
            "id_avaliacao": {
                "descricao": "ID único da avaliação.",
                "tipo": "inteiro"
            },
            "id_cliente": {
                "descricao": "ID do cliente que avaliou.",
                "tipo": "inteiro"
            },
            "id_pedido": {
                "descricao": "ID do pedido relacionado à avaliação.",
                "tipo": "inteiro"
            },
            "id_produto": {
                "descricao": "ID do produto avaliado.",
                "tipo": "inteiro"
            },
            "nota_produto": {
                "descricao": "Nota do produto, de 1 a 5.",
                "tipo": "inteiro",
                "agregacao": "AVG"
            },
            "nota_nps": {
                "descricao": "Nota NPS, de 0 a 10.",
                "tipo": "inteiro",
                "agregacao": "AVG"
            },
            "recomenda": {
                "descricao": "Indica se o cliente recomenda o produto.",
                "tipo": "booleano"
            },
            "comentario": {
                "descricao": "Comentário textual do cliente.",
                "tipo": "texto"
            },
            "sentimento": {
                "descricao": "Sentimento calculado para o comentário.",
                "tipo": "enum",
                "valores_validos": ["positivo", "neutro", "negativo"]
            },
            "data_avaliacao": {
                "descricao": "Data da avaliação.",
                "tipo": "data"
            },
            "nome_produto": {
                "descricao": "Nome do produto, campo denormalizado.",
                "tipo": "texto"
            },
            "categoria_produto": {
                "descricao": "Categoria do produto, campo denormalizado.",
                "tipo": "texto"
            },
            "nome_cliente": {
                "descricao": "Nome do cliente, campo denormalizado.",
                "tipo": "texto"
            }
        }
    },

    "gold_clickstream_resumo": {
        "descricao": "Resumo diário do comportamento digital dos clientes. Use para perguntas sobre navegação, eventos, sessões, abandono de carrinho e canais digitais.",
        "granularidade": "Uma linha por cliente por dia.",
        "chave_primaria": ["id_cliente", "data"],
        "chaves_estrangeiras": {
            "id_cliente": "gold_cliente_360.id_cliente"
        },
        "regras_ia": [
            "Use esta tabela para comportamento digital diário.",
            "Para comportamento consolidado do cliente, use gold_cliente_360.",
            "Para abandono de carrinho, use qtd_abandon_cart.",
            "Para adição ao carrinho, use qtd_add_to_cart."
        ],
        "colunas": {
            "id_cliente": {
                "descricao": "ID do cliente.",
                "tipo": "inteiro"
            },
            "data": {
                "descricao": "Data da navegação.",
                "tipo": "data"
            },
            "qtd_eventos": {
                "descricao": "Quantidade total de eventos no dia.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_sessoes": {
                "descricao": "Quantidade de sessões no dia.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_page_view": {
                "descricao": "Quantidade de visualizações de página.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_click": {
                "descricao": "Quantidade de cliques.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_add_to_cart": {
                "descricao": "Quantidade de eventos de adicionar ao carrinho.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_abandon_cart": {
                "descricao": "Quantidade de abandonos de carrinho.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_purchase": {
                "descricao": "Quantidade de eventos de compra.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "qtd_search": {
                "descricao": "Quantidade de buscas realizadas.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "canal_principal": {
                "descricao": "Canal principal usado no dia.",
                "tipo": "enum",
                "valores_validos": ["Web", "Mobile", "App"]
            },
            "dispositivo_principal": {
                "descricao": "Dispositivo principal usado no dia.",
                "tipo": "enum",
                "valores_validos": ["Desktop", "Mobile", "Tablet"]
            },
            "tempo_total_segundos": {
                "descricao": "Tempo total de navegação em segundos.",
                "tipo": "inteiro",
                "agregacao": "SUM"
            },
            "data_referencia_calculo": {
                "descricao": "Data da última atualização do cálculo.",
                "tipo": "data"
            }
        }
    }
}


def get_schema_prompt():
    """Gera o System Prompt formatado para o Agente de IA."""

    prompt = GOLD_SCHEMA_PROMPT_INTRO

    for tabela, info in GOLD_SCHEMA.items():
        prompt += f"\nTabela: {tabela}\n"
        prompt += f"Descrição: {info['descricao']}\n"

        if "granularidade" in info:
            prompt += f"Granularidade: {info['granularidade']}\n"

        if "chave_primaria" in info:
            prompt += f"Chave primária: {', '.join(info['chave_primaria'])}\n"

        if "chaves_estrangeiras" in info:
            prompt += "Chaves estrangeiras:\n"
            for coluna, referencia in info["chaves_estrangeiras"].items():
                prompt += f"  - {coluna} referencia {referencia}\n"

        if "regras_ia" in info:
            prompt += "Regras específicas:\n"
            for regra in info["regras_ia"]:
                prompt += f"  - {regra}\n"

        prompt += "Colunas:\n"

        for coluna, dados in info["colunas"].items():
            prompt += f"  - {coluna}: {dados['descricao']}"

            if "tipo" in dados:
                prompt += f" Tipo: {dados['tipo']}."

            if "agregacao" in dados:
                prompt += f" Agregação recomendada: {dados['agregacao']}."

            if "valores_validos" in dados:
                valores = ", ".join(dados["valores_validos"])
                prompt += f" Valores válidos: {valores}."

            if "exemplo" in dados:
                prompt += f" Exemplo: {dados['exemplo']}."

            prompt += "\n"

    return prompt

# No final do arquivo schema_registry.py
DB_SCHEMA = GOLD_SCHEMA
