# Decisões - V-Commerce CRM 360

## Bronze

### CSVs lidos como string

Contexto: os arquivos têm datas em formatos diferentes, valores monetários, booleanos textuais e ruídos.

Decisão: a Bronze usa `inferSchema = false` e preserva tudo como string.

Impacto: os casts ficam explícitos na Silver e a origem permanece auditável.

### Nulos estruturais

Contexto: evento digital pode ser anônimo, ticket aberto não tem resolução e produto pode não ter estoque informado.

Decisão: nulo estrutural não invalida automaticamente a linha.

Impacto: registros válidos do domínio são preservados.

## Silver

### Número de telefone

Contexto: A coluna telefone da `silver.clintes` possui números fora do padrão.

Decisão: Padronização dos telefones com inclusão/manutenção do 55 e remoção de ramais.

Impacto: Telefones padronizados no sistema.

### IDS de clientes duplicados 

Contexto : A coluna de id de clientes possuia ids duplicados 

Decisão:  manter em `02_silver_tb_clientes` códigos únicos (sem cleintes duplicados)

Impacto: uma linha por cliente. Sem duplicidade 

### Pedidos inválidos em quarentena

Contexto: pedido inválido altera receita e KPIs.

Decisão: `silver.fat_pedidosC recebe somente válidos`  e `silver.fat_pedidos_invalidos` guarda a quarentena com `motivo_invalido`.

Impacto: a Gold consome pedidos confiáveis e os descartes permanecem auditáveis.

### Valor histórico do pedido

Contexto: pedidos trazem `valor_pedido`, não preço unitário original.

Decisão: `valor_pedido` vira `valor_total` e `valor_unitario` é derivado por divisão com a quantidade.

Impacto: receita não depende de preço atual do catálogo.

### Produtos preservados

Contexto: produto com cadastro incompleto ainda pode explicar venda histórica.

Decisão: manter todos os 517 SKUs na dimensão e na Gold.

Impacto: Produto Performance cobre catálogo completo.

### Preço nulo

Contexto: 68 produtos têm preço cadastral ausente ou com valor inválido no raw.

Decisão: preservar nulo sem imputação.

Impacto: o campo indica que o preço é desconhecido. Receita vem dos pedidos aprovados, não do preço atual.

### Peso e estoque nulos

Contexto: 23 produtos não têm peso informado e 23 não têm estoque informado no raw.

Decisão: preservar nulos sem imputação.

Impacto: o campo indica que o dado não foi cadastrado na origem.

### E-mails irrecuperáveis

Contexto: 577 clientes permaneceram sem e-mail após todas as tentativas de recuperação e normalização.

Decisão: e-mails sem formato confiável viram nulo.

Impacto: o cliente permanece no CRM e o consumo lida com ausência de e-mail.

### E-mails duplicados

Contexto: 1.617 registros compartilham e-mail com outro cliente.

Decisão: manter sem deduplicação, pois o e-mail pode ser compartilhado por conta familiar ou cadastro múltiplo legítimo.

Impacto: a chave única do cliente é `id_cliente`, não o e-mail. O CRM não deve usar e-mail como chave de busca exclusiva.

### Datas de avaliação em múltiplos formatos

Contexto: o raw de avaliações continha datas em formatos misturados, incluindo `yyyy/MM/dd`, `dd/MM/yyyy`, `dd-MM-yyyy` e variantes com mês e dia trocados.

Decisão: parsing em cadeia por `coalesce` cobrindo todos os formatos identificados.

Impacto: 0 datas inválidas ou fora do recorte na `gold_avaliacoes`.

### Tempo de resolução de tickets

Contexto: o campo bruto de duração não era confiável, com diferença média de 83 horas em relação às datas registradas.

Decisão: recalcular `tempo_resolucao_horas` como `(data_resolucao - data_abertura) / 3600`, arredondado em uma casa decimal. Tickets abertos recebem nulo.

Impacto: a execução final tem 0 divergências no cálculo de duração entre o campo e as datas.

### Deduplicação de avaliações

Contexto: o raw pode conter a mesma avaliação ingerida mais de uma vez em cargas distintas.

Decisão: remover duplicatas por `id_avaliacao` mantendo o registro com `timestamp_ingestion` mais recente.

Impacto: uma linha por avaliação na Silver, consistente com o padrão de deduplicação dos demais fatos.

### Nota do produto qualitativa

Contexto: o campo `nota_produto` chega como texto qualitativo em parte dos registros (`péssimo`, `ruim`, `regular`, `bom`, `ótimo`) e como número em outra parte.

Decisão: converter os valores textuais para escala numérica de 1 a 5 antes da validação de range. Valores fora de `[1, 5]` após a conversão são anulados.

Impacto: a escala é uniforme na Silver e os extremos inválidos não chegam às médias da Gold.

### Descarte de avaliações com notas inválidas

Contexto: avaliações com `nota_produto` ou `nota_nps` nulos após validação de range não carregam informação mensurável de satisfação.

Decisão: descartar linhas onde qualquer uma das duas notas seja nula após a etapa de validação.

Impacto: métricas de nota média e NPS na Gold partem de um conjunto homogêneo e auditável.

### Perfil NPS

Contexto: a `nota_nps` isolada não comunica a categoria de relacionamento do cliente.

Decisão: derivar `perfil_nps` a partir da `nota_nps` já validada — Promotor (≥ 9), Neutro (7–8), Detrator (0–6).

Impacto: a Gold pode segmentar avaliações por categoria NPS sem recalcular o range.

### Sentimento

Contexto: o contrato da `gold_avaliacoes` exige uma classificação qualitativa da experiência com o produto.

Decisão: derivar `sentimento` a partir de `nota_produto` já validada — positivo (4–5), neutro (3), negativo (1–2). Nota nula gera sentimento nulo.

Impacto: avaliações com nota inválida não recebem sentimento imputado.

### Recomenda

Contexto: o campo `recomenda` chega com múltiplas variações textuais (`sim`, `s`, `yes`, `y`, `1`, `nao`, `n`, `no`, `0`).

Decisão: converter para booleano. Variações não reconhecidas viram nulo.

Impacto: o campo é utilizável diretamente em filtros e agregações na Gold.

### Comentário ausente

Contexto: parte dos registros não possui comentário preenchido.

Decisão: substituir nulo por `"Sem comentario"` em vez de propagar nulo.

Impacto: o campo nunca é nulo na Silver, simplificando o consumo na Gold sem perda de informação.

### Deduplicação de eventos de clickstream

Contexto: o raw pode conter o mesmo evento ingerido mais de uma vez em cargas distintas.

Decisão: remover duplicatas por `id_evento` mantendo o registro com `timestamp_ingestion` mais recente.

Impacto: uma linha por evento na Silver, evitando inflação de contagens na Gold.

### Tempo de página não mensurável

Contexto: valores zero ou negativos em `tempo_pagina_seg` não representam tempo real de navegação.

Decisão: anular `tempo_pagina_seg` quando o valor for menor ou igual a zero.

Impacto: médias e somas de tempo na Gold não são distorcidas por valores sem significado operacional.

### Canonização de canal

Contexto: o campo `canal` chega com variações como `w`, `web`, `app`, `aplicativo`, `mobile_web`.

Decisão: normalizar para três valores canônicos — `web`, `app`, `mobile`. Valores não reconhecidos recebem `desconhecido`.

Impacto: `canal_preferido` no Cliente 360 e `canal_principal` no Clickstream Resumo partem de um domínio fechado.

### Canonização de dispositivo

Contexto: o campo `dispositivo` chega com variações como `mob`, `mobile`, `desktop`, `tab`.

Decisão: normalizar para três valores canônicos — `celular`, `computador`, `tablet`. Valores não reconhecidos recebem `desconhecido`.

Impacto: domínio fechado e consistente para análise de device na Gold.

### Canonização de tipo de evento

Contexto: o raw contém mais de 40 variações textuais para os tipos de evento.

Decisão: normalizar para oito valores canônicos alinhados com o contrato da Gold — `visualizacao_pagina`, `busca`, `visualizacao_produto`, `adicao_carrinho`, `login`, `pagamento`, `compra`, `abandono_carrinho`. Variações não mapeadas recebem `desconhecido`.

Impacto: as contagens por tipo de evento na Gold partem de um vocabulário estável e auditável.

### Canonização de origem da sessão

Contexto: o campo `origem_sessao` chega em inglês com valores como `organic`, `paid_search`, `direct`, `social`, `email`.

Decisão: traduzir para português — `organico`, `busca_paga`, `direto`, `social`, `email`. Valores não reconhecidos recebem `desconhecido`.

Impacto: consistência de idioma com os demais campos textuais do projeto.

## Gold

### Receita apenas de aprovados

Decisão: receita, quantidade vendida e métricas de venda usam somente pedidos com status `Aprovado`.

Impacto: receita aprovada fecha em R$ 413.529.301,44 com diferença zero entre `gold_pedidos_enriquecidos`, `gold_vendas_kpis` e `gold_produto_performance`.

### Avaliações com pedido válido e data coerente

Contexto: parte das avaliações referenciava pedidos descartados por quantidade ou valor não positivo, e parte tinha `data_avaliacao` anterior a `data_pedido`.

Decisão: a Gold promove apenas avaliações cujo `id_pedido` exista em `silver.fat_pedidos` e cuja `data_avaliacao >= data_pedido`.

Impacto: `gold_avaliacoes`, Cliente 360 e Produto Performance fecham em 131.789 avaliações com diferença zero entre si.

### Nome completo em avaliações

Decisão: `gold_avaliacoes.nome_cliente` usa `nome + sobrenome` da Silver.

Impacto: avaliação e Cliente 360 seguem o mesmo padrão de exibição.

### Tickets com pedido válido

Contexto: parte dos tickets referenciava pedidos descartados por invalidade transacional.

Decisão: tickets entram nas Golds somente quando possuem `id_pedido` válido em `silver.fat_pedidos`.

Impacto: `gold_tickets`, Cliente 360 e Produto Performance fecham em 31.878 tickets com diferença zero entre si.

### Cliente do ticket

Contexto: o `id_cliente` registrado no suporte pode diferir do `id_cliente` do pedido associado.

Decisão: `id_cliente` em `gold_tickets` recebe o cliente do pedido como referência oficial.

Impacto: o ticket aparece no perfil do cliente dono do pedido.

### Tickets antes do pedido

Contexto: 15.452 tickets têm `data_abertura < data_pedido`.

Decisão: manter esses tickets.

Impacto: suporte é tratado como evento operacional, com pré-atendimento ou associação retroativa legítimos.

### Tipo de problema Outros

Contexto: 241 tickets não se enquadram nos tipos canônicos.

Decisão: manter `Outros` como fallback.

Impacto: o registro é preservado sem forçar classificação indevida.

### Clickstream e qtd_click

Decisão: `qtd_click` agrega `visualizacao_produto`, `login` e `pagamento`.

Impacto: a soma das categorias fecha com `qtd_eventos`.

### taxa_conversao

Decisão: manter `qtd_vendida_total / qtd_visualizacoes`. Denominador zero vira nulo.

Impacto: 499 produtos têm valor maior que 1. A métrica é razão operacional, não percentual.

### Data de cadastro

Decisão: `data_cadastro` não é barreira de exclusão para fatos.

Impacto: fatos históricos, migrados ou associados por legado permanecem na Gold.

### Segmento LTV

Decisão: Alto a partir de R$ 5.000, Medio a partir de R$ 1.000 e Baixo abaixo de R$ 1.000, calculado sobre `valor_total_gasto`.

Impacto: segmentação determinística e estável entre execuções.

### is_em_risco

Decisão: `True` quando o cliente tem 3 ou mais tickets abertos simultaneamente na data de referência.

Impacto: com 1.906 tickets abertos distribuídos entre 58.322 clientes, a concentração de 3 ou mais por cliente é baixa e o flag reflete estado operacional correto.

### is_ativo_90d

Decisão: `True` quando o cliente tem ao menos um pedido aprovado nos 90 dias anteriores a `data_referencia_calculo`.

Impacto: clientes com ciclo de recompra longo, como os de eletrônicos, tendem a aparecer como inativos em janelas curtas sem que isso indique churn.
