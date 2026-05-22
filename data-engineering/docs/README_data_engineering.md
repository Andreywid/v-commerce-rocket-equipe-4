# Data Engineering - V-Commerce CRM 360

Este diretório contém a pipeline de dados do case V-Commerce CRM 360.

## Ordem da pipeline

```text
01_bronze_ingestion
02_silver_tb_clientes
02_silver_pedidos_produtos
02_silver_tickets
02_silver_avaliacoes_clickstream
03_gold_pedidos_produtos_kpi
gold_cliente_360
gold_tickets
03_gold_avaliacoes_clickstream_resumo
04_export_gold_csv
```

## Parâmetros da entrega

| Parâmetro | Valor | Uso |
|---|---|---|
| `catalogo` | `workspace` | Catálogo Unity Catalog. |
| `data_referencia_calculo` | `2026-05-22` | Corte de janelas, SLA e validações temporais. |

## Camadas

| Camada | Papel |
|---|---|
| Bronze | Ingestão dos CSVs originais como string, com rastreabilidade. |
| Silver | Tipagem, limpeza, padronização, validação, flags e quarentena. |
| Gold | Tabelas finais para CRM, backend, frontend, dashboard e agente de IA. |

## Golds finais

| Tabela Gold | Linhas | Colunas |
|---|---:|---:|
| `gold_pedidos_enriquecidos` | 284.758 | 16 |
| `gold_vendas_kpis` | 41 | 18 |
| `gold_produto_performance` | 517 | 25 |
| `gold_cliente_360` | 58.322 | 30 |
| `gold_tickets` | 31.878 | 17 |
| `gold_avaliacoes` | 131.789 | 13 |
| `gold_clickstream_resumo` | 348.106 | 14 |

## Regras principais

- Pedidos inválidos ficam em `silver.fat_pedidos_invalidos`; as Golds usam `silver.fat_pedidos`.
- Receita e quantidade vendida usam apenas pedidos com status `Aprovado`.
- Avaliações entram nas Golds com pedido válido, `data_avaliacao >= data_pedido`, nota válida, NPS válido e chaves preenchidas.
- `gold_avaliacoes`, `gold_cliente_360` e `gold_produto_performance` fecham em 131.789 avaliações.
- Tickets entram nas Golds quando possuem pedido válido. O cliente e o produto oficiais vêm do pedido.
- `gold_tickets`, `gold_cliente_360` e `gold_produto_performance` fecham em 31.878 tickets.
- Tickets com `data_abertura < data_pedido` são mantidos: suporte é evento operacional e pode ter associação retroativa.
- `qtd_click` agrega `visualizacao_produto`, `login` e `pagamento`.
- `taxa_conversao` é razão operacional e pode ser maior que 1.

## Exportação

Notebook: `04_export_gold_csv.py`.

Destino:

```text
/Volumes/{catalogo}/gold/exports
```

Arquivos gerados:

```text
gold_pedidos_enriquecidos.csv
gold_vendas_kpis.csv
gold_produto_performance.csv
gold_cliente_360.csv
gold_tickets.csv
gold_avaliacoes.csv
gold_clickstream_resumo.csv
```

## Documentos

| Arquivo | Conteúdo |
|---|---|
| `contratos.md` | Contratos de Bronze, Silver e Gold. |
| `decisoes.md` | Decisões de modelagem e regras de negócio. |
| `validacoes.md` | Evidências numéricas e checks da execução final. |
