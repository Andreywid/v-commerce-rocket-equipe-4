# Módulo CLI (Command Line Interface)

## Visão Geral

O módulo **CLI** fornece interface de linha de comando para o agente NL2SQL, permitindo usuários e engenheiros:

- **Fazer perguntas individuais**: Mode pergunta-resposta rápida
- **Chat conversacional**: Modo interativo com múltiplos turnos
- **Subir API**: Iniciar servidor FastAPI
- **Inspeção**: Verificar schema, validar prompts, debug
- **Testes**: Executar testes de smoke, validar setup

Implementado com `argparse` + `asyncio` para suportar modo síncrono (CLI) e assíncrono (API, chat).

## Responsabilidades

### 1. Parsing de Argumentos

- **Argumentos de entrada**: pergunta, modo (ask/chat/api), debug flags
- **Configurações de contexto**: user_id, tenant_id, roles, allowed_tables
- **Validação de segurança**: allowed_columns, PII policy
- **Flags de execução**: --no-execute, --debug-memory, --debug-sql

### 2. Roteamento de Modos

- **`ask` mode**: Pergunta única e sai
- **`chat` mode**: Terminal interativo com histórico
- **`api` mode**: Inicia servidor Uvicorn
- **`inspect` mode**: Inspeciona schema, valida prompts
- **`test` mode**: Smoke tests e validação

### 3. Contexto de Execução

- **Armazenamento de estado**: Conversa, user, tenant, roles
- **Configurações de segurança**: Tabelas/colunas permitidas, PII policy
- **Flags de debug**: Memory, SQL, prompts
- **Configurações de resultado**: Limite de linhas, formato

### 4. Renderização de Resultados

- **Formatação de SQL**: Syntax highlighting, indentação
- **Formatação de resposta**: Markdown, cores, paginação
- **Metadados**: Tempo de execução, complexidade
- **Erros**: Stack trace condicional (debug mode)

## Arquitetura Interna

### Estrutura de Arquivos

```
app/cli/
├── args.py                 # Argument parser e roteamento
├── runner.py               # Funções executáveis (ask, chat, api)
├── context.py              # Contexto de execução
├── render.py               # Renderização de saída
├── inspect.py              # Inspeção de schema e prompts
├── mock.py                 # Setup de mock SQLite
└── __init__.py
```

### Componentes

#### 1. `args.py` - Argument Parser

```python
def parse_args() -> argparse.Namespace:
    """Parse arguments and route to appropriate handler."""
    
    parser = argparse.ArgumentParser(
        prog="ai-agent",
        description="V-Commerce AI Agent NL2SQL",
    )
    
    subparsers = parser.add_subparsers(dest="command")
    
    # ask: pergunta única
    ask_parser = subparsers.add_parser("ask", help="Faz uma pergunta única")
    ask_parser.add_argument("question", help="Pergunta em linguagem natural")
    ask_parser.add_argument("--user-id", help="ID do usuário")
    ask_parser.add_argument("--tenant-id", help="ID do tenant")
    ask_parser.add_argument("--no-execute", action="store_true", help="Gera SQL mas não executa")
    
    # chat: modo conversacional
    chat_parser = subparsers.add_parser("chat", help="Inicia chat interativo")
    chat_parser.add_argument("--user-id", help="ID do usuário")
    chat_parser.add_argument("--tenant-id", help="ID do tenant")
    
    # api: inicia servidor
    api_parser = subparsers.add_parser("api", help="Inicia API FastAPI")
    api_parser.add_argument("--host", default="0.0.0.0", help="Host")
    api_parser.add_argument("--port", type=int, default=8000, help="Port")
    api_parser.add_argument("--reload", action="store_true", help="Reload on change")
    
    # inspect: inspeciona schema
    inspect_parser = subparsers.add_parser("inspect", help="Inspeciona schema")
    inspect_parser.add_argument("--schema-info", action="store_true")
    
    return parser.parse_args()
```

**Modos principais**:

```
ai-agent ask "Quais produtos venderam mais?"
ai-agent chat
ai-agent api --port 8001 --reload
ai-agent inspect --schema-info
```

#### 2. `runner.py` - Funções Executáveis

```python
async def run_orchestrator_text_to_sql(
    question: str,
    context: CliRunContext,
) -> None:
    """Modo: pergunta única."""
    
    orchestrator = AgentOrchestrator(debug=context.debug)
    # 1. Abre conexão (se execute=True)
    # 2. Recupera histórico (se conversation_id fornecido)
    # 3. Injeta memória
    # 4. Executa orchestrator
    # 5. Persiste turno
    # 6. Renderiza resultado
    

async def run_terminal_chat(context: CliRunContext) -> None:
    """Modo: chat interativo (REPL)."""
    
    orchestrator = AgentOrchestrator(debug=context.debug)
    store = get_default_conversation_store()
    conversation_id = store.new_conversation_id()
    
    while True:
        question = input(">>> ")
        if question.strip() == "exit":
            break
        
        # Mesma lógica do ask mode
        result = await _ask_with_memory(
            orchestrator=orchestrator,
            question=question,
            context=context,
            conn=conn,
        )
        
        print_agent_response(result)


def run_api_server(
    *,
    host: str,
    port: int,
    reload: bool,
) -> None:
    """Modo: API."""
    
    import uvicorn
    uvicorn.run(
        "app.api.app:app",
        host=host,
        port=port,
        reload=reload,
    )
```

**Fluxo do Ask Mode**:

```
run_orchestrator_text_to_sql(question, context)
    ↓
[1] Abre conexão
    └─ SQLite (mock) se não --no-execute
    ↓
[2] Recupera histórico
    └─ store.list_turns(conversation_id, tenant_id, user_id)
    ↓
[3] Injeta memória
    └─ build_question_with_memory_and_context(question, previous_turns, conn)
    ↓
[4] Executa orquestrador
    └─ await orchestrator.ask(pergunta_enriquecida, deps)
    ↓
[5] Persiste turno
    └─ store.append_result(conversation_id, ...)
    ↓
[6] Renderiza
    └─ print_agent_response(result)
```

#### 3. `context.py` - Contexto de Execução

```python
@dataclass
class CliRunContext:
    """Encapsula estado de execução da CLI."""
    
    user_id: str | None = None
    tenant_id: str | None = None
    roles: set[str] = field(default_factory=set)
    allowed_tables: set[str] | None = None
    allowed_columns: dict[str, frozenset[str]] | None = None
    allow_all_schema_access: bool = False
    allow_sensitive_pii: bool = False
    require_tenant: bool = False
    
    debug: bool = False
    debug_memory: bool = False
    debug_sql: bool = False
    
    conversation_id: str | None = None
    execute_sql: bool = True
```

**Uso**:

```python
context = CliRunContext(
    user_id="alice@example.com",
    tenant_id="acme-corp",
    debug=True,
    execute_sql=False,  # --no-execute
)
```

#### 4. `render.py` - Renderização de Saída

```python
def print_agent_response(result: CliAskResult) -> None:
    """Formata e imprime resposta do agente."""
    
    # Cabeçalho com status
    status = "✓ SUCCESS" if result.error is None else "✗ ERROR"
    print(f"\n{status}")
    
    # Explicação (principal)
    print("\n📝 RESPOSTA:")
    print(result.explanation)
    
    # SQL (se sucesso)
    if result.sql:
        print("\n💾 SQL EXECUTADO:")
        print_syntax_highlighted_sql(result.sql)
    
    # Metadados
    print("\n📊 METADADOS:")
    print(f"Interpretação: {result.interpretation}")
    print(f"Raciocínio: {' → '.join(result.reasoning)}")
    print(f"Tempo: {result.execution_time_ms:.2f}ms")
    
    # Erro (se falha)
    if result.error:
        print(f"\n❌ ERRO: {result.error_kind}")
        print(result.error)


def print_syntax_highlighted_sql(sql: str) -> None:
    """Formata SQL com cores e indentação."""
    
    from pygments import highlight
    from pygments.lexers import SqlLexer
    from pygments.formatters import TerminalFormatter
    
    highlighted = highlight(sql, SqlLexer(), TerminalFormatter())
    print(highlighted)
```

#### 5. `inspect.py` - Inspeção de Schema

```python
def run_schema_info() -> None:
    """Imprime info sobre schema Gold disponível."""
    
    from app.database.schema_registry import GOLD_SCHEMA
    
    print("# TABELAS GOLD DISPONÍVEIS\n")
    
    for table_name, table_def in GOLD_SCHEMA.items():
        print(f"## {table_name}")
        print(f"Descrição: {table_def['descricao']}")
        print(f"Granularidade: {table_def['granularidade']}")
        print(f"Colunas: {len(table_def['colunas'])}")
        print()


def run_dry_prompt(question: str, context: CliRunContext) -> None:
    """Imprime o prompt que seria enviado ao LLM sem executar."""
    
    from app.database.schema_registry import get_schema_prompt
    from app.prompts.sql_prompt_builder import build_prompt
    from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
    
    schema = get_schema_prompt()
    examples = [e for e in SQL_EXAMPLES if "DATE_TRUNC" not in e][:2]
    
    prompt = build_prompt(
        question=question,
        schema=schema,
        examples=examples,
        values=VALUE_EXAMPLES,
        current_date=datetime.now(),
        dialect="sqlite",
    )
    
    print("# PROMPT QUE SERIA ENVIADO AO LLM\n")
    print(prompt)
    print(f"\n# TOTAL: {len(prompt)} caracteres")
```

#### 6. `mock.py` - Setup de Mock

```python
def ensure_mock_sqlite() -> Path:
    """Garante que SQLite mock existe com dados."""
    
    from app.database.mock_gold import ensure_mock_sqlite
    return ensure_mock_sqlite()


def run_mock_sqlite_smoke() -> None:
    """Testa se mock SQLite funciona."""
    
    path = ensure_mock_sqlite()
    
    import sqlite3
    conn = sqlite3.connect(path)
    
    # Testa queries simples
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM gold_vendas_kpis")
    count = cursor.fetchone()[0]
    
    print(f"✓ Mock SQLite OK: {count} linhas em gold_vendas_kpis")
    conn.close()
```

## Fluxos de Execução

### Modo Ask (Pergunta Única)

```
$ ai-agent ask "Quais produtos venderam mais?"
    ↓
run_orchestrator_text_to_sql(question, context)
    ├─ Abre SQLite mock
    ├─ Recupera histórico (vazio, primeira pergunta)
    ├─ Executa orquestrador
    └─ Renderiza resultado
    ↓
✓ SUCCESS
📝 RESPOSTA: Os 3 produtos mais vendidos foram...
💾 SQL: SELECT ... LIMIT 3
```

### Modo Chat (Interativo)

```
$ ai-agent chat
>>> Quais produtos venderam mais?
✓ SUCCESS
📝 RESPOSTA: ...

>>> Qual desses vendeu mais em janeiro?
✓ SUCCESS
📝 RESPOSTA: ... (usa contexto da pergunta anterior)

>>> exit
Goodbye!
```

### Modo API (Servidor)

```
$ ai-agent api --port 8000 --reload
INFO:     Application startup complete
Uvicorn running on http://0.0.0.0:8000

# Em outro terminal:
$ curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Quais produtos..."}'
```

### Modo Inspect (Schema)

```
$ ai-agent inspect --schema-info

# TABELAS GOLD DISPONÍVEIS

## gold_vendas_kpis
Descrição: Tabela agregada com KPIs de vendas mensais
Granularidade: Uma linha por mês
Colunas: 18

## gold_cliente_360
Descrição: Visão consolidada por cliente
Granularidade: Uma linha por cliente
Colunas: 25

...
```

## Argumentos e Flags

### Globais

| Flag | Tipo | Descrição |
|------|------|-----------|
| `--user-id` | str | ID do usuário |
| `--tenant-id` | str | ID do tenant |
| `--debug` | bool | Modo debug (logs verbosos) |
| `--debug-memory` | bool | Debug contexto conversacional |
| `--debug-sql` | bool | Debug SQL gerado |

### Ask Mode

| Flag | Tipo | Descrição |
|------|------|-----------|
| `question` | str | Pergunta obrigatória (positional) |
| `--no-execute` | bool | Gera SQL mas não executa |
| `--conversation-id` | str | ID da conversa (para histórico) |

### API Mode

| Flag | Tipo | Descrição |
|------|------|-----------|
| `--host` | str | Host (padrão: 0.0.0.0) |
| `--port` | int | Port (padrão: 8000) |
| `--reload` | bool | Reload on code change |

### Inspect Mode

| Flag | Tipo | Descrição |
|------|------|-----------|
| `--schema-info` | bool | Imprime schema disponível |
| `--dry-prompt` | str | Imprime prompt sem executar |

## Segurança

### Políticas de Acesso

```python
# Limitar a tabelas específicas
context = CliRunContext(
    allowed_tables={"gold_vendas_kpis", "gold_cliente_360"},
)

# Limitar colunas por tabela
context = CliRunContext(
    allowed_columns={
        "gold_cliente_360": frozenset(["id_cliente", "nome", "email"]),
    }
)

# Permitir PII no resultado (padrão: mascarado)
context = CliRunContext(
    allow_sensitive_pii=False,  # Mascarar email, telefone, etc.
)

# Requerer tenant (multi-tenant)
context = CliRunContext(
    require_tenant=True,
    tenant_id="acme-corp",
)
```

## Observabilidade

### Logs

```
[INFO] CLI started with mode: ask
[DEBUG] Context: user_id=alice, tenant_id=acme-corp, debug=True
[DEBUG] Question: "Quais produtos venderam mais?"
[DEBUG] Previous turns: 0
[INFO] Executing orchestrator...
[DEBUG] SQL generated: SELECT ... LIMIT 3
[DEBUG] Execution time: 234ms
[INFO] Result: SUCCESS, 3 rows returned
```

## Limitações

### 1. Chat Mode é Síncrono

- **Problema**: Input bloqueante, não suporta concorrência
- **Impacto**: Só um usuário por processo CLI
- **Mitigação**: Usar API para múltiplas conexões simultâneas

### 2. Sem Persistência de Conversas

- **Problema**: Histórico em memória, perdido ao sair da CLI
- **Impacto**: Novo comando `ask` começa sem histórico
- **Mitigação**: Usar API + database para persistência

### 3. Roteamento Manual

- **Problema**: `if command == 'ask'` em vários lugares
- **Impacto**: Difícil adicionar novos modos
- **Mitigação**: Usar plugin system ou decorator-based routing

## Extensões Futuras

### 1. Modo Batch

```bash
$ ai-agent batch questions.json
```

### 2. Modo Watch

```bash
$ ai-agent watch --interval 60 "Quais produtos venderam mais?"
# Executa pergunta a cada 60s
```

### 3. Modo Repl

```bash
$ ai-agent repl
> select COUNT(*) from gold_vendas_kpis
# Interpreta como SQL puro, não NL
```

### 4. Export Resultados

```bash
$ ai-agent ask "..." --export csv output.csv
$ ai-agent ask "..." --export json output.json
```

### 5. Integração com Jupyter

```python
from app.cli import AiAgentJupyterMagic

%load_ext app.cli

%ai "Quais produtos venderam mais?"
```

## Referências de Código

| Arquivo | Responsabilidade | LOC |
|---------|-----------------|-----|
| `args.py` | Argument parser | ~200 |
| `runner.py` | Funções executáveis | ~150 |
| `context.py` | Contexto de execução | ~50 |
| `render.py` | Renderização | ~100 |
| `inspect.py` | Inspeção | ~80 |
| `mock.py` | Setup mock | ~60 |

## Glossário

| Termo | Definição |
|-------|-----------|
| **Ask Mode** | Mode pergunta-resposta única |
| **Chat Mode** | Mode interativo com histórico |
| **REPL** | Read-Eval-Print Loop (shell interativa) |
| **Smoke Test** | Teste rápido para validar setup |
| **Debug Flag** | Flag que ativa logs e output detalhado |
| **Dry Run** | Executar sem efeitos (ex: gerar SQL sem executar) |

---

**Versão**: 1.0  
**Última Atualização**: Mai 2026  
**Autor**: Equipe de Engenharia NL2SQL  
**Status**: Produção
