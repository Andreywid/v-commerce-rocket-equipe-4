# V-Commerce AI Agent — Documentação Técnica

## 1. Visão geral

O **V-Commerce AI Agent** é um agente conversacional de IA focado em **Text-to-SQL**.  
O objetivo da aplicação é permitir que usuários façam perguntas em linguagem natural sobre a **Camada Gold** e recebam:

- a interpretação da pergunta;
- a SQL gerada;
- a execução opcional da consulta;
- os resultados em formato estruturado;
- uma explicação final em linguagem natural.

A aplicação foi desenhada com foco em:

- **governança de schema**;
- **validação de SQL por AST**;
- **controle de acesso por tabela e coluna**;
- **memória conversacional**;
- **segurança contra queries perigosas**;
- **modo local com SQLite mock**;
- **API HTTP e CLI**.

---

## 2. Fluxo principal da aplicação

O fluxo principal do sistema é:

1. o usuário envia uma pergunta em linguagem natural;
2. a API ou CLI cria um contexto de execução;
3. o orquestrador consulta a política de segurança;
4. o gerador de SQL monta a query com base no schema Gold;
5. a query passa por validação determinística;
6. se permitido, a consulta é executada;
7. o resultado é explicado ao usuário;
8. a conversa é registrada na memória curta.

### Fluxo simplificado

```text
Usuário
  ↓
API / CLI
  ↓
Contexto + Memória
  ↓
Orquestrador
  ↓
Gerador SQL
  ↓
Validador SQL
  ↓
Executor
  ↓
Explainer
  ↓
Resposta final
```

---

## 3. Estrutura do projeto

```text
app/
├── agents/      # Geração SQL, explicação e orquestração
├── api/         # FastAPI, rotas e dependências
├── cli/         # Execução local via terminal
├── database/    # Schema, mock SQLite, execução e tradução
├── memory/      # Memória conversacional
├── messages/    # Mensagens de rejeição e respostas de erro
├── models/      # Contratos Pydantic
├── prompts/     # Prompts do agente e exemplos few-shot
└── security/    # Guardrails, validação SQL e mascaramento de PII

tests/           # Testes automatizados
```

---

## 4. Módulos principais

### 4.1 `app/agents`

Responsável pela lógica de IA do sistema.

Componentes principais:

- `sql_generator.py`  
  Gera SQL a partir da pergunta e do contexto.

- `orchestrator.py`  
  Coordena o fluxo completo: política, geração, validação, execução e explicação.

- `explainer.py`  
  Converte resultado de banco em explicação em linguagem natural.

- `model_config.py`  
  Centraliza configurações do modelo.

### 4.2 `app/api`

Expõe a API HTTP do agente via FastAPI.

- `app.py`  
  Factory da aplicação FastAPI.

- `routes.py`  
  Rotas públicas (`/health` e `/ask`).

- `dependencies.py`  
  Injeção de dependências para orquestrador, memória e contexto.

### 4.3 `app/cli`

Interface de linha de comando para uso local, inspeção e debug.

- `args.py`  
  Parser principal da CLI.

- `runner.py`  
  Executa chat, API e orquestrador.

- `inspect.py`  
  Mostra informações do schema e prompt.

- `mock.py`  
  Garante o SQLite mock local.

- `context.py`  
  Contexto de autorização e execução.

### 4.4 `app/database`

Camada de dados e compatibilidade entre ambientes.

- `schema_registry.py`  
  Registra o `GOLD_SCHEMA`.

- `mock_gold.py`  
  Cria o SQLite mock da camada Gold.

- `executor.py`  
  Executa SQL validado.

- `translator.py`  
  Traduz SQL PostgreSQL para SQLite quando necessário.

- `connection.py`  
  Define o tipo de banco usado pelo executor.

### 4.5 `app/memory`

Gerencia memória conversacional de curto prazo.

- armazena turns por conversa;
- recupera histórico para a geração;
- injeta contexto anterior na pergunta atual.

### 4.6 `app/prompts`

Contém prompts estruturados e exemplos few-shot.

- `system_prompt.py`
- `sql_prompt_builder.py`
- `sql_user_prompt.py`
- `examples.py`
- `conversational_memory_prompt.py`
- `explainer_prompt_builder.py`
- `explainer_prompts.py`
- `schema_prompt_intro.py`
- `orchestrator_prompts.py`

### 4.7 `app/security`

Implementa o núcleo de segurança do projeto.

- `guardrails.py`  
  Regras de política da pergunta e do contexto.

- `sql_validator.py`  
  Validação determinística do SQL com `sqlglot`.

- `pii_mask.py`  
  Mascaramento de CPF em resultados.

- `policies.py`  
  Constantes e limites de segurança.

- `exceptions.py`  
  Exceções da camada de segurança.

---

## 5. API HTTP

A aplicação expõe a API via FastAPI.

### 5.1 `GET /health`

Endpoint de saúde da aplicação.

#### Resposta

```json
{
  "status": "ok"
}
```

### 5.2 `POST /ask`

Recebe uma pergunta em linguagem natural e retorna a resposta do orquestrador.

#### Exemplo de request

```json
{
  "question": "Qual a receita bruta total em 2024-11?",
  "conversation_id": "conv-123",
  "user_id": "user-1",
  "tenant_id": "tenant-a",
  "roles": ["analyst"],
  "allowed_tables": ["gold_vendas_kpis"],
  "allowed_columns": {
    "gold_vendas_kpis": ["ano_mes", "receita_bruta"]
  },
  "allow_all_schema_access": false,
  "allow_sensitive_pii": false,
  "require_tenant": false,
  "execute": true
}
```

#### Exemplo de response

```json
{
  "conversation_id": "conv-123",
  "explanation": "A receita bruta total em 2024-11 foi ...",
  "sql": "SELECT ...",
  "rows": [
    {
      "receita_bruta_total": 12345.67
    }
  ],
  "interpretation": "Somar receita bruta em novembro de 2024.",
  "reasoning": [
    "Usar a tabela de KPIs de vendas.",
    "Filtrar o mês de 2024-11."
  ],
  "assumptions": [],
  "error": null,
  "error_kind": null
}
```

### 5.3 Contratos Pydantic

Os contratos HTTP ficam em `app/models/api.py`:

- `HealthResponse`
- `AskRequest`
- `AskResponse`

Esses modelos garantem validação automática e documentação OpenAPI.

---

## 6. CLI

A aplicação também pode ser executada via terminal.

### 6.1 Entrypoint

O ponto de entrada está em `app/main.py`.

### 6.2 Principais modos de uso

- `--chat`  
  abre um chat interativo.

- `--question`  
  executa uma pergunta única.

- `--serve-api`  
  sobe a API FastAPI.

- `--dry-prompt`  
  imprime o prompt montado antes de chamar o modelo.

- `--schema-info`  
  mostra estatísticas e informações do schema.

- `--mock-only`  
  recria e valida apenas o SQLite mock.

- `--no-exec-mock`  
  gera SQL, mas não executa a consulta no mock.

### 6.3 Exemplo de execução

```bash
python -m app.main --question "Qual a receita bruta total em 2024-11?"
```

### 6.4 Contexto de autorização na CLI

A CLI permite controlar:

- `--conversation-id`
- `--user-id`
- `--tenant-id`
- `--role`
- `--allowed-table`
- `--allowed-column`
- `--allow-all-schema-access`
- `--allow-sensitive-pii`
- `--require-tenant`
- `--debug-memory`

Isso torna o ambiente local adequado para testes com governança e restrições semelhantes às da aplicação real.

---

## 7. Schema Gold e governança semântica

O coração do sistema é o `GOLD_SCHEMA`, definido em `app/database/schema_registry.py`.

Ele descreve, para cada tabela:

- descrição de negócio;
- granularidade;
- chave primária;
- chaves estrangeiras;
- regras de IA;
- colunas;
- tipos;
- agregações válidas;
- valores válidos.

### Objetivo do schema semântico

O schema não serve apenas como catálogo técnico.  
Ele funciona como uma camada de governança que ajuda o modelo a:

- escolher a tabela correta;
- evitar agregações inválidas;
- respeitar regras de negócio;
- reduzir alucinações;
- evitar joins incorretos;
- impedir o uso de colunas fora do contexto.

### Exemplos de uso

- tabelas agregadas para KPIs mensais;
- tabelas detalhadas para análises de pedidos;
- tabelas de comportamento para análise diária;
- filtros por enum com valores controlados;
- regras para `SUM`, `AVG` e campos que não devem ser somados diretamente.

---

## 8. Geração de SQL

A geração de SQL é feita pelo agente em `app/agents/sql_generator.py`.

### Características do gerador

- usa prompt estruturado;
- usa schema Gold como contexto;
- trabalha com exemplos few-shot;
- retorna saída estruturada;
- permite rejeição explícita de requisições inválidas.

### Saída estruturada

O gerador pode retornar:

- `Success`
- `InvalidRequest`

Isso permite que o sistema distinga entre:

- uma SQL válida;
- uma pergunta insegura;
- uma pergunta fora de escopo.

---

## 9. Validação de SQL

A validação é determinística e fica em `app/security/sql_validator.py`.

### O que o validador faz

- rejeita SQL vazio;
- rejeita SQL muito grande;
- aceita apenas um statement;
- aceita apenas `SELECT`;
- bloqueia CTEs;
- bloqueia operações de conjunto como `UNION`;
- bloqueia comandos de mutação;
- valida tabelas permitidas;
- valida funções bloqueadas;
- valida joins;
- normaliza literais;
- controla complexidade;
- força `LIMIT`.

### Por que isso é importante

O LLM gera texto probabilístico.  
O validador converte isso em uma camada determinística de controle.

Isso reduz riscos como:

- `DROP TABLE`;
- `INSERT`;
- `UPDATE`;
- `DELETE`;
- consultas arbitrárias;
- queries muito caras;
- bypass de política.

---

## 10. Execução da query

A execução é feita por `app/database/executor.py`.

### Comportamento

- em modo SQLite, a SQL é traduzida para SQLite;
- em conexões DB-API síncronas, executa com cursor;
- em drivers assíncronos, usa `fetch`;
- as linhas retornadas são normalizadas para dicionários;
- o resultado é mascarado quando necessário.

### Mascaramento de PII

O executor aplica mascaramento de CPF nos resultados.

Isso evita vazamento de dados sensíveis na resposta final.

---

## 11. Memória conversacional

A memória curta fica em `app/memory/conversation_store.py`.

### Funções principais

- criar novo `conversation_id`;
- listar turns anteriores;
- anexar o resultado de uma conversa;
- construir a pergunta enriquecida com memória.

### Limitação atual

A memória é in-memory.

Isso é adequado para:

- local development;
- protótipos;
- testes.

Mas não é ideal para produção distribuída sem persistência externa.

---

## 12. Prompts

Os prompts estão organizados para separar cada responsabilidade.

### Tipos de prompt

- **System prompt**  
  regras gerais do agente.

- **Prompt de schema**  
  representação textual do schema Gold.

- **Prompt do usuário**  
  pergunta + memória + contexto.

- **Prompt do orquestrador**  
  recuperação após erro de execução.

- **Prompt do explicador**  
  transforma resultado em texto natural.

### Objetivo

Essa organização melhora:

- legibilidade;
- manutenção;
- teste;
- controle do comportamento do modelo.

---

## 13. Segurança

O projeto adota uma abordagem de defesa em profundidade.

### Camadas de proteção

1. **Guardrails de política**  
   bloqueiam perguntas fora de contexto.

2. **Controle de tabelas e colunas**  
   restringe o acesso ao schema.

3. **Validação determinística de SQL**  
   evita queries perigosas.

4. **Mascaramento de PII**  
   protege dados sensíveis na resposta.

5. **Limites de complexidade e tamanho**  
   reduzem risco de abuso e custo alto.

### Riscos ainda existentes

- prompt injection;
- bypass semântico;
- over-permission em ambientes mal configurados;
- dependência de validação por blacklist em algumas políticas;
- necessidade de maior observabilidade em produção.

---

## 14. Testes automatizados

O projeto possui testes para partes centrais do sistema.

### Cobertura esperada

- API;
- memória;
- guardrails;
- configuração de modelo;
- orquestrador;
- mascaramento de PII;
- geração de SQL;
- builder de prompts;
- validador SQL.

### Objetivo dos testes

Garantir que:

- o fluxo principal não quebre;
- a segurança continue funcionando;
- as regras de negócio permaneçam estáveis;
- a integração entre módulos siga consistente.

---

## 15. Configuração de ambiente

### Variáveis principais

A aplicação usa `.env` e também permite fallback para variáveis de ambiente.

#### Exemplo

```env
GOOGLE_API_KEY=...
API_KEY=...
```

### Arquivo `.env.example`

O projeto fornece um exemplo de configuração para facilitar o setup local.

---

## 16. Dependências principais

O projeto usa, entre outras bibliotecas:

- `fastapi`
- `pydantic`
- `sqlglot`
- `pandas`
- `python-dotenv`

---

## 17. Como executar localmente

### 17.1 Via CLI

```bash
python -m app.main --chat
```

### 17.2 Via pergunta única

```bash
python -m app.main --question "Qual a receita bruta total em 2024-11?"
```

### 17.3 Via API

```bash
python -m app.main --serve-api
```

---

## 18. Exemplos práticos

### Exemplo 1 — inspeção do prompt

```bash
python -m app.main --dry-prompt --question "Quais foram os 10 produtos mais vendidos no mês?"
```

### Exemplo 2 — visão do schema

```bash
python -m app.main --schema-info
```

### Exemplo 3 — chat com memória

```bash
python -m app.main --chat --conversation-id conv-001
```

### Exemplo 4 — execução controlada com permissões

```bash
python -m app.main   --question "Qual a receita bruta total em 2024-11?"   --tenant-id tenant-a   --user-id user-1   --role analyst   --allowed-table gold_vendas_kpis
```

---

## 19. Limitações atuais

Apesar da boa arquitetura, a solução ainda tem limitações importantes:

- memória in-memory;
- ausência de persistência distribuída;
- observabilidade limitada;
- dependência forte de LLM;
- necessidade de melhor engine de avaliação;
- ausência de rate limiting explícito;
- necessidade de integração com autenticação/autorização completa em produção.

---

## 20. Evoluções recomendadas

### Curto prazo

- adicionar logging estruturado;
- incluir tracing;
- persistir memória em Redis ou banco;
- ampliar testes adversariais;
- criar benchmark de execução SQL.

### Médio prazo

- adicionar cache;
- criar autenticação real;
- adicionar rate limiting;
- suportar múltiplos provedores LLM;
- separar planner semântico do gerador SQL.

### Longo prazo

- migrar para arquitetura com IR intermediária;
- introduzir camada semântica consultável;
- adicionar avaliação contínua de qualidade;
- suportar governança enterprise com políticas centralizadas.

---

## 21. Resumo executivo

O V-Commerce AI Agent é uma aplicação de IA bastante madura para um sistema Text-to-SQL, com destaque para:

- boa separação arquitetural;
- prompt engineering cuidadoso;
- validação SQL por AST;
- governança semântica do schema;
- segurança em múltiplas camadas;
- suporte a CLI e API;
- memória conversacional;
- cobertura de testes relevante.

É uma base forte para evoluir para um produto enterprise, desde que receba melhorias em:

- observabilidade;
- persistência;
- controle de acesso;
- avaliação;
- escalabilidade operacional.
