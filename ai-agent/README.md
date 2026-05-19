# 🤖 Módulo de Inteligência Artificial (AI Agent) — V-Commerce CRM 360

Este diretório contém a implementação do Agente de IA Conversacional do projeto V-Commerce, com foco em **Text-to-SQL**.  
O objetivo do módulo é permitir que usuários façam perguntas em linguagem natural e recebam respostas baseadas em dados da **Camada Gold**.

---

## Documentação técnica centralizada

A documentação detalhada dos módulos foi movida para [`docs/README.md`](docs/README.md).

### Índice rápido

- [`docs/modules/agents.md`](docs/modules/agents.md)
- [`docs/modules/api.md`](docs/modules/api.md)
- [`docs/modules/cli.md`](docs/modules/cli.md)
- [`docs/modules/database.md`](docs/modules/database.md)
- [`docs/modules/memory.md`](docs/modules/memory.md)
- [`docs/modules/prompts.md`](docs/modules/prompts.md)
- [`docs/modules/security.md`](docs/modules/security.md)
- [`docs/architecture/module-organization.md`](docs/architecture/module-organization.md)
- [`docs/solutions/solucao-contexto-multi-turno.md`](docs/solutions/solucao-contexto-multi-turno.md)

---

## 1. Visão geral do módulo

O módulo de IA é responsável por transformar uma pergunta do usuário em uma consulta SQL segura, executar essa consulta e explicar o resultado de forma clara.

De forma geral, o fluxo funciona assim:

1. O usuário envia uma pergunta em linguagem natural.
2. O agente identifica a intenção da pergunta.
3. O schema Gold é usado como base de conhecimento.
4. O gerador SQL cria uma query compatível com PostgreSQL.
5. A query passa por validação e sanitização.
6. Em ambiente local, a query pode ser traduzida para SQLite.
7. A consulta é executada.
8. O resultado é explicado para o usuário.

---

## 2. Base de conhecimento e governança

### 2.1 `app/database/schema_registry.py`

O arquivo `schema_registry.py` funciona como a principal base de conhecimento do agente.

Em vez de documentar o banco de dados apenas em um arquivo externo, o mapeamento foi construído diretamente em código por meio do dicionário Python `GOLD_SCHEMA`.

Isso cria uma documentação viva, que pode ser lida pelo agente a cada interação e usada como contexto antes da geração da query SQL.

### 2.2 Objetivo do `GOLD_SCHEMA`

O `GOLD_SCHEMA` tem como objetivo:

1. informar quais tabelas existem;
2. explicar a finalidade de cada tabela;
3. indicar a granularidade dos dados;
4. listar colunas disponíveis;
5. informar tipos de dados;
6. definir valores válidos para campos categóricos;
7. orientar agregações corretas;
8. reduzir alucinações do modelo;
9. evitar consultas SQL inválidas ou logicamente incorretas.

---

## 3. Estrutura do `GOLD_SCHEMA`

### 3.1 Nível da tabela

No nível da tabela, o schema ajuda o agente a decidir **qual tabela usar** para responder à pergunta do usuário.

#### 3.1.1 `descricao`

Funciona como um roteador semântico.

Ela indica para qual tipo de pergunta aquela tabela deve ser usada.

Exemplo de uso:

- perguntas sobre desempenho mensal devem priorizar `gold_vendas_kpis`;
- perguntas sobre pedidos individuais devem usar `gold_pedidos_enriquecidos`;
- perguntas sobre comportamento digital diário devem usar `gold_clickstream_resumo`.

#### 3.1.2 `granularidade`

Define a escala de observação da tabela.

Exemplos:

- uma linha por mês;
- uma linha por cliente;
- uma linha por pedido;
- uma linha por cliente por dia.

Essa informação evita erros de agregação, como somar dados de tabelas que possuem granularidades diferentes.

#### 3.1.3 `chave_primaria`

Indica a coluna ou conjunto de colunas que identifica unicamente um registro.

Essa informação ajuda em operações como:

- contagem de registros únicos;
- identificação da entidade principal da tabela;
- prevenção de duplicidades.

#### 3.1.4 `chaves_estrangeiras`

Indicam os relacionamentos possíveis entre tabelas.

Essas chaves ajudam o agente a fazer `JOINs` apenas quando necessário e usando colunas corretas.

#### 3.1.5 `regras_ia`

Contém regras de negócio específicas para orientar o modelo.

Essas regras funcionam como guardrails, evitando erros como:

- somar médias diretamente;
- usar tabela detalhada quando existe tabela agregada;
- calcular faturamento com pedidos não aprovados;
- fazer joins desnecessários.

---

### 3.2 Nível das colunas

No nível das colunas, o schema ajuda o agente a montar corretamente as cláusulas `SELECT`, `WHERE`, `GROUP BY` e `ORDER BY`.

#### 3.2.1 `descricao`

Explica o significado de negócio da coluna.

Isso ajuda o agente a mapear termos usados pelo usuário para os campos corretos do banco.

#### 3.2.2 `tipo`

Informa o tipo de dado da coluna.

Exemplos:

- `texto`;
- `inteiro`;
- `decimal`;
- `booleano`;
- `data`;
- `enum`.

Essa informação ajuda o agente a gerar filtros e comparações com sintaxe correta.

#### 3.2.3 `agregacao`

Define como a coluna deve ou não deve ser agregada.

Exemplos:

- `SUM`: pode ser somada;
- `AVG`: pode ser usada em média;
- `NAO_SOMAR`: não deve ser somada diretamente;
- `RECALCULAR`: deve ser recalculada a partir de campos base.

Essa regra é importante para evitar erros matemáticos, como `SUM(ticket_medio)` ou `SUM(taxa_conversao)`.

#### 3.2.4 `valores_validos`

Lista os valores permitidos para campos do tipo `enum`.

Exemplos:

- status de pedido: `Aprovado`, `Recusado`, `Reembolsado`, `Processando`;
- método de pagamento: `PIX`, `Cartao`, `Boleto`;
- status de ticket: `Aberto`, `Resolvido`;
- canal: `Web`, `Mobile`, `App`.

Essa informação evita que o agente invente valores inexistentes.

---

## 4. Função de geração do prompt de schema

### 4.1 `get_schema_prompt()`

A função `get_schema_prompt()` transforma o dicionário `GOLD_SCHEMA` em um texto estruturado para ser enviado ao modelo de linguagem.

Ela é responsável por montar um contexto contendo:

1. regras gerais de geração SQL;
2. descrição das tabelas;
3. granularidade;
4. chaves primárias;
5. chaves estrangeiras;
6. regras específicas de cada tabela;
7. colunas disponíveis;
8. tipos de dados;
9. agregações recomendadas;
10. valores válidos.

### 4.2 Import sugerido

```python
from app.database.schema_registry import GOLD_SCHEMA, get_schema_prompt
```

O arquivo `schema_gold.py`, localizado na raiz do projeto, reexporta os mesmos símbolos para compatibilidade.

---

## 5. Módulo de agentes

### 5.1 SQL Generator (`sql_generator.py`)

O `sql_generator.py` é responsável por gerar a query SQL a partir da pergunta do usuário.

#### 5.1.1 Regras de negócio do Schema Gold

O prompt do gerador foi refinado para incluir diretrizes específicas do negócio.

Exemplos de regras:

- não somar `ticket_medio` diretamente;
- não somar taxas diretamente;
- usar `receita_bruta` para KPIs mensais;
- usar `valor_total` para análises detalhadas de pedidos;
- filtrar `status = 'Aprovado'` em consultas de faturamento baseadas em pedidos.

#### 5.1.2 Integração few-shot

O arquivo `examples.py` foi atualizado para incluir exemplos representativos da Camada Gold.

Esses exemplos ajudam o modelo a aprender por analogia como gerar SQL corretamente.

Exemplos de cenários cobertos:

- uso da coluna `ano_mes`;
- filtros por estado usando siglas, como `PE` e `SP`;
- cálculo correto de ticket médio agregado;
- cálculo correto de taxas agregadas;
- uso de enums válidos.

#### 5.1.3 Saída determinística

O `system_prompt.py` foi refinado para orientar o agente a agir como um compilador SQL determinístico.

Isso reduz a chance de:

- inventar tabelas;
- inventar colunas;
- gerar comandos diferentes de `SELECT`;
- retornar explicações junto da query;
- gerar SQL incompatível com PostgreSQL.

---

### 5.2 Result Explainer (`explainer.py`)

O `explainer.py` é responsável por transformar o resultado da consulta em uma resposta compreensível para o usuário.

#### 5.2.1 Migração para assíncrono

O método `explain` foi convertido para `async def`, utilizando `await self._agent.run(prompt)`.

Isso evita bloqueios no loop de eventos do Python.

#### 5.2.2 Segurança e privacidade

O system prompt do explicador recebeu instruções para evitar exposição de:

- chaves de API;
- detalhes de infraestrutura;
- informações internas do sistema;
- dados sensíveis não necessários à resposta.

#### 5.2.3 Tratamento de dados volumosos

Foi implementado truncamento inteligente de linhas para evitar estouro de contexto no LLM em consultas com muitos resultados.

---

### 5.3 Agent Orchestrator (`orchestrator.py`)

O `orchestrator.py` coordena o fluxo completo do agente.

#### 5.3.1 Sincronização de fluxo

A chamada do `sql_generator` foi ajustada para usar `await`.

Isso garante que as etapas ocorram de forma sequencial e assíncrona:

1. geração da query;
2. validação;
3. execução;
4. explicação do resultado.

#### 5.3.2 Tratamento de erros

Foi melhorada a captura de exceções em cada etapa do fluxo.

As mensagens de erro são retornadas de forma mais clara por meio do `OrchestratorResult`.

---

## 6. Módulo de banco de dados

### 6.1 Connection (`connection.py`)

O `connection.py` gerencia a conexão com o banco de dados.

#### 6.1.1 Gestão de sessão

A conexão foi estruturada para suportar dois contextos:

1. ambiente de desenvolvimento com SQLite Mock;
2. futuro ambiente de produção com PostgreSQL.

---

### 6.2 SQL Translator (`translator.py`)

O `translator.py` adapta a query gerada em PostgreSQL para SQLite quando o projeto estiver rodando em ambiente de mock local.

#### 6.2.1 Adaptador dialetal

Foi implementada a lógica de tradução de sintaxe PostgreSQL para SQLite.

Isso permite testar localmente queries próximas ao comportamento esperado em produção.

#### 6.2.2 Compatibilidade de funções

Foram mapeadas funções específicas de datas e strings para aproximar o comportamento do SQLite ao PostgreSQL.

---

### 6.3 Query Executor (`executor.py`)

O `executor.py` é responsável por executar as queries validadas.

#### 6.3.1 Execução assíncrona

A execução foi estruturada para não bloquear o serviço principal durante consultas pesadas.

#### 6.3.2 Sanitização

O executor foi integrado ao `sql_validator`, garantindo que apenas comandos `SELECT` sejam processados.

Isso aumenta a segurança do agente e reduz risco de operações indevidas no banco.

---

## 7. Melhorias específicas nos prompts

### 7.1 Objetivo das melhorias

As melhorias nos prompts têm como objetivo fazer o agente gerar SQL com mais segurança, respeitando o Schema Gold e evitando alucinações.

O foco principal está nos arquivos:

1. `system_prompt.py`;
2. `sql_prompt_builder.py`;
3. regras textuais usadas para orientar o agente.

---

### 7.2 Melhorias no `system_prompt.py`

O `system_prompt.py` define o comportamento principal do agente.

A melhoria proposta é deixar o agente mais determinístico, ou seja, fazer ele agir como um gerador de SQL controlado.

#### 7.2.1 Regras reforçadas

O prompt deve deixar claro que o agente precisa:

1. gerar apenas comandos `SELECT`;
2. nunca gerar `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE` ou `TRUNCATE`;
3. usar apenas tabelas e colunas presentes no schema;
4. nunca inventar relacionamentos;
5. usar SQL compatível com PostgreSQL;
6. usar aliases claros;
7. usar `LIMIT 100` em consultas amplas;
8. retornar apenas a query SQL final.

---

### 7.3 Ajuste no comportamento do agente

A frase:

> Pense passo a passo antes de gerar SQL

pode fazer o modelo devolver explicações junto com a query.

A orientação recomendada é:

> Faça a análise internamente antes de gerar SQL, mas retorne apenas o SQL final.

#### 7.3.1 Motivo da alteração

Essa mudança mantém a ideia de o agente raciocinar antes de responder, mas evita que ele mostre:

1. explicações;
2. markdown;
3. raciocínio textual;
4. texto desnecessário junto da query.

---

### 7.4 Regras de negócio no prompt

O prompt deve reforçar regras específicas do Schema Gold.

#### 7.4.1 Datas

O agente deve:

1. usar `ano_mes` quando a consulta for mensal e estiver usando `gold_vendas_kpis`;
2. usar colunas reais de data quando a consulta for detalhada;
3. preferir intervalos de data no formato fechado-aberto.

Exemplos de colunas reais de data:

- `data_pedido`;
- `data_abertura`;
- `data_avaliacao`;
- `data`.

#### 7.4.2 Faturamento

O agente deve:

1. usar `receita_bruta` em `gold_vendas_kpis` para KPIs mensais;
2. usar `valor_total` em `gold_pedidos_enriquecidos` para análises detalhadas;
3. filtrar `status = 'Aprovado'` quando usar pedidos para calcular faturamento, salvo se o usuário pedir outro status.

#### 7.4.3 Médias, taxas e percentuais

O agente não deve somar diretamente:

1. `ticket_medio`;
2. `taxa_aprovacao`;
3. `taxa_recusa`;
4. `taxa_reembolso`;
5. `taxa_conversao`;
6. `taxa_problema`;
7. `pct_recomendam`.

Quando a pergunta envolver múltiplos períodos, o agente deve recalcular a métrica usando campos base.

#### 7.4.4 Escolha correta da tabela

O agente deve seguir o seguinte direcionamento:

1. `gold_vendas_kpis`: KPIs mensais, faturamento mensal, taxas mensais e resumo de vendas;
2. `gold_pedidos_enriquecidos`: pedidos individuais, status, método de pagamento, cliente, produto ou categoria por pedido;
3. `gold_cliente_360`: perfil consolidado de cliente, segmento, risco e histórico agregado;
4. `gold_produto_performance`: desempenho agregado de produto;
5. `gold_tickets`: suporte, SLA, chamados e tempo de resolução;
6. `gold_avaliacoes`: notas, NPS, comentários e sentimento;
7. `gold_clickstream_resumo`: navegação, eventos, sessões e abandono de carrinho.

#### 7.4.5 Enums e valores válidos

O agente deve usar apenas valores válidos presentes no schema.

Exemplos:

1. status de pedido: `Aprovado`, `Recusado`, `Reembolsado`, `Processando`;
2. método de pagamento: `PIX`, `Cartao`, `Boleto`;
3. status de ticket: `Aberto`, `Resolvido`;
4. canais: `Web`, `Mobile`, `App`;
5. segmento LTV: `Alto`, `Medio`, `Baixo`;
6. sentimento: `positivo`, `neutro`, `negativo`.

#### 7.4.6 Joins

O agente deve:

1. usar `JOIN` apenas quando a informação não estiver disponível na própria tabela;
2. preferir campos denormalizados quando eles já existirem;
3. usar apenas relacionamentos descritos no schema.

Exemplos de campos denormalizados:

- `nome_cliente`;
- `nome_produto`;
- `categoria_produto`;
- `estado_cliente`.

---

### 7.5 Melhorias no `sql_prompt_builder.py`

O `sql_prompt_builder.py` monta o prompt final enviado ao modelo.

#### 7.5.1 Formato de saída

O prompt deve orientar o agente a retornar:

1. apenas a query SQL;
2. sem explicações;
3. sem markdown;
4. sem bloco ```sql;
5. sem comentários fora da query.

#### 7.5.2 Validação antes da resposta

Antes de gerar o SQL final, o agente deve validar internamente:

1. se as tabelas existem;
2. se as colunas existem;
3. se os joins fazem sentido;
4. se os valores de enum são válidos;
5. se a granularidade da tabela escolhida responde corretamente à pergunta;
6. se médias, taxas e percentuais não foram somados incorretamente;
7. se a query final é PostgreSQL válido.

---

## 8. Resultado esperado

Com as melhorias propostas, o agente tende a:

1. gerar SQL mais limpo;
2. reduzir alucinações;
3. respeitar melhor o Schema Gold;
4. escolher tabelas corretamente;
5. aplicar regras de negócio com mais precisão;
6. evitar joins desnecessários;
7. retornar apenas SQL pronto para execução;
8. manter um fluxo assíncrono mais robusto;
9. executar consultas com maior segurança;
10. explicar resultados sem expor detalhes sensíveis.