# Módulo de API REST (API)

## Visão Geral

O módulo **API** fornece a interface HTTP/REST para o agente NL2SQL, permitindo que clientes externos (web frontend, mobile, ferramentas) façam perguntas e recebam respostas estruturadas.

Implementa:
- **Endpoints REST** com FastAPI (async)
- **Gerenciamento de dependências** (injeção de dependências FastAPI)
- **Rotas de questões** com suporte a múltiplos turnos
- **Verificação de saúde** para monitoring
- **Contexto conversacional** automaticamente recuperado e reutilizado

## Responsabilidades

### 1. Exposição de Endpoints HTTP

- **`GET /health`**: Verifica se API está respondendo
- **`POST /ask`**: Recebe pergunta e retorna resposta estruturada
- **CORS**: Configurável para aceitar requisições cross-origin
- **Documentação**: Swagger/OpenAPI gerado automaticamente

### 2. Gerenciamento de Dependências

- **Injeção de dependências FastAPI**: Orquestrador, conversation store, executores
- **Lazy loading**: Componentes criados sob demanda
- **Singleton pattern**: Instâncias reutilizadas entre requisições

### 3. Recuperação de Contexto Conversacional

- **Conversation ID**: Identificador único da conversa (cliente fornece ou API gera)
- **Tenant isolation**: Cada tenant tem conversas isoladas
- **Histórico de turnos**: Recupera turnos anteriores do store em memória
- **Enrichment**: Injeta contexto anterior na pergunta automaticamente

### 4. Serialização de Requisições/Respostas

- **Request validation**: Pydantic valida `AskRequest`
- **Response formatting**: Retorna `AskResponse` com toda informação estruturada
- **Error handling**: Status HTTP apropriados para cada tipo de erro

## Arquitetura Interna

### Componentes

#### 1. `app.py` - Factory da Aplicação

```python
def create_app() -> FastAPI:
    """Cria e configura a aplicação FastAPI."""
    api = FastAPI(
        title="V-Commerce AI Agent",
        version="0.1.0",
    )
    api.include_router(router)
    return api

app = create_app()  # Instância global
```

**Configurações**:
- Title: Identificação da API
- Version: Versionamento semântico
- Docs: Swagger em `/docs`, ReDoc em `/redoc`

#### 2. `dependencies.py` - Injeção de Dependências

```python
@lru_cache(maxsize=1)
def get_orchestrator() -> AgentOrchestrator:
    """Cria e cachea o orquestrador (singleton)."""
    return AgentOrchestrator()

@lru_cache(maxsize=1)
def get_conversation_store() -> InMemoryConversationStore:
    """Cria e cachea o store (singleton)."""
    return InMemoryConversationStore()

def deps_from_request(request: AskRequest, conn=None) -> Deps:
    """Constrói Deps para passar ao orquestrador."""
    return Deps(
        conn=conn,
        conversation_id=request.conversation_id,
        user_id=request.user_id,
        tenant_id=request.tenant_id,
    )
```

#### 3. `routes.py` - Endpoints HTTP

```python
router = APIRouter()

@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Responde com status de saúde."""

@router.post("/ask", response_model=AskResponse)
async def ask(
    request: AskRequest,
    orchestrator: AgentOrchestrator = Depends(get_orchestrator),
    conversation_store: InMemoryConversationStore = Depends(get_conversation_store),
) -> AskResponse:
    """Processa pergunta e retorna resposta com contexto."""
```

## Fluxo de Requisição

```
Cliente HTTP
    ↓
POST /ask
{
  "conversation_id": "abc-123",
  "user_id": "user@example.com",
  "tenant_id": "acme-corp",
  "question": "Quais produtos venderam mais?",
  "execute": true
}
    ↓
FastAPI valida AskRequest com Pydantic
    ↓
Dependency injection resolve:
    ├─ get_orchestrator() → AgentOrchestrator (cached)
    └─ get_conversation_store() → InMemoryConversationStore (cached)
    ↓
ask() handler:
    ├─ Gera conversation_id se não fornecido
    ├─ Recupera previous_turns do store
    ├─ Abre conexão SQLite (se execute=true)
    ├─ build_question_with_memory_and_context()
    │  └─ Injeta histórico + contexto estruturado
    ├─ Cria Deps com conexão e IDs
    ├─ Chama orchestrator.ask(pergunta_enriquecida, deps)
    ├─ Appends resultado ao store
    ├─ Fecha conexão
    └─ Retorna AskResponse
    ↓
AskResponse.from_orchestrator(result, conversation_id)
    ├─ Estrutura resultado do orquestrador
    ├─ Inclui conversation_id para rastreamento
    └─ Serializa para JSON
    ↓
FastAPI retorna HTTP 200 OK
{
  "conversation_id": "abc-123",
  "explanation": "Os 3 produtos mais vendidos...",
  "sql": "SELECT ... LIMIT 3",
  "interpretation": "Top 3 produtos por volume",
  "reasoning": ["Pergunta...", "Schema tem..."],
  "assumptions": ["Período: últimos 30 dias"],
  "error": null,
  "error_kind": null
}
```

## Modelos de Dados

### AskRequest

```python
@dataclass
class AskRequest:
    question: str                           # Pergunta obrigatória
    conversation_id: str | None = None      # Gera UUID se não fornecido
    user_id: str | None = None              # Identificar usuário
    tenant_id: str | None = None            # Identificar cliente/organização
    execute: bool = True                    # Executar SQL ou apenas gerar?
```

### AskResponse

```python
@dataclass
class AskResponse:
    conversation_id: str                    # ID da conversa
    explanation: str                        # Resposta em linguagem natural
    sql: str | None                        # SQL gerado
    interpretation: str                    # Resumo da interpretação
    reasoning: list[str]                   # Passos de raciocínio
    assumptions: list[str]                 # Premissas
    error: str | None                      # Mensagem de erro
    error_kind: str | None                 # Categoria de erro
    
    @classmethod
    def from_orchestrator(
        cls,
        result: OrchestratorResult,
        conversation_id: str,
    ) -> "AskResponse":
        """Converte OrchestratorResult em AskResponse."""
```

### HealthResponse

```python
@dataclass
class HealthResponse:
    status: str = "healthy"
    timestamp: str = field(default_factory=datetime.now.isoformat)
```

## Integração com Outros Módulos

### Entrada

- **De**: Cliente HTTP
- **O que**: `AskRequest` com pergunta, IDs de conversa/usuário/tenant

### Saída

- **Para**: Cliente HTTP
- **O que**: `AskResponse` com resposta, SQL, metadados

### Internamente

- **Orquestrador**: Executa lógica principal
- **Conversation Store**: Recupera/persiste histórico
- **Database**: Abre conexão para execução opcional
- **Memory**: Injeta contexto anterior na pergunta

## Fluxo de Contexto Conversacional

### Turno 1: Pergunta Inicial

```
POST /ask
{
  "question": "Quais os 2 produtos mais vendidos?"
  // conversation_id: None
}

→ API gera conversation_id = "uuid-1"
→ previous_turns = [] (vazio)
→ question_final = "Quais os 2 produtos mais vendidos?"
→ Executa no orchestrator
→ Append ao store:
  {
    conversation_id: "uuid-1",
    tenant_id: None,
    user_id: None,
    question: "...",
    sql: "SELECT ... LIMIT 2",
    result: {...}
  }
```

### Turno 2: Follow-up com Contexto

```
POST /ask
{
  "conversation_id": "uuid-1",
  "question": "Qual desses vendeu mais em janeiro?"
}

→ Recupera previous_turns:
  [
    ConversationTurn(
      question="Quais os 2 produtos...",
      sql="SELECT id_produto, nome FROM ... LIMIT 2",
      ...
    )
  ]
→ build_question_with_memory_and_context():
  ├─ Extract entities do SQL anterior
  │  └─ Executa SQL, pega IDs = ["1", "2"]
  ├─ Detecta padrão "desses"
  ├─ Monta instrução crítica:
  │  WHERE id_produto IN ('1', '2')
  └─ Retorna pergunta enriquecida
→ Executa no orchestrator com contexto
→ Append ao store
```

## Segurança

### 1. Validação de Input

- **Pydantic**: Valida tipos e estrutura de `AskRequest`
- **Comprimento máximo**: `question` limitado a N caracteres
- **Sanitização**: Remove null bytes e caracteres inválidos

### 2. Isolamento de Dados

- **Conversation Key**: conversation_id + tenant_id + user_id
- **Multi-tenant**: Cada tenant vê apenas suas conversas
- **Sem exposição de dados**: Apenas `explanation` é retornada

### 3. Rate Limiting

(Implementação futura)

```python
# Adicionar middleware de rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_user_id)
@limiter.limit("100/minute")
async def ask(...):
```

### 4. Autenticação

(Implementação futura)

```python
from fastapi.security import HTTPBearer
security = HTTPBearer()
async def ask(
    ...,
    credentials: HTTPAuthCredentials = Depends(security),
):
    token = credentials.credentials
    user = verify_token(token)
```

## Observabilidade

### Logs

```python
# Em routes.py
logger.info(f"[api] POST /ask: conversation_id={conversation_id}")
logger.info(f"[api] Pergunta: {question[:50]}")
logger.debug(f"[api] Contexto anterior: {len(previous_turns)} turnos")
logger.info(f"[api] Response: error_kind={error_kind}")
logger.error(f"[api] Erro não esperado: {exception}")
```

### Métricas

- `api.requests_total` (Counter) por endpoint
- `api.request_duration` (Histogram) em ms
- `api.errors_total` (Counter) por error_kind
- `api.conversations_active` (Gauge)
- `api.turns_per_conversation` (Histogram)

### Tracing

```python
from opentelemetry import trace
tracer = trace.get_tracer(__name__)

@router.post("/ask")
async def ask(...):
    with tracer.start_as_current_span("api.ask") as span:
        span.set_attribute("conversation_id", conversation_id)
        span.set_attribute("user_id", user_id)
        span.set_attribute("question_length", len(question))
        result = await orchestrator.ask(...)
        span.set_attribute("error_kind", result.error_kind)
```

## Tratamento de Erros

| Erro | Status HTTP | Response |
|------|-----------|----------|
| Pergunta válida, SQL gerado | 200 OK | AskResponse com `explanation` |
| Pergunta viola policy | 400 Bad Request | AskResponse com `error_kind=policy` |
| LLM falha em gerar SQL | 422 Unprocessable | AskResponse com `error_kind=agent` |
| SQL inválido | 422 Unprocessable | AskResponse com `error_kind=sql_validation` |
| Erro de execução no banco | 500 Internal Server | AskResponse com `error_kind=sql_execution` |
| Erro não esperado | 500 Internal Server | Generic error response |

## Extensões Futuras

### 1. Websocket para Streaming

```python
@router.websocket("/ws/ask")
async def websocket_ask(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_json()
        # Stream results incrementally
        async for token in orchestrator.ask_streaming(data):
            await websocket.send_json(token)
```

### 2. Batch Processing

```python
@router.post("/ask-batch")
async def ask_batch(
    requests: list[AskRequest],
) -> list[AskResponse]:
    """Processa múltiplas perguntas em paralelo."""
    results = await asyncio.gather(
        *[ask(req, ...) for req in requests]
    )
    return results
```

### 3. Async File Upload

```python
@router.post("/ask-with-context")
async def ask_with_context(
    question: str = Form(...),
    file: UploadFile = File(...),
):
    """Processa pergunta com arquivo de contexto."""
    content = await file.read()
    # Parse context from file
    result = await orchestrator.ask(question, with_context=content)
```

### 4. Versioning de API

```python
# v1 endpoints
v1_router = APIRouter(prefix="/v1", tags=["v1"])
@v1_router.post("/ask")
async def ask_v1(...): ...

# v2 endpoints com melhorias
v2_router = APIRouter(prefix="/v2", tags=["v2"])
@v2_router.post("/ask")
async def ask_v2(...): ...

app.include_router(v1_router)
app.include_router(v2_router)
```

### 5. GraphQL Endpoint

```python
from strawberry.asgi import GraphQL
from graphql_schema import schema

graphql_app = GraphQL(schema)
app.add_route("/graphql", graphql_app, methods=["GET", "POST"])
```

## Referências de Código

| Arquivo | Responsabilidade | LOC |
|---------|-----------------|-----|
| `app.py` | Factory FastAPI | ~20 |
| `routes.py` | Endpoints HTTP | ~80 |
| `dependencies.py` | Injeção de dependências | ~60 |

## Glossário

| Termo | Definição |
|-------|-----------|
| **Endpoint** | Rota HTTP que responde a requisições |
| **Dependency Injection** | Padrão FastAPI de fornecer dependências a handlers |
| **Conversation ID** | Identificador único para rastrear múltiplos turnos |
| **Tenant** | Organização/cliente em ambiente multi-tenant |
| **AskRequest** | Estrutura de entrada validada por Pydantic |
| **AskResponse** | Estrutura de saída com resposta completa |

---

**Versão**: 1.0  
**Última Atualização**: Mai 2026  
**Autor**: Equipe de Engenharia NL2SQL  
**Status**: Produção
