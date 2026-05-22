# Validações e Evidências - V-Commerce CRM 360

Data de referência: `2026-05-22`.

## Volumetria de origem

| Arquivo | Tabela Bronze | Linhas |
|---|---|---:|
| `clientes.csv` | `bronze.tb_clientes` | 61.345 |
| `pedidos.csv` | `bronze.tb_pedidos` | 314.900 |
| `catalogo_produtos.csv` | `bronze.tb_produtos` | 517 |
| `suporte_tickets.csv` | `bronze.tb_tickets` | 34.697 |
| `clickstream.csv` | `bronze.tb_clickstream` | 500.000 |
| `avaliacoes.csv` | `bronze.tb_avaliacoes` | 156.832 |
| **Total** | | **1.068.291** |

## Gold, visão geral

| Tabela | Linhas | Colunas |
|---|---:|---:|
| `gold_pedidos_enriquecidos` | 284.758 | 16 |
| `gold_vendas_kpis` | 41 | 18 |
| `gold_produto_performance` | 517 | 25 |
| `gold_cliente_360` | 58.322 | 30 |
| `gold_tickets` | 31.878 | 17 |
| `gold_avaliacoes` | 131.789 | 13 |
| `gold_clickstream_resumo` | 348.106 | 14 |

Todas as PKs principais têm 0 duplicatas e 0 nulos.

## Pedidos e KPIs

| Métrica | Valor |
|---|---:|
| Pedidos válidos | 284.758 |
| Menor `data_pedido` | 2023-01-01 |
| Maior `data_pedido` | 2026-05-22 |
| Pedidos aprovados | 257.486 |
| Quantidade aprovada | 780.163 |
| Receita aprovada | R$ 413.529.301,44 |
| Meses em KPIs | 41 |
| Período dos KPIs | 2023-01 a 2026-05 |

| Status | Pedidos |
|---|---:|
| `Aprovado` | 257.486 |
| `Recusado` | 14.127 |
| `Reembolsado` | 9.539 |
| `Processando` | 3.606 |

Descarte da Bronze para a Gold: 30.142 pedidos com quantidade não positiva, valor não positivo ou data fora do recorte, armazenados em `silver.fat_pedidos_invalidos`.

Reconciliação:

| Check | Diferença |
|---|---:|
| Pedidos x KPIs | 0 |
| Aprovados x KPIs | 0 |
| Receita x KPIs | R$ 0,00 |
| Receita x Produto Performance | R$ 0,00 |
| Quantidade x Produto Performance | 0 |

## Produto Performance

| Métrica | Valor |
|---|---:|
| Produtos | 517 |
| Receita total | R$ 413.529.301,44 |
| Quantidade vendida total | 780.163 |
| Tickets associados | 31.878 |
| Avaliações | 131.789 |

| Classificação | Produtos |
|---|---:|
| `Estavel` | 405 |
| `Top Vendedor` | 80 |
| `Problematico` | 32 |

Nulos esperados:

| Coluna | Nulos | Motivo |
|---|---:|---|
| `preco_atual` | 68 | preço cadastral inválido ou ausente no raw. |
| `peso_kg` | 23 | peso não informado no raw. |
| `estoque_disponivel` | 23 | estoque não informado no raw. |
| `taxa_conversao` | 17 | produto sem nenhuma visualização registrada; divisão por zero vira nulo. |

Checks: receita, quantidade, tickets e avaliações fecham com diferença 0 em relação às outras Golds.

## Cliente 360

| Métrica | Valor |
|---|---:|
| Clientes | 58.322 |
| Pedidos totais | 284.758 |
| Receita aprovada | R$ 413.529.301,44 |
| Tickets | 31.878 |
| Avaliações | 131.789 |
| Eventos clickstream | 349.447 |

| Segmento | Clientes |
|---|---:|
| `Alto` | 27.585 |
| `Medio` | 16.488 |
| `Baixo` | 14.249 |

Nulos esperados:

| Coluna | Nulos | Motivo |
|---|---:|---|
| `email` | 577 | e-mail sem formato confiável no raw; irrecuperável após normalização. |
| `data_primeiro_pedido` | 8.186 | cliente cadastrado sem pedido válido. |
| `data_ultimo_pedido` | 8.186 | cliente cadastrado sem pedido válido. |
| `ticket_medio` | 8.331 | cliente sem nenhum pedido aprovado; média não computável. |
| `nota_media_dada` | 12.180 | cliente sem avaliação válida; média não computável. |
| `nps_medio_avaliacoes_cliente` | 12.180 | cliente sem NPS válido; média não computável. |
| `canal_preferido` | 10.163 | cliente sem nenhum evento de clickstream identificado. |

Reconciliações de pedidos, receita, tickets, avaliações e clickstream fecham com diferença 0.

## Tickets

| Métrica | Valor |
|---|---:|
| Tickets | 31.878 |
| Tickets sem pedido válido | 0 |
| Divergência em `tempo_resolucao_horas` | 0 |

| Status | Tickets |
|---|---:|
| `Resolvido` | 29.972 |
| `Aberto` | 1.906 |

| Tipo | Tickets |
|---|---:|
| `Entrega` | 9.865 |
| `Reembolso` | 8.078 |
| `Produto` | 7.562 |
| `Pagamento` | 6.132 |
| `Outros` | 241 |

Nulos esperados: 1.906 tickets abertos sem data de resolução, tempo de resolução e nota de avaliação.

Tickets com `data_abertura < data_pedido`: 15.452. Mantidos por regra de suporte operacional.

Descarte da Bronze para a Gold: 2.819 tickets cujo `id_pedido` referenciava pedidos inválidos armazenados em `silver.fat_pedidos_invalidos`.

## Avaliações

| Métrica | Valor |
|---|---:|
| Avaliações válidas | 131.789 |
| Avaliações sem pedido válido | 0 |
| Avaliações antes do pedido | 0 |
| Menor nota | 1 |
| Maior nota | 5 |
| Menor NPS | 0 |
| Maior NPS | 10 |

| Sentimento | Avaliações |
|---|---:|
| `positivo` | 84.342 |
| `neutro` | 25.807 |
| `negativo` | 21.640 |

Descarte da Bronze para a Gold: 25.043 avaliações descartadas por nota ou NPS nulo, pedido inválido ou `data_avaliacao < data_pedido`.

Avaliações fecham com Cliente 360 e Produto Performance com diferença 0 em quantidade e nota média.

## Clickstream

| Métrica | Valor |
|---|---:|
| Linhas cliente/dia | 348.106 |
| Soma de eventos | 349.447 |
| Linhas divergentes entre total e categorias | 0 |
| Linhas com `tempo_total_segundos = 0` | 31.186 |
| Menor data | 2023-01-01 |
| Maior data | 2026-03-28 |

| Tipo de evento | Total |
|---|---:|
| `qtd_page_view` | 168.288 |
| `qtd_search` | 52.300 |
| `qtd_click` | 76.457 |
| `qtd_add_to_cart` | 45.870 |
| `qtd_abandon_cart` | 2.739 |
| `qtd_purchase` | 3.793 |

`qtd_click` inclui `visualizacao_produto`, `login` e `pagamento`. `tempo_total_segundos = 0` ocorre em sessões onde nenhum evento registrou tempo de permanência.

## Integridade referencial

| Check | Resultado |
|---|---:|
| Pedidos com cliente fora de Cliente 360 | 0 |
| Pedidos com produto fora de Produto Performance | 0 |
| Avaliações com cliente fora de Cliente 360 | 0 |
| Avaliações com produto fora de Produto Performance | 0 |
| Tickets com cliente fora de Cliente 360 | 0 |
| Tickets com produto fora de Produto Performance | 0 |
| Clickstream com cliente fora de Cliente 360 | 0 |

## Datas de cadastro

| Check | Linhas |
|---|---:|
| Pedidos antes do cadastro do cliente | 12.214 |
| Pedidos antes do cadastro do produto | 59.047 |
| Avaliações antes do cadastro do cliente | 4.592 |
| Avaliações antes do cadastro do produto | 26.568 |
| Tickets antes do cadastro do cliente | 1.387 |
| Tickets antes do cadastro do produto | 3.740 |
| Clickstream antes do cadastro do cliente | 13.622 |

`data_cadastro` representa o registro no sistema, não uma fronteira temporal para exclusão de fatos. Fatos anteriores ao cadastro resultam de migrações de sistemas legados ou associações retroativas e são mantidos.