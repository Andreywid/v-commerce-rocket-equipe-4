# Contratos das Camadas - V-Commerce CRM 360

## Convenções gerais

| Item | Regra |
|---|---|
| Catálogo | `workspace` |
| Data de referência | `2026-05-22` |
| Bronze | Dados brutos preservados como string. |
| Silver | Tipagem, limpeza, padronização, validação e auditoria. |
| Gold | Tabelas finais de consumo. |
| Contador sem fato | `0` |
| Soma sem fato | `0` |
| Razão com denominador zero | `null` |
| Produto sem preço confiável | `preco_atual = null` |
| Estoque não informado | `estoque_disponivel = null` |
| Ticket aberto | resolução, tempo e nota nulos. |
| Cliente sem e-mail recuperável | `email = null` |

## Bronze

Todas as tabelas Bronze recebem `timestamp_ingestion` e `arquivo_origem`.

| Tabela | Fonte | Granularidade |
|---|---|---|
| `bronze.tb_clientes` | `clientes.csv` | uma linha por cliente bruto. |
| `bronze.tb_pedidos` | `pedidos.csv` | uma linha por pedido bruto. |
| `bronze.tb_produtos` | `catalogo_produtos.csv` | uma linha por produto bruto. |
| `bronze.tb_tickets` | `suporte_tickets.csv` | uma linha por ticket bruto. |
| `bronze.tb_clickstream` | `clickstream.csv` | uma linha por evento bruto. |
| `bronze.tb_avaliacoes` | `avaliacoes.csv` | uma linha por avaliação bruta. |

## Silver

### `silver.fat_pedidos`

Pedido válido. PK: `id_pedido`.

Colunas principais: `id_pedido`, `id_cliente`, `id_produto`, `data_pedido`, `quantidade`, `valor_unitario`, `valor_total`, `status`, `metodo_pagamento`, `timestamp_ingestion`, `arquivo_origem`.

Regras: data dentro do recorte, quantidade positiva, valor positivo, status canônico e método de pagamento canônico.

### `silver.fat_pedidos_invalidos`

Quarentena de pedidos. Mantém chaves, valores originais, valores tratados e `motivo_invalido`.

### `silver.dim_produtos`

Catálogo tratado. PK: `id_produto`.

Colunas principais: `id_produto`, `nome_produto`, `categoria`, `preco`, `ativo`, `fornecedor`, `peso_kg`, `estoque_disponivel`, `data_cadastro_produto`, `categoria_original`, `categoria_origem_tratamento`, `categoria_invalida`, `ativo_invalido`, `preco_invalido`.

Categoria usa determinístico, fuzzy e inferência por fornecedor. Produtos com preço inválido permanecem na dimensão com flag.

### `silver.tb_clientes`

Cliente tratado. PK: `id_cliente`.

Colunas principais: `id_cliente`, `nome`, `sobrenome`, `email`, `email_original`, `email_origem_tratamento`, `telefone`, `data_nascimento`, `data_cadastro`, `idade`, `origem`, `cidade`, `estado`, `estado_original`, `estado_origem_tratamento`, `pais`, `device_ids`.

`estado` fica por extenso. `nome` e `sobrenome` ficam separados.

### `silver.tb_tickets`

Ticket tratado. PK: `ticket_id`.

Colunas principais: `ticket_id`, `id_cliente`, `id_pedido`, `data_abertura`, `data_resolucao`, `tempo_resolucao_horas`, `tempo_resolucao_dias`, `nota_avaliacao`, `tipo_problema_padronizado`, `agente_suporte`.

`tempo_resolucao_horas` é calculado como `data_resolucao - data_abertura`. Tickets abertos mantêm resolução, tempo e nota nulos.

### `silver.tb_avaliacoes`

Avaliação tratada. PK: `id_avaliacao`.

Colunas principais: `id_avaliacao`, `id_pedido`, `id_cliente`, `id_produto`, `nota_produto`, `nota_nps`, `recomenda`, `comentario`, `perfil_nps`, `sentimento`, `data_avaliacao`.

Notas fora do range viram nulo na Silver. A Gold promove apenas avaliações completas e coerentes com o pedido.

### `silver.tb_clickstream`

Evento digital tratado. PK: `id_evento`.

Colunas principais: `id_evento`, `id_sessao`, `id_cliente`, `id_dispositivo`, `id_produto`, `tipo_evento`, `canal`, `dispositivo`, `origem_sessao`, `data_evento`, `tempo_pagina_seg`, `timestamp_silver`.

## Gold

### `gold.gold_pedidos_enriquecidos`

PK: `id_pedido`. Linhas: 284.758.

Colunas: `id_pedido`, `id_cliente`, `id_produto`, `data_pedido`, `quantidade`, `valor_unitario`, `valor_total`, `status`, `metodo_pagamento`, `nome_cliente`, `estado_cliente`, `nome_produto`, `categoria_produto`, `ano`, `mes`, `trimestre`.

### `gold.gold_vendas_kpis`

PK: `(ano, mes)`. Linhas: 41.

Colunas: `ano`, `mes`, `ano_mes`, `qtd_pedidos`, `qtd_pedidos_aprovados`, `qtd_pedidos_recusados`, `qtd_pedidos_reembolsados`, `qtd_pedidos_processando`, `receita_bruta`, `ticket_medio`, `qtd_clientes_unicos`, `qtd_clientes_novos`, `taxa_aprovacao`, `taxa_recusa`, `taxa_reembolso`, `categoria_mais_vendida`, `estado_maior_receita`, `data_referencia_calculo`.

`qtd_clientes_unicos` conta clientes com ao menos um pedido aprovado no mês. `qtd_clientes_novos` conta clientes cuja primeira compra aprovada ocorreu naquele mês.

### `gold.gold_produto_performance`

PK: `id_produto`. Linhas: 517.

Colunas: `id_produto`, `nome_produto`, `categoria`, `preco_atual`, `ativo`, `fornecedor`, `peso_kg`, `estoque_disponivel`, `data_cadastro_produto`, `qtd_vendida_total`, `qtd_vendida_30d`, `qtd_vendida_90d`, `receita_total`, `receita_30d`, `qtd_tickets_associados`, `qtd_tickets_30d`, `taxa_problema`, `qtd_avaliacoes`, `nota_media`, `pct_recomendam`, `qtd_visualizacoes`, `qtd_carrinho`, `taxa_conversao`, `classificacao`, `data_referencia_calculo`.

### `gold.gold_cliente_360`

PK: `id_cliente`. Linhas: 58.322.

Colunas: `id_cliente`, `nome`, `email`, `telefone`, `data_cadastro`, `cidade`, `estado`, `origem`, `maior_de_idade`, `qtd_pedidos_total`, `qtd_pedidos_aprovados`, `qtd_pedidos_recusados`, `qtd_pedidos_reembolsados`, `qtd_pedidos_processando`, `valor_total_gasto`, `data_primeiro_pedido`, `data_ultimo_pedido`, `ticket_medio`, `qtd_tickets_total`, `qtd_tickets_abertos`, `qtd_tickets_resolvidos`, `qtd_avaliacoes`, `nota_media_dada`, `nps_medio_avaliacoes_cliente`, `qtd_eventos_clickstream`, `canal_preferido`, `segmento_ltv`, `is_ativo_90d`, `is_em_risco`, `data_referencia_calculo`.

### `gold.gold_tickets`

PK: `id_ticket`. Linhas: 31.878.

Colunas: `id_produto`, `id_cliente`, `id_pedido`, `id_ticket`, `data_abertura`, `data_resolucao`, `tempo_resolucao_horas`, `agente_suporte`, `nota_avaliacao`, `satisfacao_atendimento`, `tipo_problema`, `status_ticket`, `sla_estourado`, `data_referencia_calculo`, `nome_cliente`, `maior_de_idade`, `nome_produto`.

`id_cliente` é o cliente do pedido associado ao ticket.

### `gold.gold_avaliacoes`

PK: `id_avaliacao`. Linhas: 131.789.

Colunas: `id_avaliacao`, `id_cliente`, `id_pedido`, `id_produto`, `nota_produto`, `nota_nps`, `recomenda`, `comentario`, `sentimento`, `data_avaliacao`, `nome_produto`, `categoria_produto`, `nome_cliente`.

### `gold.gold_clickstream_resumo`

PK composta: `(id_cliente, data)`. Linhas: 348.106.

Colunas: `id_cliente`, `data`, `qtd_eventos`, `qtd_sessoes`, `qtd_page_view`, `qtd_search`, `qtd_click`, `qtd_add_to_cart`, `qtd_abandon_cart`, `qtd_purchase`, `canal_principal`, `dispositivo_principal`, `tempo_total_segundos`, `data_referencia_calculo`.

## Domínios finais

| Domínio | Valores |
|---|---|
| Status de pedido | `Aprovado`, `Recusado`, `Reembolsado`, `Processando` |
| Método de pagamento | `PIX`, `Cartao`, `Boleto` |
| Categoria | `Eletronicos`, `Moveis`, `Esportes`, `Beleza`, `Brinquedos`, `Casa`, `Automotivo`, `Vestuario` |
| Classificação | `Top Vendedor`, `Problematico`, `Encalhado`, `Estavel` |
| Tipo de problema | `Entrega`, `Reembolso`, `Produto`, `Pagamento`, `Outros` |
| Satisfação | `alta`, `media`, `baixa`, `sem_avaliacao` |
| Sentimento | `positivo`, `neutro`, `negativo` |
| Origem do cliente | `web`, `app`, `indicacao` |
| Canal | `web`, `app`, `mobile` |
| Dispositivo | `celular`, `computador`, `tablet` |
| Segmento LTV | `Alto`, `Medio`, `Baixo` |
