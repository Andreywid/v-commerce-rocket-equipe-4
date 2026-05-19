# V-Commerce AI Agent: Arquitetura Atual

## 1. Objetivo do módulo

O módulo `ai-agent` implementa o núcleo conversacional NL2SQL do projeto V-Commerce. Ele recebe perguntas em linguagem natural, interpreta a intenção de negócio, gera SQL seguro, valida a consulta, executa quando permitido e devolve a resposta em linguagem natural com contexto operacional.

A arquitetura atual foi desenhada para funcionar em dois cenários principais:

- **API HTTP** para integração com o frontend e com outros clientes;
- **CLI local** para inspeção, depuração e execução manual.

O sistema combina quatro capacidades centrais:

1. **Text-to-SQL** com LLM;
2. **validação determinística** de SQL e de política de uso;
3. **memória conversacional curta** para follow-ups;
4. **resposta explicada** em português brasileiro.

---

## 2. Visão macro da arquitetura

A organização atual pode ser lida como uma arquitetura em camadas.

```text
Entrada
├── app/api        # HTTP/FastAPI
├── app/cli        # terminal e ferramentas locais
└── app/main.py    # bootstrap local

Aplicação
├── app/agents     # orquestração, geração SQL e explicação
├── app/prompts    # prompts, exemplos e recovery prompts
├── app/memory     # histórico curto e contexto conversacional

Infraestrutura
├── app/database   # conexão, executor, tradução e schema
├── app/security   # guardrails, policy e mascaramento

Contratos e mensagens
├── app/models     # Pydantic/dataclasses de entrada e saída
└── app/messages   # textos amigáveis de erro e rejeição
```

### Leitura arquitetural correta

- **`api` e `cli` são bordas**: não decidem regra de negócio, só iniciam o fluxo.
- **`agents` é a camada de aplicação**: concentra o caso de uso principal.
- **`database` e `security` são infraestrutura transversal**: servem à aplicação inteira.
- **`prompts` e `messages` são ativos textuais**: não devem conter regra de domínio executável.
- **`models` são contratos**: não devem esconder comportamento de infraestrutura.

---

## 3. Fluxo de execução atual

O fluxo principal, hoje, é o seguinte:

1. O usuário envia uma pergunta pela API ou CLI.
2. O sistema monta um `Deps` com conexão, permissões e contexto de execução.
3. A memória conversacional recupera os turnos anteriores relevantes.
4. O prompt é enriquecido com contexto histórico e, quando possível, com entidades concretas retornadas do SQL anterior.
5. O `AgentOrchestrator` valida a pergunta contra a política de segurança.
6. O `AgentTextToSQLClient` gera o SQL com apoio de schema, exemplos e prompts.
7. O `SQLValidator` valida o SQL de forma determinística.
8. O `QueryExecutor` executa a consulta, traduzindo dialeto quando necessário.
9. O `ResultExplainer` sintetiza o resultado em linguagem natural.
10. O resultado agregado retorna como `OrchestratorResult`.
11. A conversa é persistida no store em memória.

```text
Pergunta -> Memória -> Orquestrador -> SQL Generator -> Validador -> Executor -> Explainer -> Resposta
```

---

## 4. Mapa de responsabilidades por pasta

### 4.1 `app/agents`

Camada de aplicação do NL2SQL.

- `orchestrator.py`: coordena política, geração, validação, execução e explicação.
- `sql_generator.py`: monta o prompt SQL e chama o LLM com fallback de modelo.
- `explainer.py`: transforma o resultado tabular em texto explicativo.
- `model_config.py`: resolve a cadeia de modelos e o fallback entre providers.

### 4.2 `app/api`

Camada HTTP.

- `app.py`: factory FastAPI.
- `routes.py`: endpoints `/health` e `/ask`.
- `dependencies.py`: converte request HTTP em `Deps` e instancia componentes compartilhados.

### 4.3 `app/cli`

Camada de operação local.

- `args.py`: parser de argumentos e roteamento de comandos.
- `runner.py`: executa modos `ask`, `chat`, `api` e inspeção.
- `context.py`: contexto de execução local e permissões.
- `inspect.py`: leitura de schema e prompt dry-run.
- `mock.py`: setup do banco SQLite mock.
- `render.py`: formatação de saída no terminal.

### 4.4 `app/database`

Camada de persistência, execução e compatibilidade de dialeto.

- `connection.py`: factory de conexão com SQLite ou PostgreSQL.
- `executor.py`: execução de SQL e mascaramento de PII.
- `translator.py`: tradução PostgreSQL → SQLite quando aplicável.
- `schema_registry.py`: schema Gold e regras de uso.
- `mock_gold.py`: seed do SQLite de testes.
- `data/`: CSVs e artefatos de carga.

### 4.5 `app/memory`

Memória conversacional curta.

- `conversation_store.py`: armazena turnos por conversa com TTL e limite de histórico.
- `context_extractor.py`: executa SQL anterior e extrai entidades/filtros úteis.

### 4.6 `app/prompts`

Engenharia de prompt.

- `system_prompt.py`: comportamento base do agente de SQL.
- `sql_prompt_builder.py`: compõe schema, exemplos e pergunta.
- `conversational_memory_prompt.py`: regras de follow-up e contexto conversacional.
- `explainer_prompt_builder.py`: prompt para explicação do resultado.
- `explainer_prompts.py`: system prompt do explicador.
- `orchestrator_prompts.py`: prompts de recuperação após erro.
- `examples.py`: exemplos few-shot.
- `schema_prompt_intro.py`: introdução textual do schema.
- `sql_user_prompt.py`: template de prompt do usuário.

### 4.7 `app/security`

Segurança de entrada e saída.

- `guardrails.py`: política da pergunta e bloqueios de uso indevido.
- `sql_validator.py`: validação sintática e estrutural do SQL.
- `pii_mask.py`: mascaramento de dados sensíveis.
- `policies.py`: constantes, limites e listas permitidas.
- `exceptions.py`: exceções específicas.

### 4.8 `app/models`

Contratos internos e públicos.

- `api.py`: request/response da API.
- `deps.py`: dependências compartilhadas entre camadas.
- `responses.py`: modelos de saída do fluxo de agentes.
- `conversation.py`: chave e turno de conversa.
- `metadata.py`: metadados genéricos, com utilidade limitada hoje.

### 4.9 `app/messages`

Textos amigáveis de rejeição e erro.

- `rejection_copy.py`: mensagens explicativas para política, validação, execução e rejeição de request.

---

## 5. Contratos e tipos centrais

### 5.1 `Deps`

`Deps` é o objeto de contexto e autorização que atravessa o fluxo.

Ele carrega:

- conexão com o banco;
- `conversation_id`;
- `user_id` e `tenant_id`;
- roles;
- tabelas permitidas;
- colunas permitidas;
- flags de acesso total ao schema e PII;
- exigência de tenant.

Esse objeto é a principal ponte entre HTTP/CLI e a aplicação.

### 5.2 `AskRequest` e `AskResponse`

`AskRequest` é o contrato de entrada da API.

`AskResponse` é a resposta pública com:

- `conversation_id`;
- explicação final;
- SQL gerado;
- linhas retornadas;
- interpretação;
- raciocínio;
- premissas;
- erro e categoria de erro.

### 5.3 `Success`, `InvalidRequest` e `OrchestratorResult`

Esses modelos formam a linguagem interna do fluxo.

- `Success`: o modelo gerou uma consulta segura.
- `InvalidRequest`: a pergunta foi rejeitada antes da execução.
- `OrchestratorResult`: agrega resposta final, SQL, linhas e metadados de falha.

### 5.4 `ConversationTurn` e `ConversationKey`

A memória conversacional trabalha com esses dois contratos.

- `ConversationKey` isola por conversa, tenant e usuário.
- `ConversationTurn` guarda pergunta, SQL aprovado, interpretação, raciocínio, premissas e erro.

---

## 6. Prompt engineering atual

A arquitetura de prompts está dividida em três funções:

1. **gerar SQL**;
2. **reaproveitar contexto conversacional**;
3. **explicar o resultado**.

### 6.1 Geração de SQL

O prompt de geração recebe:

- system prompt;
- schema Gold;
- exemplos few-shot;
- valores conhecidos do domínio;
- data atual;
- pergunta final enriquecida.

O objetivo é reduzir alucinação e forçar o LLM a atuar como um gerador determinístico de SQL.

### 6.2 Memória conversacional

O prompt conversacional adiciona regras para:

- follow-ups com demonstrativos;
- refinamentos temporais;
- operações implícitas sobre conjunto anterior;
- mudança de dimensão.

Quando há SQL anterior executável, o `ContextExtractor` extrai IDs ou valores de filtro e gera uma instrução explícita do tipo `WHERE ... IN (...)`.

### 6.3 Explicação

O prompt do explicador transforma o resultado em texto de negócio, evitando incluir detalhes internos do sistema ou dados sensíveis.

### 6.4 Recovery prompts

Quando a validação ou a execução falha, o orquestrador injeta o SQL anterior e o erro em um prompt de recuperação para tentar regenerar a consulta.

---

## 7. Segurança atual

A segurança está distribuída em três níveis.

### 7.1 Política da pergunta

`QueryPolicy` bloqueia perguntas que tentam:

- explorar prompt injection;
- pedir instruções internas;
- sair do domínio analítico;
- disparar ações operacionais indevidas.

### 7.2 Validação de SQL

`SQLValidator` aplica uma política conservadora:

- somente `SELECT`;
- apenas tabelas Gold;
- bloqueio de DML/DDL;
- bloqueio de funções perigosas;
- limite de joins;
- limite de complexidade;
- adição de `LIMIT` quando necessário.

### 7.3 Mascaramento de dados

`QueryExecutor` integra `mask_sensitive_fields_in_rows` para reduzir exposição de PII.

Hoje a proteção cobre principalmente:

- email;
- telefone;
- CPF;
- senha;
- campos equivalentes de alto risco.

---

## 8. Dados e banco

O ambiente atual trabalha com duas formas de execução:

- **SQLite mock** para desenvolvimento e testes locais;
- **PostgreSQL** para ambiente real.

`app/database/mock_gold.py` cria o banco local com dados de apoio.

`app/database/translator.py` adapta SQL de PostgreSQL para SQLite quando o modo local precisa reproduzir consultas do modelo.

### Ponto estrutural importante

Existe um arquivo `app/database/data/connection.py` que contém código executável. Pela arquitetura atual, isso está deslocado: a pasta `data` deveria conter apenas dados, não código. O local correto para conexão é `app/database/connection.py`.

---

## 9. Limitações da arquitetura atual

### 9.1 Memória em memória apenas

O store conversacional é volátil. Reiniciar o processo perde o histórico.

### 9.2 Heurísticas de follow-up

A detecção de referência e mudança de dimensão depende de heurísticas textuais e keywords. Isso funciona bem para o domínio atual, mas não é semanticamente completo.

### 9.3 Schema e prompts em código

Parte importante da base de conhecimento fica em Python. Isso facilita o agente, mas exige disciplina para manter o schema sincronizado com o banco real.

### 9.4 Arquivos pequenos sem claro dono

`app/models/metadata.py` tem utilidade limitada hoje. Se não for consumido, deve ser consolidado ou removido.

### 9.5 Tensão entre feedback humano e LLM

Mesmo com prompts e guardrails, o LLM ainda pode gerar consultas semanticamente inadequadas. A arquitetura reduz risco, mas não elimina completamente a variabilidade do modelo.

---

## 10. Onde cada coisa deveria viver

Essa é a leitura arquitetural mais importante do módulo.

| Responsabilidade | Local correto |
|---|---|
| Entrada HTTP | `app/api/` |
| Entrada CLI | `app/cli/` |
| Orquestração do caso de uso | `app/agents/` |
| Schema e execução de dados | `app/database/` |
| Memória de conversa | `app/memory/` |
| Prompts e exemplos | `app/prompts/` |
| Guardrails e validação | `app/security/` |
| Contratos e DTOs | `app/models/` |
| Textos de rejeição | `app/messages/` |
| Bootstrap local | `app/main.py` |

### Regra prática

- Se o arquivo **decide o que fazer**, ele tende a viver em `agents`.
- Se o arquivo **só conecta entrada com fluxo**, ele vive em `api` ou `cli`.
- Se o arquivo **lê, traduz ou executa dados**, ele vive em `database`.
- Se o arquivo **bloqueia uso indevido**, ele vive em `security`.
- Se o arquivo **só monta texto para o LLM**, ele vive em `prompts`.
- Se o arquivo **só carrega metadados de conversas**, ele vive em `memory`.
- Se o arquivo **é contrato compartilhado**, ele vive em `models`.

---

## 11. Conclusão

A arquitetura atual está relativamente bem separada por responsabilidade, com três núcleos claros:

- **orquestração de IA** em `app/agents`;
- **infraestrutura de dados e segurança** em `app/database` e `app/security`;
- **interfaces de entrada** em `app/api` e `app/cli`.

Os principais ajustes arquiteturais que merecem atenção são:

1. evitar código executável dentro de `app/database/data/`;
2. consolidar ou remover modelos pouco usados;
3. manter prompts e mensagens estritamente textuais;
4. preservar a separação entre contratos, caso de uso e infraestrutura.

Se a intenção for evoluir a base sem aumentar acoplamento, esse é o mapa correto para orientar qualquer refatoração futura.
