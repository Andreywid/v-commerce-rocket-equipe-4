# Módulo de Banco de Dados (Database)

## Visão Geral

O módulo **Database** é a camada de acesso aos dados, responsável por:

- **Gerenciar conexões** com SQLite (mock local) ou PostgreSQL (produção)
- **Executar queries** validadas com suporte multi-dialeto
- **Traduzir SQL** entre PostgreSQL e SQLite automaticamente
- **Registrar schema** de tabelas Gold com metadados e regras de negócio
- **Mascarar PII** em resultados antes de retornar

Este módulo atua como abstraçãoindependente de banco de dados, permitindo que o agente NL2SQL funcione sem mudanças de código entre ambientes local e produção.

## Responsabilidades

### 1. Gerenciamento de Conexões

- **Polimorfismo de banco**: Suporta SQLite, PostgreSQL e DBs genéricos (DB-API)
- **Lazy loading**: Conexão criada sob demanda, não na inicialização
- **Configuração por ambiente**: `DB_TYPE`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
- **Mock local**: SQLite padrão para testes e desenvolvimento

### 2. Execução de Queries

- **Abstração multi-engine**: `QueryExecutor` detecta tipo de conexão automaticamente
- **Execução assíncrona**: Suporta `asyncpg` nativo ou coroutines wrapper
- **Tradução de dialeto**: Converte PostgreSQL → SQLite quando necessário
- **Normalização de resultado**: Retorna sempre `List[Dict]` independente de banco

### 3. Schema Registry

- **Metadados estruturados**: Descrição de cada tabela Gold com colunas, tipos, regras
- **Regras de negócio**: Instruções IA para evitar mau uso (ex: não somar `ticket_medio`)
- **Injeção no prompt**: Schema formatado é injetado ao SQL Generator
- **Granularidade documentada**: Cada tabela descreve seu nível de detalhe

### 4. Tradução SQL

- **Conversão automática**: Transforma SQL PostgreSQL em SQLite quando necessário
- **Funções mapeadas**: 
  - `DATE_TRUNC('month', col)` → `strftime('%Y-%m', col)`
  - `INTERVAL` → calculado em Python
  - `ILIKE` → `LIKE` (case-insensitive em SQLite)
- **Tipos de dados**: SQLite não tem tipos, PostgreSQL é mais tipado

### 5. Sanitização de Resultados

- **Mascaramento de PII**: Remove ou redacts dados sensíveis
- **Padrões detectados**: email, telefone, CPF, senha, data_nascimento
- **Preservação de análise**: Dados não-sensíveis (agregações, IDs) retornam intactos

## Arquitetura Interna

### Componentes Principais

#### 1. `connection.py` - Factory de Conexões

```python
class Connection:
    """Factory que retorna conexão correta conforme DB_TYPE."""

DB_TYPE = os.getenv("DB_TYPE", "sqlite")  # "sqlite" | "postgresql"

async def get_connection() -> Union[sqlite3.Connection, asyncpg.Connection]:
    """
    SQLite: sqlite3.connect("mock_gold.sqlite")
    PostgreSQL: await asyncpg.connect(host, port, user, password, database)
    """
```

**Fluxo de decisão**:

```
get_connection()
    ↓
[DB_TYPE == "sqlite"]?
    ├─ Yes → sqlite3.connect(local_path)
    └─ No  → await asyncpg.connect(host, port, user, password, db)
```

#### 2. `executor.py` - Executor de Queries

```python
class QueryExecutor:
    """Executa SQL com suporte a múltiplos dialetos e mascaramento de PII."""
    
    async def execute(conn: Any, sql: str) -> list[dict]:
        """
        1. Detecta tipo de banco (sqlite vs asyncpg vs outro)
        2. Se SQLite, traduz SQL (PostgreSQL → SQLite)
        3. Executa query
        4. Normaliza resultado para List[Dict]
        5. Mascara campos sensíveis
        6. Retorna dados
        """
```

**Tipos de conexão suportados**:

| Tipo | Detecção | Execução |
|------|----------|----------|
| SQLite | `isinstance(conn, sqlite3.Connection)` | `pd.read_sql_query()` |
| PostgreSQL (asyncpg) | `hasattr(conn, 'fetch')` | `await conn.fetch(sql)` |
| Genérico (DB-API) | Padrão | `conn.cursor().execute()` |

**Fluxo de execução**:

```
execute(conn, sql)
    ↓
[tipo de conexão?]
    ├─ SQLite:
    │  ├─ translate_to_sqlite(sql)
    │  ├─ pd.read_sql_query(sql_traduzido, conn)
    │  └─ df.to_dict(orient="records")
    │
    ├─ asyncpg:
    │  ├─ await conn.fetch(sql)
    │  └─ [dict(row) for row in rows]
    │
    └─ Genérico:
       ├─ cursor.execute(sql)
       └─ dict(zip(columns, row)) for row in fetchall()
    ↓
mask_sensitive_fields_in_rows(result)
    ↓
return List[Dict]
```

#### 3. `translator.py` - Tradução de Dialetos

```python
class SQLTranslator:
    """Transforma SQL PostgreSQL em SQLite."""
    
    @staticmethod
    def translate_to_sqlite(sql: str) -> str:
        """
        Conversões principais:
        - DATE_TRUNC('month', col) → strftime('%Y-%m', col)
        - INTERVAL '3 days' → passado como valor
        - ILIKE → LIKE (sem suporte a case-insensitive nativo)
        - :: (PostgreSQL cast) → CAST(col AS type)
        """
```

**Mapeamento de funções**:

| PostgreSQL | SQLite | Exemplo |
|-----------|--------|---------|
| `DATE_TRUNC('month', col)` | `strftime('%Y-%m', col)` | `DATE_TRUNC('month', data_pedido)` → `strftime('%Y-%m', data_pedido)` |
| `INTERVAL '3 months'` | Python `timedelta` | Calculado em Python antes de injetar |
| `ILIKE` | `LIKE` | `nome ILIKE '%algo%'` → `nome LIKE '%algo%'` |
| `col::type` | `CAST(col AS type)` | `id::text` → `CAST(id AS TEXT)` |
| `CURRENT_DATE` | `date('now')` | Funciona em ambos |
| `CURRENT_TIMESTAMP` | `datetime('now')` | Adaptado conforme necessário |

#### 4. `schema_registry.py` - Registro de Schema

```python
class SchemaRegistry:
    """Define todas as tabelas Gold e suas metadatas."""
    
    GOLD_SCHEMA = {
        "gold_vendas_kpis": {
            "descricao": "...",
            "granularidade": "Uma linha por mês",
            "chave_primaria": ["ano_mes"],
            "regras_ia": [...],
            "colunas": {
                "ano_mes": {...},
                "receita_bruta": {...},
                ...
            }
        },
        "gold_cliente_360": {...},
        ...
    }
    
    @staticmethod
    def get_schema_prompt() -> str:
        """Formata schema para injeção no prompt do LLM."""
```

**Estrutura de tabela**:

```yaml
tabela:
  descricao: "string descrevendo a tabela"
  granularidade: "uma linha por X" (ex: por mês, por cliente)
  chave_primaria: [coluna, ...]
  regras_ia:
    - "Regra 1 para evitar erros"
    - "Regra 2 para guiar geração de SQL"
  colunas:
    coluna_1:
      descricao: "string"
      tipo: "inteiro | texto | decimal | data"
      agregacao: "SUM | AVG | COUNT | MAX | MIN | NAO_SOMAR | RECALCULAR"
      exemplo: "valor de exemplo"
    ...
```

**Exemplo real**:

```yaml
gold_vendas_kpis:
  descricao: "KPIs mensais de vendas"
  granularidade: "Uma linha por mês"
  colunas:
    receita_bruta:
      tipo: decimal
      agregacao: SUM
      descricao: "Receita bruta aprovada"
    ticket_medio:
      tipo: decimal
      agregacao: NAO_SOMAR  # ⚠️ Regra crítica
      descricao: "Receita / quantidade de pedidos"
```

**Regras IA críticas**:

Algumas colunas têm regras especiais para evitar SQL incorreto:

- **NAO_SOMAR**: Não use SUM diretamente (ex: `ticket_medio`)
- **RECALCULAR**: Recalcule ao agregar (ex: `taxa_aprovacao`)
- **NAO_SOMAR_DIRETAMENTE**: Use COUNT(DISTINCT ...) ou não agregue (ex: `qtd_clientes_unicos`)

#### 5. `mock_gold.py` - Dados Mock

```python
def ensure_mock_sqlite():
    """Garante que SQLite mock exists com dados pré-carregados."""
    
    if not Path("mock_gold.sqlite").exists():
        create_mock_database()
    
    return "mock_gold.sqlite"
```

**Dados inclusos**:
- gold_vendas_kpis: 12 meses de histórico
- gold_cliente_360: 1000+ clientes
- gold_avaliacoes: avaliações de produtos
- gold_tickets: tickets de suporte
- Dados realistas, representativos

## Fluxo de Dados

### Cenário: Executar Query

```
API recebe: POST /ask {"question": "..."}
    ↓
Orchestrator.ask(question, deps)
    ↓
deps contém: conn = await get_connection()
    ↓
SQLValidator.validate(sql) → sql válido
    ↓
QueryExecutor.execute(conn, sql)
    ├─ [SQLite]
    │  ├─ translate_to_sqlite(sql) → sql_translated
    │  ├─ pd.read_sql_query(sql_translated, conn)
    │  ├─ df.to_dict() → raw_rows
    │  └─ mask_sensitive_fields(raw_rows) → masked_rows
    │
    ├─ [PostgreSQL]
    │  ├─ await conn.fetch(sql) → raw_rows
    │  └─ mask_sensitive_fields(raw_rows) → masked_rows
    │
    └─ retorna: List[Dict]
    ↓
ResultExplainer.explain(rows, sql) → string
    ↓
OrchestratorResult com explicação retorna à API
```

### Integração com Schema Registry

```
SQL Generator pede schema:
    ↓
get_schema_prompt() → string formatado
    ├─ Para cada tabela Gold:
    │  ├─ Descrição
    │  ├─ Granularidade
    │  ├─ Regras IA
    │  └─ Colunas com tipos e agregações
    ↓
Prompt injetado ao LLM
    ↓
LLM gera SQL usando tabelas que conhece
```

## Integração com Outros Módulos

### Entrada

- **De**: `AgentOrchestrator` (via `Deps`)
- **O que**: `conn` (conexão aberta) e `sql` (string validada)

### Saída

- **Para**: `AgentOrchestrator` 
- **O que**: `List[Dict]` com dados (PII mascarado)

### Dependências

- **Security**: Usa `mask_sensitive_fields_in_rows()`
- **Prompts**: Schema registry alimenta `system_prompt`

## Mascaramento de PII

### Campos Detectados

```python
PII_PATTERNS = {
    "email": r".+@.+",
    "telefone": r"\(\d{2}\)\s?\d{4,5}-\d{4}",
    "cpf": r"\d{3}\.\d{3}\.\d{3}-\d{2}",
    "senha": r".*",  # Sempre redact
    "data_nascimento": r"\d{4}-\d{2}-\d{2}",
    "cartao_credito": r"\d{16}",
}
```

### Estratégia

| Tipo | Ação |
|------|------|
| Email | Redact primeira metade: `aaa...@bbb.com` |
| Telefone | Redact número: `(XX) XXXX-XXXX` |
| CPF | Redact: `XXX.XXX.XXX-XX` |
| Senha | Redact: `[REDACTED]` |
| Data nascimento | Remover completamente ou redact: `XXXX-XX-XX` |

## Validações e Regras

| Validação | Executor | Ação |
|-----------|----------|------|
| SQL válido | `SQLValidator` | Fora deste módulo |
| Conexão disponível | `get_connection()` | Raise exception |
| Timeout | `QueryExecutor` | Raise exception |
| Resultado vazio | Não é erro | Retorna `[]` |
| PII detectado | `mask_sensitive_fields()` | Redact/remove |

## Observabilidade

### Logs

```python
# Em connection.py
logger.info(f"[database] Conexão SQLite: {db_path}")
logger.info(f"[database] Conexão PostgreSQL: {host}:{port}/{db}")

# Em executor.py
logger.debug(f"[executor] Tipo de conexão detectado: {db_type}")
logger.debug(f"[executor] SQL traduzido (SQLite): {sql_translated[:100]}")
logger.info(f"[executor] Executado em {time:.2f}s, {row_count} linhas")
logger.warning(f"[executor] PII mascarado em colunas: {masked_columns}")

# Em translator.py
logger.debug(f"[translator] Conversão: {original} → {translated}")
```

### Métricas

- `database.connection_type` (Gauge) → "sqlite" ou "postgresql"
- `database.query_execution_time` (Histogram) em ms
- `database.rows_returned` (Histogram)
- `database.pii_fields_masked` (Counter)
- `database.translation_errors` (Counter)

## Limitações e Problemas Conhecidos

### 1. SQLite Limitações de Tipo

- **Problema**: SQLite não tem tipos reais; tudo é TEXT/INTEGER/REAL
- **Impacto**: Operações de data podem falhar
- **Mitigação**: Usar `strftime()` consistentemente

### 2. Diferenças de Função

- **Problema**: PostgreSQL tem `1000+` funções, SQLite tem `~50`
- **Impacto**: SQL válido em PostgreSQL pode não traduzir
- **Mitigação**: Limitar schema injection a funções compatíveis

### 3. Performance SQLite

- **Problema**: SQLite é single-writer, não otimizado para queries complexas
- **Impacto**: Timeouts em queries com muitos JOINs
- **Mitigação**: Usar PostgreSQL em produção, SQLite apenas para dev/test

### 4. Schema Registry Manual

- **Problema**: Schema é mantido manualmente em código Python
- **Impacto**: Fácil ficar desincronizado com banco real
- **Mitigação**: Gerar schema dinamicamente do banco (introspection)

### 5. Tradução Incomplete

- **Problema**: Nem todas as queries PostgreSQL conseguem ser traduzidas
- **Impacto**: Query pode falhar em SQLite mesmo que válida em PostgreSQL
- **Mitigação**: Usar conversão apenas para queries simples, desabilitar para complexas

## Extensões Futuras

### 1. Connection Pooling

```python
class PooledConnectionFactory:
    def __init__(self, pool_size: int = 10):
        self.pool = asyncpg.create_pool(
            dsn=dsn,
            min_size=pool_size // 2,
            max_size=pool_size,
        )
```

### 2. Query Caching

```python
class CachedQueryExecutor(QueryExecutor):
    def __init__(self, ttl_seconds: int = 3600):
        self.cache = {}  # {sql_hash: (result, timestamp)}
    
    async def execute(self, conn, sql):
        cache_key = hash(sql)
        if cache_key in self.cache:
            result, ts = self.cache[cache_key]
            if time.time() - ts < self.ttl:
                return result
        
        result = await super().execute(conn, sql)
        self.cache[cache_key] = (result, time.time())
        return result
```

### 3. Dynamic Schema Introspection

```python
class DynamicSchemaRegistry(SchemaRegistry):
    """Gera schema a partir do banco em tempo de execução."""
    
    async def introspect(self, conn) -> Dict:
        # SELECT table_name, column_name, data_type FROM information_schema...
        # Builds schema dynamically
```

### 4. Query Result Streaming

```python
async def execute_streaming(self, conn, sql):
    """Retorna async generator em vez de lista completa."""
    async for row in conn.cursor(sql):
        yield dict(row)
```

### 5. Audit Logging

```python
class AuditedQueryExecutor(QueryExecutor):
    async def execute(self, conn, sql):
        audit_log(
            timestamp=now(),
            query_hash=hash(sql),
            rows_affected=len(result),
            execution_time=time,
        )
        return result
```

## Referências de Código

| Arquivo | Responsabilidade | LOC |
|---------|-----------------|-----|
| `connection.py` | Factory de conexões | ~30 |
| `executor.py` | Executor multi-dialeto | ~70 |
| `translator.py` | Tradução PostgreSQL → SQLite | ~150 |
| `schema_registry.py` | Schema Gold com metadatas | ~400 |
| `mock_gold.py` | Dados de mock SQLite | ~150 |
| `pii_mask.py` | Mascaramento de dados sensíveis | ~100 |

## Glossário

| Termo | Definição |
|-------|-----------|
| **Gold Schema** | Tabelas agregadas e curadas para consumo analítico |
| **Dialeto** | Variante de SQL (PostgreSQL, SQLite, etc.) |
| **Translator** | Componente que converte SQL entre dialetos |
| **Schema Registry** | Registro centralizado de metadatas de tabelas |
| **PII** | Personally Identifiable Information (dados sensíveis) |
| **Mock Database** | Banco SQLite com dados fake para testes |
| **Query Executor** | Componente que executa SQL validado |

---

**Versão**: 1.0  
**Última Atualização**: Mai 2026  
**Autor**: Equipe de Engenharia NL2SQL  
**Status**: Produção
