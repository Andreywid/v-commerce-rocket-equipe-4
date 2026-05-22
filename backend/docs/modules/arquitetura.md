# Módulo de Arquitetura (Backend)

## Visão Geral

O backend é uma **API REST** construída com **FastAPI** em arquitetura de camadas estrita: Router → Service → Repository → Model → SQLite. Toda a comunicação entre camadas é tipada via schemas Pydantic. O servidor roda via **Uvicorn** (ASGI).

**Porta padrão:** `8000`
**URL base:** `http://127.0.0.1:8000/api/v1`
**Swagger UI:** `http://127.0.0.1:8000/docs`

## Responsabilidades

1. Expor endpoints RESTful paginados, filtráveis e autenticados para todas as entidades
2. Validar entradas via Pydantic v2 e retornar erros estruturados
3. Gerenciar autenticação JWT e controle de acesso por papel (RBAC)
4. Aplicar rate limiting no endpoint de login
5. Atuar como proxy/façade para o serviço externo AI Agent (`:8001`)
6. Carregar e servir dados do pipeline Gold (CSVs → SQLite)

## Arquitetura em Camadas

```
Cliente (Frontend)
       │  HTTP + JWT
       ▼
┌─────────────────────────────────────────────────────┐
│                  FastAPI app/main.py                │
│  ┌───────────────────────────────────────────────┐  │
│  │  Middleware: CORSMiddleware + SlowAPI         │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  Routers — app/api/v1/                        │  │
│  │  auth | dashboard | products | customers |    │  │
│  │  orders | support | reviews | clickstream |   │  │
│  │  agent                                        │  │
│  └──────────────────────┬────────────────────────┘  │
│           Depends(get_current_user / require_admin)  │
│  ┌──────────────────────▼────────────────────────┐  │
│  │  Services — app/services/                     │  │
│  │  Regras de negócio, validações, orquestração  │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │  Repositories — app/repositories/             │  │
│  │  Queries SQLAlchemy, filtros, paginação        │  │
│  └──────────────────────┬────────────────────────┘  │
│                         │                           │
│  ┌──────────────────────▼────────────────────────┐  │
│  │  Models — app/models/                         │  │
│  │  Mapeamento ORM SQLAlchemy ↔ tabelas SQLite   │  │
│  └──────────────────────┬────────────────────────┘  │
└─────────────────────────┼───────────────────────────┘
                          │  SQLAlchemy Session
              ┌───────────▼──────────┐
              │      SQLite          │
              │      vcommerce.db    │
              └──────────────────────┘
```

## Fluxo de uma Requisição Autenticada

```
POST /api/v1/products  (Authorization: Bearer <token>)
         │
         ▼
CORSMiddleware — verifica origem
         │
         ▼
Router products.py
         │
         ├── Depends(require_admin)
         │       ├── Depends(get_current_user)
         │       │       ├── HTTPBearer extrai token
         │       │       ├── decode_token(token) → payload
         │       │       ├── user_repository.get_by_id(db, user_id)
         │       │       └── retorna User ou 401
         │       └── verifica user.role == "admin" → 403 se não
         │
         ▼
product_service.create_product(body)
         │
         ▼
product_repository.create(data)
         │  gera ID PROD-XXXX, db.add, db.commit
         ▼
ProductOut (Pydantic) → JSON 201 Created
```

## Registro de Routers (`app/api/v1/router.py`)

```python
router.include_router(auth_router,        prefix="/auth",        tags=["auth"])
router.include_router(dashboard_router,   prefix="/dashboard",   tags=["dashboard"])
router.include_router(products_router,    prefix="/products",    tags=["products"])
router.include_router(customers_router,   prefix="/customers",   tags=["customers"])
router.include_router(orders_router,      prefix="/orders",      tags=["orders"])
router.include_router(support_router,     prefix="/support",     tags=["support"])
router.include_router(reviews_router,     prefix="/reviews",     tags=["reviews"])
router.include_router(clickstream_router, prefix="/clickstream", tags=["clickstream"])
router.include_router(agent_router,       prefix="/agent",       tags=["agent"])
```

## Configuração do `main.py`

```python
app = FastAPI(title="V-Commerce CRM 360 API")

# CORS
app.add_middleware(CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (SlowAPI)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Routers
app.include_router(api_router, prefix="/api/v1")
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [autenticacao.md](autenticacao.md) | ← usa | JWT, bcrypt, deps de injeção |
| [endpoints.md](endpoints.md) | ← usa | Todos os routers registrados |
| [repositorios.md](repositorios.md) | ← usa | Chamados pelos serviços |
| [servicos.md](servicos.md) | ← usa | Chamados pelos routers |
| [banco-de-dados.md](banco-de-dados.md) | ← usa | Engine, SessionLocal, get_db |
| [ai-agent.md](ai-agent.md) | ← usa | Proxy para o serviço externo |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/main.py` | Entry point FastAPI, CORS, rate limiter, mount de routers |
| `app/config.py` | Settings via pydantic-settings (lê `.env`) |
| `app/database.py` | Engine SQLAlchemy, SessionLocal, get_db() |
| `app/api/v1/router.py` | Registra todos os sub-routers |

## Glossário

| Termo | Significado |
|---|---|
| ASGI | Asynchronous Server Gateway Interface — protocolo de servidor async |
| CORS | Cross-Origin Resource Sharing — política de segurança de browser |
| Depends | Mecanismo de injeção de dependência do FastAPI |
| RBAC | Role-Based Access Control — controle de acesso por papel |
| ORM | Object-Relational Mapping — mapeamento Python ↔ tabelas SQL |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
