# V-Commerce CRM 360 — Documentação Técnica do Backend

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura em Camadas](#2-arquitetura-em-camadas)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Tecnologias e Dependências](#4-tecnologias-e-dependências)
5. [Configuração e Variáveis de Ambiente](#5-configuração-e-variáveis-de-ambiente)
6. [Banco de Dados](#6-banco-de-dados)
7. [Modelos SQLAlchemy](#7-modelos-sqlalchemy)
8. [Schemas Pydantic](#8-schemas-pydantic)
9. [Autenticação e Segurança](#9-autenticação-e-segurança)
10. [Referência de Endpoints](#10-referência-de-endpoints)
11. [Camada de Repositórios](#11-camada-de-repositórios)
12. [Camada de Serviços](#12-camada-de-serviços)
13. [Integração com o AI Agent](#13-integração-com-o-ai-agent)
14. [Tratamento de Erros](#14-tratamento-de-erros)
15. [Scripts Utilitários](#15-scripts-utilitários)
16. [Testes](#16-testes)
17. [Como Executar](#17-como-executar)

---

## 1. Visão Geral

O backend do V-Commerce CRM 360 é uma **API REST** construída com **FastAPI** e **Python**, com banco de dados **SQLite** e autenticação via **JWT**. Ele expõe os dados do pipeline Gold (carregados de CSVs) e os disponibiliza para o frontend através de endpoints RESTful paginados, filtráveis e protegidos por autenticação.

**Porta padrão:** `8000`
**URL base da API:** `http://127.0.0.1:8000/api/v1`
**Swagger UI:** `http://127.0.0.1:8000/docs`
**ReDoc:** `http://127.0.0.1:8000/redoc`

---

## 2. Arquitetura em Camadas

### Diagrama de camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTP + JWT
┌────────────────────────────▼────────────────────────────────────┐
│                  FastAPI — app/main.py                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Middleware: CORSMiddleware + SlowAPI (rate limiting)   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Rotas — app/api/v1/                                    │   │
│  │  auth | dashboard | products | customers | orders |     │   │
│  │  support | reviews | clickstream | agent                │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │ Depends(get_current_user)         │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  Services — app/services/                               │   │
│  │  Regras de negócio, validações, orquestração            │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  Repositories — app/repositories/                       │   │
│  │  Queries SQLAlchemy, filtros, paginação                 │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │  Models — app/models/                                   │   │
│  │  Mapeamento ORM SQLAlchemy ↔ Tabelas SQLite             │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │  SQLAlchemy Session
                    ┌─────────▼──────────┐
                    │   SQLite           │
                    │   vcommerce.db     │
                    └────────────────────┘
```

### Fluxo de uma requisição autenticada

```
POST /api/v1/products   (Authorization: Bearer <token>)
         │
         ▼
CORSMiddleware  →  verifica origem permitida
         │
         ▼
Router (products.py)
         │
         ├── Depends(require_admin)
         │       ├── Depends(get_current_user)
         │       │       ├── HTTPBearer extrai o token
         │       │       ├── decode_token(token) → payload
         │       │       ├── user_repository.get_by_id(db, user_id)
         │       │       └── retorna User ou levanta 401
         │       └── verifica user.role == "admin" → 403 se não
         │
         ▼
product_service.create_product(body)
         │
         ▼
product_repository.create(data_dict)
         │
         ├── gera ID no padrão PROD-XXXX
         ├── db.add(new_product)
         └── db.commit() + db.refresh()
         │
         ▼
ProductOut (Pydantic) → JSON response 201
```

### Fluxo do AI Agent (proxy)

```
POST /api/v1/agent/chat  { message, session_id }
         │
         ▼
agent.router  →  Depends(get_current_user)  →  agent.chat(message, session_id)
         │
         ▼
app/agent/agent.py::chat()
         │
         │  httpx.AsyncClient.post("/ask", json={
         │      "question": message,
         │      "execute": True,
         │      "allow_all_schema_access": True,
         │      "conversation_id": session_id  (se fornecido)
         │  })
         ▼
AI Agent :8001/ask  →  gera SQL  →  executa  →  retorna
{
  "explanation": "...",
  "sql": "SELECT ...",
  "rows": [...],
  "conversation_id": "uuid"
}
         │
         ▼
Normaliza para ChatResponse:
{
  "answer":     data["explanation"],
  "sql_used":   data["sql"],
  "data":       data["rows"],
  "session_id": data["conversation_id"]
}
```

---

## 3. Estrutura de Pastas

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py               # Entry point: FastAPI app, CORS, rate limiter, rotas
│   ├── config.py             # Settings via pydantic-settings (lê .env)
│   ├── database.py           # Engine, SessionLocal, Base, get_db()
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py     # Registra todos os sub-routers
│   │       ├── auth.py       # POST /auth/login, GET /auth/me
│   │       ├── dashboard.py  # GET /dashboard/kpis, /top-regioes, /top-categorias
│   │       ├── products.py   # CRUD /products + /performance + /avaliacoes
│   │       ├── customers.py  # CRUD /customers + /perfil-360 + sub-recursos
│   │       ├── orders.py     # CRUD /orders
│   │       ├── support.py    # CRUD /support
│   │       ├── reviews.py    # CRUD /reviews
│   │       ├── clickstream.py# CRUD /clickstream
│   │       └── agent.py      # POST /agent/chat, GET /agent/suggestions
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   ├── agent.py          # Façade HTTP → AI Agent (:8001/ask)
│   │   ├── tools.py          # (reservado para tools do agente)
│   │   └── prompts.py        # (reservado para prompts do agente)
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── deps.py           # get_current_user(), require_admin()
│   │   ├── security.py       # hash_password, verify_password, create_access_token, decode_token
│   │   └── limiter.py        # SlowAPI limiter (key_func=get_remote_address)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py           # User (tabela: users)
│   │   ├── product.py        # Product (tabela: gold_produto_performance)
│   │   ├── customer.py       # Customer (tabela: gold_cliente_360)
│   │   ├── order.py          # Order (tabela: gold_pedidos_enriquecidos)
│   │   ├── support_ticket.py # SupportTicket (tabela: gold_tickets)
│   │   ├── review.py         # Review (tabela: gold_avaliacoes)
│   │   ├── clickstream.py    # Clickstream (tabela: gold_clickstream_resumo)
│   │   └── dashboard_kpi.py  # DashboardKPI (tabela: gold_vendas_kpis)
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── product_repository.py
│   │   ├── customer_repository.py
│   │   ├── order_repository.py
│   │   ├── support_repository.py
│   │   ├── review_repository.py
│   │   ├── clickstream_repository.py
│   │   └── dashboard_repository.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py           # LoginRequest, TokenResponse, UserOut
│   │   ├── product.py        # ProductOut, ProductCreate, ProductUpdate, ProductPerformance, ProductListResponse
│   │   ├── customer.py       # CustomerOut, Customer360, CustomerCreate, CustomerUpdate, CustomerStats, CustomerListResponse
│   │   ├── order.py          # OrderOut, OrderCreate, OrderUpdate, OrderListResponse
│   │   ├── support_ticket.py # TicketOut, TicketCreate, TicketUpdate, TicketListResponse
│   │   ├── review.py         # ReviewOut, ReviewCreate, ReviewUpdate, ReviewListResponse
│   │   ├── clickstream.py    # ClickstreamOut, ClickstreamCreate, ClickstreamUpdate, ClickstreamListResponse
│   │   └── dashboard.py      # VendasKPIMes, KPIsResponse, TopRegiao, TopRegioesResponse, TopCategoria, TopCategoriasResponse
│   │
│   └── services/
│       ├── __init__.py
│       ├── auth_service.py
│       ├── product_service.py
│       ├── customer_service.py
│       ├── order_service.py
│       ├── support_service.py
│       ├── review_service.py
│       ├── clickstream_service.py
│       └── dashboard_service.py
│
├── seed.py                   # Cria o usuário admin inicial
├── load_gold_data.py         # Importa CSVs Gold para o SQLite
├── requirements.txt
├── .env.example
└── vcommerce.db              # Banco SQLite (gerado na primeira execução)
```

---

## 4. Tecnologias e Dependências

```
# requirements.txt

# Core
fastapi[standard]>=0.136.0   # FastAPI + uvicorn + python-multipart
sqlalchemy>=2.0.0             # ORM declarativo
pydantic>=2.9.0               # Validação de dados e schemas
pydantic-settings>=2.0.0      # Leitura de .env com type safety
python-dotenv>=1.0.0          # Carregamento do .env
httpx>=0.27.0                 # Cliente HTTP async (comunicação com AI Agent)

# Auth
python-jose[cryptography]>=3.3.0  # JWT: encode/decode com HS256
bcrypt>=4.0.0                     # Hash seguro de senhas

# Rate limiting
slowapi>=0.1.9               # Rate limiting baseado em limiter.py

# Testes
pytest>=8.0.0
pytest-asyncio>=0.24.0
```

| Tecnologia | Versão mínima | Função |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | 0.136 | Framework web ASGI |
| Uvicorn | — (via fastapi[standard]) | Servidor ASGI |
| SQLAlchemy | 2.0 | ORM e mapeamento de tabelas |
| Pydantic v2 | 2.9 | Validação e serialização |
| pydantic-settings | 2.0 | Configuração via .env |
| python-jose | 3.3 | JWT (HS256) |
| bcrypt | 4.0 | Hash de senhas |
| SlowAPI | 0.1.9 | Rate limiting por IP |
| httpx | 0.27 | HTTP async para proxy do AI Agent |
| pytest | 8.0 | Framework de testes |

---

## 5. Configuração e Variáveis de Ambiente

Arquivo: `backend/app/config.py`

```python
class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./vcommerce.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    ADMIN_EMAIL: str          # obrigatório (sem padrão)
    ADMIN_PASSWORD: str       # obrigatório (sem padrão)
    ADMIN_NAME: str = "Admin V-Commerce"
    AI_AGENT_URL: str = "http://localhost:8001"

    model_config = {"env_file": ".env", "extra": "ignore"}
```

### Arquivo `.env` (dentro de `backend/`)

```env
DATABASE_URL=sqlite:///./vcommerce.db
SECRET_KEY=dev-local-v-commerce-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173","http://localhost:5174","http://127.0.0.1:5174"]
ADMIN_EMAIL=admvcommerce@gmail.com
ADMIN_PASSWORD=senha123!@#
ADMIN_NAME=Admin V-Commerce
AI_AGENT_URL=http://localhost:8001
```

> Em produção: substitua `SECRET_KEY` por um valor seguro gerado aleatoriamente (≥32 chars). Rotacionar o `SECRET_KEY` invalida **todos** os tokens JWT emitidos anteriormente.

---

## 6. Banco de Dados

### Configuração (`database.py`)

```python
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # necessário para SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():          # dependency injection do FastAPI
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Tabelas e origens

| Tabela SQLite | Modelo Python | CSV de origem |
|---|---|---|
| `users` | `User` | `seed.py` (gerado em runtime) |
| `gold_produto_performance` | `Product` | `data/gold/gold_produto_performance.csv` |
| `gold_cliente_360` | `Customer` | `data/gold/gold_cliente_360.csv` |
| `gold_pedidos_enriquecidos` | `Order` | `data/gold/gold_pedidos_enriquecidos.csv` |
| `gold_tickets` | `SupportTicket` | `data/gold/gold_tickets.csv` |
| `gold_avaliacoes` | `Review` | `data/gold/gold_avaliacoes.csv` |
| `gold_clickstream_resumo` | `Clickstream` | `data/gold/gold_clickstream_resumo.csv` |
| `gold_vendas_kpis` | `DashboardKPI` | `data/gold/gold_vendas_kpis.csv` |

### Volume de dados

| Entidade | Registros |
|---|---|
| Produtos | 517 |
| Clientes | ~58.000 |
| Pedidos | ~284.000 |
| Tickets | ~34.000 |
| Avaliações | ~100.000 |
| Clickstream | ~100.000 |
| KPIs mensais | 41 |

### Inicialização do banco

```
seed.py         → cria tabela `users` e insere o admin
load_gold_data.py → lê os CSVs de data/gold/ e popula as 7 tabelas Gold
```

Se o banco for apagado, execute ambos na ordem acima para recriá-lo.

---

## 7. Modelos SQLAlchemy

### `User` (`users`)

```python
id              Integer  PK, index
email           String   unique, index, not null
hashed_password String   not null
name            String   not null
role            String   default="viewer"   # "admin" | "viewer"
is_active       Boolean  default=True
created_at      DateTime server_default=func.now()
```

### `Product` (`gold_produto_performance`)

```python
id_produto              String  PK, index
nome_produto            String  index
categoria               String
preco_atual             Float
ativo                   Boolean default=True
estoque                 Integer nullable
descricao               String  nullable
imagem_url              String  nullable
qtd_vendida_total       Integer default=0
qtd_vendida_30d         Integer default=0
qtd_vendida_90d         Integer default=0
receita_total           Float   default=0.0
receita_30d             Float   default=0.0
qtd_tickets_associados  Integer default=0
qtd_tickets_30d         Integer default=0
taxa_problema           Float   default=0.0
qtd_avaliacoes          Integer default=0
nota_media              Float   nullable
pct_recomendam          Float   nullable
qtd_visualizacoes       Integer default=0
qtd_carrinho            Integer default=0
taxa_conversao          Float   default=0.0
classificacao           String  nullable   # Top Vendedor | Estável | Problemático | Encalhado
data_referencia_calculo Date    nullable
```

### `Customer` (`gold_cliente_360`)

```python
id_cliente                  String  PK, index
nome                        String  index
email                       String  index
telefone                    String  nullable
data_cadastro               Date    nullable
cidade                      String  nullable
estado                      String(2) nullable
origem                      String  nullable   # App | Web | Indicacao
qtd_pedidos_total           Integer default=0
qtd_pedidos_aprovados       Integer default=0
qtd_pedidos_recusados       Integer default=0
qtd_pedidos_reembolsados    Integer default=0
qtd_pedidos_processando     Integer default=0
valor_total_gasto           Float   default=0.0
ticket_medio                Float   default=0.0
data_primeiro_pedido        Date    nullable
data_ultimo_pedido          Date    nullable
qtd_tickets_total           Integer default=0
qtd_tickets_abertos         Integer default=0
qtd_tickets_resolvidos      Integer default=0
qtd_avaliacoes              Integer default=0
nota_media_dada             Float   nullable
nps_medio_avaliacoes_cliente Float  nullable
qtd_eventos_clickstream     Integer default=0
canal_preferido             String  nullable   # Web | Mobile | App
segmento_ltv                String  nullable   # Alto | Medio | Baixo
is_ativo_90d                Boolean default=True
is_em_risco                 Boolean default=False
data_referencia_calculo     Date    nullable
```

### `Order` (`gold_pedidos_enriquecidos`)

```python
id_pedido        String  PK
id_cliente       String
id_produto       String
data_pedido      Date
quantidade       Integer
valor_unitario   Float
valor_total      Float
status           String   # Aprovado | Recusado | Reembolsado | Processando
metodo_pagamento String   # Cartao | PIX | Boleto | App
nome_cliente     String
estado_cliente   String   nullable
nome_produto     String
categoria_produto String
ano              Integer
mes              Integer
trimestre        Integer
```

### `SupportTicket` (`gold_tickets`)

```python
id_ticket               String  PK
id_cliente              String
id_pedido               String  nullable
id_produto              String  nullable
tipo_problema           String  # Entrega | Reembolso | Produto | Pagamento
satisfacao_atendimento  String  # alta | media | baixa | sem_avaliacao
data_abertura           Date
data_resolucao          Date    nullable
tempo_resolucao_horas   Float   nullable
agente_suporte          String
nota_avaliacao          Integer nullable
status_ticket           String  # Aberto | Resolvido
sla_estourado           Boolean default=False
nome_cliente            String
nome_produto            String  nullable
data_referencia_calculo Date    nullable
```

### `Review` (`gold_avaliacoes`)

```python
id_avaliacao     String  PK
id_cliente       String
id_pedido        String
id_produto       String
nota_produto     Integer nullable   # 1–5
nota_nps         Integer nullable   # 0–10
recomenda        Boolean
comentario       String  nullable
sentimento       String  nullable   # positivo | neutro | negativo
data_avaliacao   Date
nome_produto     String
categoria_produto String  nullable
nome_cliente     String
```

### `DashboardKPI` (`gold_vendas_kpis`)

```python
id                          Integer PK (auto)
ano                         Integer
mes                         Integer
ano_mes                     String   # "2025-01"
qtd_pedidos                 Integer
qtd_pedidos_aprovados       Integer
qtd_pedidos_recusados       Integer
qtd_pedidos_reembolsados    Integer
qtd_pedidos_processando     Integer
receita_bruta               Float
ticket_medio                Float
qtd_clientes_unicos         Integer
qtd_clientes_novos          Integer
taxa_aprovacao              Float
taxa_recusa                 Float
taxa_reembolso              Float
categoria_mais_vendida      String
estado_maior_receita        String
data_referencia_calculo     Date
```

---

## 8. Schemas Pydantic

### Padrão de resposta paginada

```python
# Não existe uma base class genérica — cada entidade define seu XxxListResponse:
class XxxListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[XxxOut]
    # campos extras opcionais por entidade:
    # CustomerListResponse: segmento_alto: int
    # OrderListResponse:    total_pendentes, total_aprovados, receita_total
```

### Convenções de validação

- **Datas flexíveis:** `TicketOut` e `ReviewOut` usam `@field_validator(..., mode="before")` para aceitar formatos ISO, `DD/MM/YYYY` e datetime com timezone.
- **EmailStr:** `CustomerCreate` e `CustomerUpdate` usam `pydantic.EmailStr` para validar e-mails.
- **Campos opcionais:** todos os campos de output que podem ser nulos no banco são `Optional[T] = None`.
- **from_attributes:** todos os schemas de output usam `model_config = {"from_attributes": True}` para compatibilidade com modelos SQLAlchemy.

### Visão consolidada dos schemas

| Schema | Campos principais |
|---|---|
| `ProductOut` | id_produto, nome_produto, categoria, preco_atual, ativo, qtd_vendida_total, receita_total, nota_media, classificacao |
| `ProductPerformance` | Herda ProductOut + métricas 30d/90d, taxa_problema, taxa_conversao, etc. |
| `ProductCreate` | nome_produto, categoria, preco_atual, ativo, estoque?, descricao?, imagem_url? |
| `CustomerOut` | id_cliente, nome, email, qtd_pedidos_total, valor_total_gasto, segmento_ltv, is_em_risco |
| `Customer360` | Herda CustomerOut + breakdown de pedidos/tickets, canal_preferido, nota_media_dada, nps |
| `CustomerCreate` | nome, email (EmailStr), telefone?, cidade?, estado?, origem? |
| `OrderOut` | id_pedido, data_pedido, quantidade, valor_total, status, metodo_pagamento, nome_cliente, nome_produto |
| `OrderCreate` | id_pedido, id_produto, data_pedido, quantidade, status, metodo_pagamento |
| `TicketOut` | id_ticket, tipo_problema, status_ticket, sla_estourado, data_abertura, agente_suporte, satisfacao_atendimento |
| `TicketCreate` | id_cliente, tipo_problema (Literal), agente_suporte, nome_cliente |
| `ReviewOut` | id_avaliacao, nota_produto, nota_nps, recomenda, sentimento, comentario |
| `ReviewCreate` | nota_produto (1–5), nota_nps (0–10), recomenda, sentimento? |

---

## 9. Autenticação e Segurança

### Visão geral do fluxo JWT

```
1. POST /auth/login  { email, password }
         │
         ▼
auth_service.login(db, email, password)
         │
         ├── user_repository.get_by_email(db, email)
         ├── verify_password(plain, user.hashed_password)  ← bcrypt.checkpw
         └── create_access_token({ "sub": str(user.id) })
                  │
                  ├── payload["exp"] = now + 480 minutos
                  └── jwt.encode(payload, SECRET_KEY, algorithm="HS256")
         │
         ▼
{ access_token: "<jwt>", token_type: "bearer", user: UserOut }

─────────────────────────────────────────────────────────────────

2. Qualquer rota protegida  Authorization: Bearer <token>
         │
         ▼
Depends(get_current_user)
         │
         ├── HTTPBearer extrai token do header
         ├── decode_token(token) → jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
         ├── user_id = int(payload["sub"])
         ├── user_repository.get_by_id(db, user_id)
         └── verifica user.is_active → retorna user ou 401
```

### Funções de segurança (`core/security.py`)

```python
hash_password(password: str) -> str
# bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

verify_password(plain: str, hashed: str) -> bool
# bcrypt.checkpw(plain.encode(), hashed.encode())

create_access_token(data: dict) -> str
# payload["exp"] = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
# jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

decode_token(token: str) -> dict
# jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
# Levanta JWTError se inválido ou expirado
```

### Dependências de injeção (`core/deps.py`)

```python
get_current_user(credentials, db) -> User
# Valida Bearer token e retorna o User autenticado.
# Levanta HTTP 401 se token inválido, expirado ou usuário inativo.

require_admin(current_user) -> User
# Verifica current_user.role == "admin"
# Levanta HTTP 403 se role != "admin"
```

### Rate limiting (`core/limiter.py`)

```python
limiter = Limiter(key_func=get_remote_address)
# Aplicado globalmente ao app em main.py
# Uso por rota:
@limiter.limit("5/minute")
def login(request: Request, ...):
    ...
```

Atualmente aplicado apenas ao endpoint `POST /auth/login` (**5 requisições/minuto por IP**). Se excedido, retorna HTTP 429.

### Papéis de usuário

| Papel | Valor no banco | Permissões |
|---|---|---|
| Administrador | `admin` | Leitura + escrita em todos os recursos |
| Visualizador | `viewer` | Leitura e escrita em recursos sem `require_admin` |

Rotas que exigem `admin`:
- `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`
- `POST /orders`, `PUT /orders/{id}`, `DELETE /orders/{id}`

---

## 10. Referência de Endpoints

Base URL: `/api/v1` | Swagger: `http://localhost:8000/docs`

### Autenticação

| Método | Rota | Auth | Rate Limit | Descrição |
|---|---|---|---|---|
| POST | `/auth/login` | Não | 5/min | Autentica e retorna JWT |
| GET | `/auth/me` | Sim | — | Retorna dados do usuário atual |

**POST `/auth/login`**
```json
// Request
{ "email": "admvcommerce@gmail.com", "password": "senha123!@#" }

// Response 200
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "email": "...", "name": "...", "role": "admin" }
}
```

---

### Dashboard

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/dashboard/kpis` | Sim | KPIs mensais de vendas |
| GET | `/dashboard/top-regioes` | Sim | Top 5 estados por receita |
| GET | `/dashboard/top-categorias` | Sim | Top 5 categorias por qtd vendida |

**GET `/dashboard/kpis`**

Query: `?periodo=3m|6m|12m|all` (padrão: `12m`)

Períodos inválidos retornam HTTP 400. `all` retorna todos os meses do dataset.

```json
// Response 200
{
  "periodo": "12m",
  "meses": [
    {
      "ano": 2025, "mes": 1, "ano_mes": "2025-01",
      "qtd_pedidos": 1200,
      "qtd_pedidos_aprovados": 1000,
      "qtd_pedidos_recusados": 100,
      "qtd_pedidos_reembolsados": 50,
      "qtd_pedidos_processando": 50,
      "receita_bruta": 150000.00,
      "ticket_medio": 125.00,
      "qtd_clientes_unicos": 800,
      "qtd_clientes_novos": 150,
      "taxa_aprovacao": 83.33,
      "taxa_recusa": 8.33,
      "taxa_reembolso": 4.17,
      "categoria_mais_vendida": "Eletronicos",
      "estado_maior_receita": "SP",
      "data_referencia_calculo": "2025-01-31"
    }
  ]
}
```

**GET `/dashboard/top-regioes`**
```json
{
  "regioes": [
    { "estado": "SP", "receita": 8500000.0, "percentual": 32.5 }
  ]
}
```

**GET `/dashboard/top-categorias`**

Calculado via `GROUP BY categoria_produto` + `SUM(quantidade)` na tabela `gold_pedidos_enriquecidos`.

```json
{
  "categorias": [
    { "categoria": "Eletronicos", "qtd_vendida": 45000, "percentual": 28.3 }
  ]
}
```

---

### Produtos

| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| GET | `/products` | Sim | Qualquer | Lista paginada de produtos |
| GET | `/products/{id}` | Sim | Qualquer | Detalhe de um produto |
| GET | `/products/{id}/performance` | Sim | Qualquer | Métricas de performance |
| GET | `/products/{id}/avaliacoes` | Sim | Qualquer | Avaliações do produto (paginado) |
| POST | `/products` | Sim | Admin | Cria produto |
| PUT | `/products/{id}` | Sim | Admin | Atualiza produto |
| DELETE | `/products/{id}` | Sim | Admin | Remove produto |

**Query params — `GET /products`:**

| Param | Tipo | Descrição |
|---|---|---|
| `categoria` | string[] | Múltiplos valores: `?categoria=Eletronicos&categoria=Casa` |
| `ativo` | bool | `true` = apenas ativos |
| `nome` | string | ilike `%nome%` no nome ou id_produto |
| `preco_min` | float | preço >= valor |
| `preco_max` | float | preço <= valor |
| `sort_by` | string | `qtd_vendida_total`, `nota_media`, `preco_atual`, `receita_total` |
| `order` | string | `asc` ou `desc` |
| `page` | int ≥1 | padrão: 1 |
| `size` | int 1–100 | padrão: 20 |

**Geração de ID ao criar produto:**
```
Último PROD-XXXX → incrementa → PROD-XXXX+1
Nenhum PROD-* → PROD-0001
```

**Campos calculados ao criar (zeroeados/default):**
- `qtd_vendida_total = 0`
- `receita_total = 0.0`
- `classificacao = "Estável"`
- `data_referencia_calculo = date.today()`

---

### Clientes

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/customers` | Sim | Lista paginada |
| GET | `/customers/stats` | Sim | Estatísticas gerais |
| GET | `/customers/{id}` | Sim | Detalhe |
| GET | `/customers/{id}/perfil-360` | Sim | Perfil 360° completo |
| GET | `/customers/{id}/orders` | Sim | Pedidos do cliente (paginado) |
| GET | `/customers/{id}/tickets` | Sim | Tickets do cliente (paginado) |
| GET | `/customers/{id}/avaliacoes` | Sim | Avaliações do cliente (paginado) |
| GET | `/customers/{id}/comportamento` | Sim | Clickstream do cliente |
| POST | `/customers` | Sim | Cria cliente |
| PUT | `/customers/{id}` | Sim | Atualiza cliente |
| DELETE | `/customers/{id}` | Sim | Remove cliente |

**Query params — `GET /customers`:**

| Param | Tipo | Descrição |
|---|---|---|
| `nome` | string | ilike no nome |
| `email` | string | ilike no e-mail |
| `estado` | string[] | UF(s): `?estado=SP&estado=RJ` |
| `segmento` | string[] | `Alto`, `Medio`, `Baixo` |
| `is_recorrente` | bool | `true`=Recorrente, `false`=Novo |
| `min_total` | float | valor_total_gasto >= valor |
| `max_total` | float | valor_total_gasto <= valor |
| `sort_by` | string | `nome`, `data_ultimo_pedido`, `valor_total_gasto` |
| `order` | string | `asc` ou `desc` |
| `page` / `size` | int | paginação |

**GET `/customers/stats`** — resposta:
```json
{
  "total_clientes": 58000,
  "nps_medio": 7.4,
  "nota_media": 3.8,
  "top_estado": "SP",
  "top_estado_percentual": 28.5,
  "clientes_em_risco": 1200,
  "clientes_ativos_90d": 34000,
  "segmentos": { "Alto": 8000, "Medio": 25000, "Baixo": 25000 }
}
```

**GET `/customers/{id}/comportamento`**

Query: `?periodo=30` (janela em dias, padrão: 30)

---

### Pedidos

| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| GET | `/orders` | Sim | Qualquer | Lista paginada |
| GET | `/orders/{id}` | Sim | Qualquer | Detalhe |
| POST | `/orders` | Sim | Admin | Cria pedido |
| PUT | `/orders/{id}` | Sim | Admin | Atualiza pedido |
| DELETE | `/orders/{id}` | Sim | Admin | Remove pedido |

**Query params — `GET /orders`:**

| Param | Tipo | Descrição |
|---|---|---|
| `status` | string[] | `Aprovado`, `Recusado`, `Reembolsado`, `Processando` |
| `categoria` | string | categoria do produto |
| `estado` | string | UF do cliente |
| `id_cliente` | string | filtra por cliente |
| `data_inicio` | string | `YYYY-MM-DD` |
| `data_fim` | string | `YYYY-MM-DD` |
| `nome` | string | busca em produto, cliente ou id_pedido |
| `valor_min` | float | valor_total >= valor |
| `valor_max` | float | valor_total <= valor |
| `sort_by` | string | `nome_produto`, `valor_total`, `data_pedido` |
| `order` | string | `asc` ou `desc` |
| `dentro_prazo` | bool | `true`=Aprovado/Processando, `false`=Recusado/Reembolsado |
| `page` / `size` | int | paginação |

**Resposta extra em `OrderListResponse`:**
```json
{
  "total": 284000,
  "page": 1,
  "size": 20,
  "items": [...],
  "total_pendentes": 1800,
  "total_aprovados": 240000,
  "receita_total": 34500000.0
}
```

---

### Suporte

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/support` | Sim | Lista paginada de tickets |
| GET | `/support/{id}` | Sim | Detalhe de um ticket |
| POST | `/support` | Sim | Cria ticket |
| PUT | `/support/{id}` | Sim | Atualiza ticket |
| DELETE | `/support/{id}` | Sim | Remove ticket |

**Query params — `GET /support`:**

| Param | Tipo | Descrição |
|---|---|---|
| `id_cliente` | string | filtra por cliente |
| `tipo` | string[] | `Entrega`, `Reembolso`, `Produto`, `Pagamento` |
| `status` (alias) | string[] | `Aberto`, `Resolvido` |
| `sla_estourado` | bool | filtra SLA violado |
| `data_abertura` | string | data mínima de abertura (`YYYY-MM-DD`) |
| `nome` | string | busca por cliente, ticket ou tipo |
| `satisfacao` | string[] | `alta`, `media`, `baixa`, `sem_avaliacao` |
| `sort_by` | string | `id_ticket`, `data_abertura`, `status_ticket` |
| `order` | string | `asc` ou `desc` |
| `page` / `size` | int | paginação |

---

### Avaliações

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/reviews` | Sim | Lista paginada |
| GET | `/reviews/{id}` | Sim | Detalhe |
| POST | `/reviews` | Sim | Cria avaliação |
| PUT | `/reviews/{id}` | Sim | Atualiza avaliação |
| DELETE | `/reviews/{id}` | Sim | Remove avaliação |

**Query params — `GET /reviews`:**

| Param | Tipo | Descrição |
|---|---|---|
| `id_produto` | string | filtra por produto |
| `id_cliente` | string | filtra por cliente |
| `sentimento` | string | `positivo`, `neutro`, `negativo` |
| `nota_min` | int 1–5 | nota mínima |
| `nota_max` | int 1–5 | nota máxima |
| `page` / `size` | int | paginação |

---

### Clickstream

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/clickstream` | Sim | Lista paginada |
| GET | `/clickstream/{id}` | Sim | Detalhe |
| POST | `/clickstream` | Sim | Cria registro |
| PUT | `/clickstream/{id}` | Sim | Atualiza registro |
| DELETE | `/clickstream/{id}` | Sim | Remove registro |

**Query params — `GET /clickstream`:**

| Param | Tipo | Descrição |
|---|---|---|
| `id_cliente` | string | filtra por cliente |
| `canal` | string | `Web`, `Mobile`, `App` |
| `data_inicio` | string | `YYYY-MM-DD` |
| `data_fim` | string | `YYYY-MM-DD` |
| `page` / `size` | int | paginação |

---

### Agente de IA

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/agent/chat` | Sim | Envia pergunta em linguagem natural |
| GET | `/agent/suggestions` | Sim | Sugestões de perguntas |

**POST `/agent/chat`**
```json
// Request
{ "message": "Quais os 5 produtos mais vendidos?", "session_id": null }

// Response 200
{
  "answer": "Os 5 produtos mais vendidos foram...",
  "sql_used": "SELECT nome_produto, SUM(quantidade) ...",
  "data": [{ "produto": "X", "qtd": 5200 }],
  "session_id": "uuid-da-conversa"
}
```

**Sugestões hardcoded** (retornadas por `GET /agent/suggestions`):
```
"Quais foram os 5 produtos mais vendidos no último mês?"
"Qual a receita total por categoria em 2026?"
"Quais clientes do estado de SP gastaram mais de R$3.000?"
"Qual o ticket médio por método de pagamento?"
"Quantos tickets estão abertos com SLA estourado?"
"Qual produto tem a maior taxa de problemas de suporte?"
```

---

## 11. Camada de Repositórios

Os repositórios abrem e fecham a sessão de banco eles próprios (padrão `SessionLocal()`), independente do ciclo de `get_db()`. As rotas que precisam de sessão injetada por dependência (ex: `auth`) usam `Depends(get_db)`.

### `product_repository.py`

```python
get_all(categorias?, ativo?, nome?, preco_min?, preco_max?,
        sort_by?, order?, page=1, size=20) -> (list[Product], int)
# Filtra com OR(nome_produto ilike, id_produto ilike)
# Ordenação: campos em _SORTABLE = {qtd_vendida_total, nota_media, preco_atual, receita_total}
# nota_media filtra NOT NULL antes de ordenar (evita NULL no topo)

get_by_id(id_produto: str) -> Product | None
create(data: dict) -> Product
# Gera PROD-XXXX incrementando o maior existente
update(id_produto: str, data: dict) -> Product | None
# Atualiza apenas campos não-None
delete(id_produto: str) -> bool
```

### `dashboard_repository.py`

```python
get_kpis(periodo: str) -> list[dict]
# Busca todos os DashboardKPI ordenados por ano_mes.asc()
# Faz slice[-meses_count:] para filtrar período
# _PERIODOS_VALIDOS = {"3m": 3, "6m": 6, "12m": 12, "all": 9999}

get_top_regioes(limit=5) -> list[dict]
# GROUP BY Order.estado_cliente, SUM(valor_total)
# Calcula percentual sobre total geral

get_top_categorias(limit=5) -> list[dict]
# GROUP BY Order.categoria_produto, SUM(quantidade)
# Calcula percentual sobre total geral
```

### Padrão geral de filtros

```python
query = db.query(Model)
if filtro_a: query = query.filter(Model.campo_a == filtro_a)
if filtro_b: query = query.filter(Model.campo_b.ilike(f"%{filtro_b}%"))
if sort_by:  query = query.order_by(asc/desc(col))
total = query.count()
items = query.offset((page-1) * size).limit(size).all()
return items, total
```

---

## 12. Camada de Serviços

Os serviços orquestram a lógica de negócio entre as rotas e os repositórios. Erros de "não encontrado" são tratados aqui com `HTTPException(404)`.

### `dashboard_service.py`

```python
get_kpis(periodo) -> KPIsResponse
# Valida período (400 se inválido) → chama dashboard_repository.get_kpis

get_top_regioes() -> TopRegioesResponse
get_top_categorias() -> TopCategoriasResponse
```

### `auth_service.py`

```python
login(db, email, password) -> (token: str, user: User)
# get_by_email → verify_password → create_access_token
# 401 se credenciais inválidas
```

### Padrão dos demais serviços

```python
get_xxx(filtros...) -> XxxListResponse
get_xxx_by_id(id) -> XxxOut  # 404 se não encontrado
create_xxx(data: XxxCreate) -> XxxOut
update_xxx(id, data: XxxUpdate) -> XxxOut  # 404 se não encontrado
delete_xxx(id) -> None  # 404 se não encontrado
```

---

## 13. Integração com o AI Agent

Arquivo: `app/agent/agent.py`

O backend atua como **proxy/façade** entre o frontend e o serviço AI Agent externo.

### Cliente HTTP reutilizável

```python
_client: httpx.AsyncClient | None = None

def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=settings.AI_AGENT_URL,
            timeout=60.0,
        )
    return _client
```

O cliente é criado uma vez e reutilizado entre requisições (evita overhead de TCP handshake).

### Mapeamento de campos

| Backend envia ao AI Agent | AI Agent responde | Backend retorna ao Frontend |
|---|---|---|
| `question` | — | — |
| `execute: True` | — | — |
| `allow_all_schema_access: True` | — | — |
| `conversation_id` (session_id) | `conversation_id` | `session_id` |
| — | `explanation` | `answer` |
| — | `sql` | `sql_used` |
| — | `rows` | `data` |

### Tratamento de falhas

```python
except httpx.HTTPStatusError as exc:
    return { "answer": f"O agente retornou um erro ({exc.response.status_code})...",
             "sql_used": None, "data": [], "session_id": session_id }

except httpx.RequestError:
    return { "answer": "O agente de IA está temporariamente indisponível...",
             "sql_used": None, "data": [], "session_id": session_id }
```

Falhas do AI Agent são tratadas como respostas degradadas — nunca levantam exceção HTTP. O frontend recebe uma mensagem amigável.

---

## 14. Tratamento de Erros

### Códigos HTTP utilizados

| Código | Situação |
|---|---|
| 200 | Sucesso (GET, PUT) |
| 201 | Criado com sucesso (POST) |
| 204 | Excluído com sucesso (DELETE) |
| 400 | Parâmetro inválido (ex: período do KPI) |
| 401 | Token ausente, inválido ou expirado |
| 403 | Permissão insuficiente (requer admin) |
| 404 | Recurso não encontrado |
| 422 | Falha de validação Pydantic (corpo da requisição inválido) |
| 429 | Rate limit excedido no login |

### Formato de erro do FastAPI

```json
// 401/403/404:
{ "detail": "mensagem de erro" }

// 422 (Pydantic):
{
  "detail": [
    { "type": "...", "loc": ["body", "campo"], "msg": "...", "input": "..." }
  ]
}
```

---

## 15. Scripts Utilitários

### `seed.py`

Cria o usuário admin a partir das variáveis de ambiente `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`. Se o usuário já existir (mesmo e-mail), não cria duplicata.

```bash
python seed.py
# Output: "Usuário admin criado: admvcommerce@gmail.com"
# ou:     "Usuário admin já existe."
```

### `load_gold_data.py`

Importa todos os CSVs da pasta `data/gold/` para o SQLite. Faz truncate + insert bulk para cada tabela.

```bash
python load_gold_data.py
# Popula: gold_produto_performance, gold_cliente_360,
#         gold_pedidos_enriquecidos, gold_tickets,
#         gold_avaliacoes, gold_clickstream_resumo, gold_vendas_kpis
```

**Ordem de execução obrigatória:**
```
1. seed.py            → cria tabela users + usuário admin
2. load_gold_data.py  → popula todas as tabelas Gold
3. uvicorn ...        → sobe a API
```

---

## 16. Testes

### Executar testes

```powershell
cd ".\backend"
.\.venv\Scripts\python.exe -m pytest
```

Ou com output verboso:

```powershell
.\.venv\Scripts\python.exe -m pytest -v
```

### Estrutura de testes

```
backend/
└── tests/   (localização esperada)
    └── test_*.py
```

Framework: **pytest** com suporte a testes assíncronos via **pytest-asyncio**.

---

## 17. Como Executar

### Pré-requisitos

- Python 3.10+
- pip
- PowerShell (Windows) ou terminal equivalente

### Instalação e setup

```powershell
# 1. Acesse a pasta
cd ".\backend"

# 2. Crie o ambiente virtual
python -m venv .venv

# 3. Ative o ambiente
.\.venv\Scripts\Activate.ps1

# 4. Instale as dependências
python -m pip install -r requirements.txt

# 5. Configure o .env
Copy-Item .env.example .env
# Edite o .env com os valores adequados

# 6. Crie o usuário admin
python seed.py

# 7. Popule o banco com dados Gold
python load_gold_data.py

# 8. Suba a API
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### URLs de acesso

| Recurso | URL |
|---|---|
| API base | `http://127.0.0.1:8000/api/v1` |
| Swagger UI | `http://127.0.0.1:8000/docs` |
| ReDoc | `http://127.0.0.1:8000/redoc` |

### Validação via PowerShell

```powershell
# Testar se a API responde
Invoke-WebRequest -UseBasicParsing "http://127.0.0.1:8000/docs"

# Fazer login e obter token
$login = Invoke-RestMethod -Method Post "http://127.0.0.1:8000/api/v1/auth/login" `
  -ContentType "application/json" `
  -Body '{"email":"admvcommerce@gmail.com","password":"senha123!@#"}'

# Usar o token em uma requisição
Invoke-RestMethod `
  -Headers @{ Authorization = "Bearer " + $login.access_token } `
  "http://127.0.0.1:8000/api/v1/dashboard/kpis?periodo=3m"

# Testar o rate limit (6 chamadas rápidas ao login → 429 na 6ª)
1..6 | ForEach-Object {
  Invoke-RestMethod -Method Post "http://127.0.0.1:8000/api/v1/auth/login" `
    -ContentType "application/json" `
    -Body '{"email":"admvcommerce@gmail.com","password":"senha123!@#"}'
}
```

### Credenciais padrão

- **E-mail:** `admvcommerce@gmail.com`
- **Senha:** `senha123!@#`
- **Role:** `admin`
