# Módulo de Agentes NL2SQL (Agents)

## Visão Geral

O módulo **Agentes** é a camada de orquestração e execução de IA do sistema NL2SQL. Implementa a conversão de perguntas em linguagem natural para SQL executável, validação do SQL gerado, execução contra banco de dados e explicação dos resultados em linguagem natural.

Composto por três agentes especializados que trabalham em sequência:

1. **SQL Generator** (`AgentTextToSQLClient`): Transforma perguntas em SQL
2. **Query Executor** (integrado): Executa SQL contra banco e retorna dados
3. **Explainer** (`ResultExplainer`): Converte dados em explicação narrativa
4. **Orquestrador** (`AgentOrchestrator`): Coordena todo o fluxo com validações e retentativas

## Responsabilidades

### 1. Geração de SQL com Fallback Automático

- **LLM-based text-to-SQL**: Transforma pergunta em linguagem natural para SQL SELECT
- **Cadeia de modelos**: Tenta modelo primário (Gemini 2.5 Flash-Lite), faz fallback para secundário (Gemini 3.1 Flash-Lite) se falhar
- **Schema injection**: Injeta descrições das tabelas Gold no prompt para guiar LLM
- **Exemplos de SQL**: Inclui 2-3 exemplos de SQL correto (adaptados para SQLite vs PostgreSQL)
- **Prompt engineering**: Usa system prompt estruturado com regras de negócio e segurança

### 2. Validação de SQL Segura

- **Análise sintática**: Parser com `sqlglot` para detectar estruturas perigosas
- **Whitelist de tabelas**: Apenas tabelas Gold (`gold_*`) são acessíveis
- **Proibição de mutações**: Bloqueia INSERT, UPDATE, DELETE, DROP, ALTER
- **Limite de complexidade**: Rejeita SQL com muitos JOINs ou subconsultas aninhadas
- **Normalização de LIMIT**: Adiciona LIMIT automático se ausente

### 3. Execução de Consultas

- **Suporte multi-banco**: SQLite (mock local) ou PostgreSQL (produção)
- **Tradução automática**: Converte SQL PostgreSQL para SQLite quando necessário
- **Mascaramento de PII**: Remove dados sensíveis (email, telefone, CPF) das linhas retornadas
- **Timeout e segurança**: Executa com limites de tempo e conexão
- **Rollback automático**: Sem efeitos colaterais permanentes

### 4. Explicação Narrativa

- **Transformação de dados em texto**: Converte linhas SQL em resposta legível ao usuário
- **Contexto estruturado**: Inclui pergunta original, SQL executado e exemplos de linhas
- **Fallback entre modelos**: Usa cadeia de modelos para robustez
- **Limite de linhas no prompt**: Reduz tamanho de contexto (máximo 10 linhas)

### 5. Orquestração Inteligente

- **Validação de pergunta**: Rejeita perguntas que violam política de segurança (prompt injection, out-of-domain)
- **Retentativas após erro**: Regenera SQL se falhar em validação ou execução (até 2 retentativas por padrão)
- **Recovery prompts**: Injeta erro no prompt para que LLM corrija o SQL na próxima tentativa
- **Execução condicional**: Pode pular execução se `execute=false` no request (para testes)

## Arquitetura Interna

### Fluxo de Execução Principal

```
┌─────────────────────────────────────────────────────────────┐
│ Usuário envia: pergunta                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ AgentOrchestrator.ask()                                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
    ┌──────────────────────────────────────┐
    │ [1] Validar pergunta contra policy    │
    │     - Detecta prompt injection       │
    │     - Rejeita out-of-domain         │
    │     - Retorna InvalidRequest se OK   │
    └──────────────────────────────────────┘
                       ↓
    ┌──────────────────────────────────────┐
    │ [2] Gerar SQL                        │
    │     AgentTextToSQLClient.generate()  │
    │     - Tenta modelo primário         │
    │     - Fallback se erro              │
    │     - Retorna Success ou Invalid    │
    └──────────────────────────────────────┘
                       ↓
    ┌──────────────────────────────────────┐
    │ [3] Validar SQL                      │
    │     SQLValidator.validate()          │
    │     - Parse com sqlglot             │
    │     - Whitelist de tabelas          │
    │     - Limite de complexidade        │
    │     - Lança SQLValidationError      │
    └──────────────────────────────────────┘
                       ↓
    ┌──────────────────────────────────────┐
    │ [4] Executar SQL                     │
    │     QueryExecutor.execute()          │
    │     - SQLite ou PostgreSQL          │
    │     - Tradução para SQLite          │
    │     - Mascaramento de PII           │
    │     - Retorna Dict[] ou erro        │
    └──────────────────────────────────────┘
                       ↓
    ┌──────────────────────────────────────┐
    │ [5] Explicar resultado               │
    │     ResultExplainer.explain()        │
    │     - Tenta modelo primário         │
    │     - Fallback se erro              │
    │     - Retorna str (narrativa)       │
    └──────────────────────────────────────┘
                       ↓
    ┌──────────────────────────────────────┐
    │ Retorna OrchestratorResult           │
    │ - explanation: str                  │
    │ - sql: str | None                   │
    │ - interpretation: str               │
    │ - error: str | None                 │
    │ - error_kind: str                   │
    └──────────────────────────────────────┘
```

### Componentes

#### 1. `AgentTextToSQLClient`

**Responsabilidade**: Transformar pergunta em SQL usando modelo LLM.

```python
class AgentTextToSQLClient:
    def __init__(
        self,
        model_name: str | None = None,
        max_retries: int = 3,
    ):
        # Cadeia de modelos para fallback
        self._models_chain = get_model_chain(model_name)
        # Factory para criar agents
        self._create_sql_agent = create_sql_agent
        # Agent principal com fallback integrado
        self.agent = create_agent_with_fallback(...)
    
    def generate_sql(question: str, deps: Deps) -> Success | InvalidRequest:
        """Versão síncrona com fallback"""
    
    async def generate_sql_async(question: str, deps: Deps) -> Success | InvalidRequest:
        """Versão assíncrona com fallback"""
```

**Fluxo**:
1. Injeta schema, exemplos, data atual no prompt
2. Seleciona exemplos SQL conforme dialeto (SQLite vs PostgreSQL)
3. Tenta executar com modelo primário
4. Em caso de erro, tenta modelo secundário
5. Retorna `Success` (com SQL) ou `InvalidRequest` (sem SQL)

**Fallback Strategy**:
```
Tentativa 1: Modelo primário (Gemini 2.5 Flash-Lite)
    ↓
[Sucesso] → Retorna Success
[Erro]    ↓
Tentativa 2: Modelo secundário (Gemini 3.1 Flash-Lite)
    ↓
[Sucesso] → Retorna Success
[Erro]    ↓
Relança exceção
```

#### 2. `ResultExplainer`

**Responsabilidade**: Converter SQL + dados em resposta narrativa em PT-BR.

```python
class ResultExplainer:
    def __init__(
        self,
        model_name: str | None = None,
        max_retries: int = 2,
        max_rows_in_prompt: int = 10,  # Limite de linhas
    ):
        self._models_chain = get_model_chain(model_name)
        self._agent = create_agent_with_fallback(...)
        self._prompt_builder = ExplainerPromptBuilder(...)
    
    def explain(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict],
        execution_skipped: bool,
    ) -> str:
        """Versão síncrona com fallback"""
    
    async def explain_async(...) -> str:
        """Versão assíncrona com fallback"""
```

**Montagem do prompt**:
- Pergunta original
- SQL aprovado
- Primeiras N linhas (sem PII)
- Flag se execução foi pulada

#### 3. `AgentOrchestrator`

**Responsabilidade**: Coordenar SQL Generator, Executor, Explainer com validações.

```python
class AgentOrchestrator:
    def __init__(
        self,
        sql_client: AgentTextToSQLClient | None = None,
        executor: QueryExecutor | None = None,
        explainer: ResultExplainer | None = None,
        policy: QueryPolicy | None = None,
        debug: bool = True,
        max_regenerations_on_exec_error: int = 2,
    ):
        # Lazy loading de componentes
        self._sql = sql_client
        self._executor = executor
        self._explainer = explainer
        self._policy = policy
        self._max_regenerations_on_exec_error = max_regenerations_on_exec_error
    
    async def ask(question: str, deps: Deps) -> OrchestratorResult:
        """Executa o fluxo completo"""
```

**Retentativas após erro de execução**:

```
Tentativa 1: SQL original
    ↓
[Validação OK, Execução OK] → Sucesso
[Validação falha]           ↓
                    Reforça SQL com error + injeção
                            ↓
Tentativa 2: SQL regenerado
    ↓
[Validação OK, Execução OK] → Sucesso
[Execução falha]            ↓
                    Reforça SQL com db_error
                            ↓
Tentativa 3: SQL regenerado novamente
```

#### 4. `QueryExecutor`

**Responsabilidade**: Executar SQL validado contra banco.

```python
class QueryExecutor:
    async def execute(conn: Any, sql: str) -> list[dict]:
        """
        - SQLite: traduz para SQLite (DATE_TRUNC → STRFTIME, etc.)
        - PostgreSQL (asyncpg): usa fetch()
        - Síncronas (DB-API): usa cursor.execute()
        """
```

#### 5. Configuração de Modelos (`model_config.py`)

**Responsabilidade**: Gerenciar cadeia de modelos e fallback.

```python
def get_model_chain(model_name: str | None = None) -> list[str]:
    """Retorna [modelo_primário, modelo_fallback]"""

def create_agent_with_fallback(
    agent_name: str,
    model_name: str | None,
    agent_factory: Callable,
) -> Agent:
    """Cria agent com suporte a fallback automático"""
```

**Modelos padrão**:
- Primário: `google-gla:gemini-3.1-flash-lite` (rápido, barato)
- Fallback: `google-gla:gemini-3.1-flash-lite` (mesmo modelo ou alternativo)

## Integração com Outros Módulos

### Entrada

- **De**: API REST (`/ask`) ou CLI
- **O que**: `AskRequest` com pergunta, user_id, tenant_id, conversation_id
- **Com contexto**: Memória conversacional (turnos anteriores)

### Saída

- **Para**: API REST ou CLI
- **O que**: `OrchestratorResult`:
  ```python
  @dataclass
  class OrchestratorResult:
      explanation: str           # Resposta narrativa
      sql: str | None           # SQL gerado
      interpretation: str       # Resumo da interpretação
      reasoning: List[str]      # Passos de raciocínio
      assumptions: List[str]    # Premissas usadas
      error: str | None         # Mensagem de erro se falha
      error_kind: str | None    # Categoria: validation, execution, policy, agent
  ```

### Dependências

- **Schema Registry**: Carrega definições de tabelas Gold
- **Security Policies**: Valida pergunta e SQL
- **Memory Store**: Recupera contexto conversacional anterior
- **Database Executor**: Executa SQL

## Prompt Engineering

### System Prompt

Localizado em `app/prompts/system_prompt.py`:

```markdown
# SISTEMA ESPECIALIZADO EM TEXT-TO-SQL

Você é um agente especializado em transformar perguntas de negócio
em SQL SELECT seguro para um data warehouse de e-commerce.

REGRAS OBRIGATÓRIAS:
1. Retorne APENAS um SELECT válido
2. Use apenas tabelas Gold (gold_*)
3. Respire apenas SELECT; proíba DML/DDL
4. Validate WHERE cláusulas com dados concretos
5. ...
```

### Injeção de Schema

Schema é montado dinamicamente em `app/database/schema_registry.py`:

```markdown
# TABELAS DISPONÍVEIS:

## gold_vendas_kpis
- Descrição: KPIs mensais de vendas
- Chave primária: ano_mes
- Colunas:
  - receita_bruta (SUM)
  - qtd_pedidos_aprovados (SUM)
  - ticket_medio (NAO_SOMAR)
  ...
- Regras IA:
  - Use para análises mensais
  - Não use para pedidos individuais
  - Para ticket médio agregado: SUM(receita) / SUM(qtd_pedidos)
```

### Exemplos de SQL

Selecionados dinamicamente conforme dialeto:

**Para PostgreSQL**:
```sql
SELECT categoria, SUM(receita_bruta) as receita_total
FROM gold_vendas_kpis
WHERE ano_mes >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
GROUP BY categoria
ORDER BY receita_total DESC
LIMIT 10;
```

**Para SQLite** (exemplos adaptados):
```sql
SELECT categoria, SUM(receita_bruta) as receita_total
FROM gold_vendas_kpis
WHERE ano_mes >= strftime('%Y-%m', 'now', '-3 months')
GROUP BY categoria
ORDER BY receita_total DESC
LIMIT 10;
```

## Validações e Regras

| Fase | Validação | Ação se Falhar |
|------|-----------|---|
| **Pergunta** | Detecta prompt injection, out-of-domain | InvalidRequest |
| **SQL (sintaxe)** | Parse com sqlglot | SQLValidationError |
| **SQL (policy)** | Apenas SELECT, tabelas Gold, sem mutações | SQLValidationError |
| **Execução** | Timeout, banco indisponível | Recovery attempt |
| **Explicação** | Modelo LLM falha | Usa modelo fallback |

## Tratamento de Erros

### Error Kinds

| error_kind | Descrição | Recovery |
|-----------|-----------|----------|
| `policy` | Pergunta viola regra de segurança | Rejeita, sem retry |
| `agent` | LLM não consegue gerar SQL | Tenta modelo fallback, depois rejeita |
| `sql_validation` | SQL inválido sintaticamente | Regenera com error_msg no prompt (retry 1-2) |
| `sql_execution` | SQL válido mas execução falha no banco | Regenera com db_error no prompt (retry 1-2) |
| `explanation` | Falha ao explicar resultado | Usa modelo fallback |

### Recovery Prompts

Quando ocorre erro de validação ou execução, orquestrador regenera SQL injetando:

```markdown
# RECUPERAÇÃO DE ERRO

Sua resposta anterior resultou em erro:

**SQL anterior**: 
```sql
SELECT ... WHERE column IN (...)  -- Erro aqui
```

**Erro**: 
```
column 'xyz' does not exist
```

Corrija o SQL para um novo SELECT válido:
```

## Segurança

### 1. Whitelist de Tabelas

Apenas tabelas `gold_*` são permitidas:

```python
ALLOWED_TABLES = {
    "gold_vendas_kpis",
    "gold_cliente_360",
    "gold_avaliacoes",
    "gold_tickets",
    "gold_clickstream_resumo",
    # ...
}
```

### 2. Bloqueio de Operações Perigosas

```
Bloqueado: INSERT, UPDATE, DELETE, DROP, ALTER, CREATE
Bloqueado: Funções de sistema (EXEC, LOAD_FILE, etc.)
Bloqueado: Subconsultas aninhadas > 3 níveis
Bloqueado: JOINs > 5 tabelas
```

### 3. Limite de Complexidade

```
Cada operação tem "peso":
- SELECT: 1 ponto
- WHERE: 1 ponto
- JOIN: 2 pontos
- Subconsulta: 5 pontos
- Máximo: 20 pontos
```

### 4. Mascaramento de PII

Executor automaticamente remove:
- email
- telefone
- cpf
- senha
- data_nascimento

## Observabilidade

### Logs

O módulo não emite logs estruturados; recomendação de integração:

```python
# No Orchestrator
logger.info(f"[orchestrator] Fase: validation_policy")
logger.info(f"[orchestrator] Pergunta aceita: {question[:50]}")
logger.info(f"[sql_generator] Tentativa {attempt} com modelo {model}")
logger.info(f"[sql_generator] SQL gerado: {sql[:100]}")
logger.info(f"[sql_validator] Validação: OK | {num_joins} joins | score={complexity}")
logger.info(f"[executor] Executado em {execution_time:.2f}s | {row_count} linhas")
logger.error(f"[orchestrator] Erro: {error_kind}: {error_msg}")
```

### Métricas

- `agents.sql_generation.attempts` (Counter)
- `agents.sql_generation.fallback_used` (Counter)
- `agents.sql_validation.rejections` (Counter)
- `agents.sql_execution.errors` (Counter)
- `agents.execution_time_ms` (Histogram)
- `agents.rows_returned` (Histogram)

### Debug Mode

Ativar com `debug=True` no Orchestrator:

```python
orchestrator = AgentOrchestrator(debug=True)
# Emite [orchestrator] logs via print()
```

## Limitações e Problemas Conhecidos

### 1. Variabilidade do LLM

- **Problema**: LLM às vezes gera SQL válido mas semanticamente incorreto
- **Impacto**: Resultado pode estar tecnicamente correto mas responder errado à pergunta
- **Mitigação**: Validação pós-execução, feedback em cadeia

### 2. Schema Injection

- **Problema**: Prompt do schema pode ficar muito grande (muitas colunas)
- **Impacto**: Aumenta latência, pode prejudicar qualidade
- **Mitigação**: Injetar schema resumido, não todas as colunas

### 3. Exemplos de SQL Limitados

- **Problema**: Apenas 2 exemplos por dialeto no prompt
- **Impacto**: LLM pode não conhecer padrão para queries complexas
- **Mitigação**: Aumentar exemplos, mas cuidado com tamanho do prompt

### 4. Fallback Entre Modelos

- **Problema**: Sem garantia que modelo secundário é tão bom quanto primário
- **Impacto**: Qualidade pode degradar em fallback
- **Mitigação**: Escolher fallback cuidadosamente, testar antes de deploy

### 5. Tradução SQLite

- **Problema**: Nem todas as funções PostgreSQL podem ser traduzidas para SQLite
- **Exemplo**: `DATE_TRUNC` → `strftime` pode falhar em edge cases
- **Impacto**: SQL válido em PostgreSQL falha em SQLite
- **Mitigação**: Usar funções compatíveis em schema injection

## Extensões Futuras

### 1. Few-Shot Learning

```python
# Treinar modelo com exemplos específicos de perguntas do domínio
class DomainSpecificSQLClient(AgentTextToSQLClient):
    def __init__(self, domain_examples: List[Example]):
        # Adicionar exemplos customizados ao prompt
```

### 2. Validação Semântica

```python
# Validar se SQL responde realmente à pergunta
class SemanticValidator:
    def validate(self, question: str, sql: str, schema: Schema) -> bool:
        # Executar SQL e verificar se resultado faz sentido
        # Usar similarity entre pergunta e resultado
```

### 3. Caching de SQL

```python
# Cache de perguntas → SQL para reduzir custo de geração
class CachedSQLGenerator:
    def generate_sql(self, question: str) -> Success | InvalidRequest:
        if similarity(question, cached_question) > 0.9:
            return cached_sql
        return super().generate_sql(question)
```

### 4. Multimodal Support

```python
# Suportar imagens, tabelas como entrada (em Python 3.12+)
async def ask_multimodal(
    self,
    question: str,
    images: List[bytes] = None,
    tables: List[DataFrame] = None,
):
    ...
```

## Referências de Código

| Arquivo | Responsabilidade | LOC |
|---------|-----------------|-----|
| `orchestrator.py` | Coordenação principal | ~350 |
| `sql_generator.py` | Geração com fallback | ~150 |
| `explainer.py` | Explicação narrativa | ~120 |
| `model_config.py` | Config de modelos | ~100 |

## Glossário

| Termo | Definição |
|-------|-----------|
| **Text-to-SQL** | Conversão de pergunta em linguagem natural para SQL |
| **Fallback** | Estratégia de retentativa com modelo alternativo |
| **Recovery Prompt** | Prompt que injeta erro anterior para regenerar SQL |
| **Whitelist** | Lista de recursos permitidos (tabelas, funções) |
| **OrchestratorResult** | Estrutura de retorno com SQL, explicação e metadados |
| **System Prompt** | Instruções base que definem comportamento do LLM |

---

**Versão**: 1.0  
**Última Atualização**: Mai 2026  
**Autor**: Equipe de Engenharia NL2SQL  
**Status**: Produção
