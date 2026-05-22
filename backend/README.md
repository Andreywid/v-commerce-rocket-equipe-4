# V-Commerce CRM 360 — Backend

API REST do CRM V-Commerce, construída com **FastAPI + Python**, banco **SQLite** e autenticação **JWT**. Expõe os dados do pipeline Gold para o frontend e atua como proxy para o serviço de AI Agent.

## Visão Geral

O backend disponibiliza endpoints RESTful paginados, filtráveis e protegidos por autenticação para todas as entidades do sistema: dashboard de KPIs, produtos, clientes, pedidos, tickets de suporte, avaliações e clickstream. Opera sobre tabelas carregadas a partir de CSVs gerados pelo pipeline de Data Engineering.

## Stack Principal

| Tecnologia | Versão | Função |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | ≥0.136 | Framework web ASGI |
| SQLAlchemy | 2.0 | ORM |
| Pydantic v2 | ≥2.9 | Validação de schemas |
| pydantic-settings | 2.0 | Configuração via `.env` |
| python-jose | 3.3 | JWT (HS256) |
| bcrypt | 4.0 | Hash de senhas |
| SlowAPI | 0.1.9 | Rate limiting por IP |
| httpx | 0.27 | Cliente HTTP async (proxy AI Agent) |
| SQLite | — | Banco de dados |

## Funcionalidades

- **Autenticação JWT** — login com rate limiting (5 req/min), token com 8h de validade
- **RBAC** — roles `admin` (escrita total) e `viewer` (leitura)
- **Dashboard** — KPIs mensais, top regiões, top categorias
- **Produtos** — CRUD + métricas de performance (30d/90d) + avaliações
- **Clientes** — CRUD + perfil 360° + sub-recursos (pedidos, tickets, avaliações, clickstream)
- **Pedidos** — CRUD com filtros por status, período, valor e UF
- **Suporte** — CRUD com controle de SLA e satisfação
- **Avaliações e Clickstream** — CRUD completo
- **Proxy AI Agent** — encaminha perguntas ao serviço `:8001/ask` com tratamento de falhas

## Início Rápido

```powershell
# 1. Criar e ativar o ambiente virtual
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 2. Instalar dependências
python -m pip install -r requirements.txt

# 3. Configurar o .env
Copy-Item .env.example .env
# Edite com seus valores

# 4. Criar usuário admin
python seed.py

# 5. Carregar dados Gold
python load_gold_data.py

# 6. Subir a API
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**URLs:**
- API: `http://127.0.0.1:8000/api/v1`
- Swagger: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

**Credenciais:** `admvcommerce@gmail.com` / `senha123!@#`

## Variáveis de Ambiente (`.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./vcommerce.db` | Banco de dados |
| `SECRET_KEY` | `change-me-in-production` | Chave de assinatura JWT |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Expiração do token (8h) |
| `ADMIN_EMAIL` | — | E-mail do admin (obrigatório) |
| `ADMIN_PASSWORD` | — | Senha do admin (obrigatório) |
| `AI_AGENT_URL` | `http://localhost:8001` | URL do serviço AI Agent |

## Estrutura

```
backend/
├── app/
│   ├── api/v1/        # Routers FastAPI por entidade
│   ├── agent/         # Proxy HTTP para o AI Agent
│   ├── core/          # Segurança, deps, rate limiter
│   ├── models/        # Modelos SQLAlchemy
│   ├── repositories/  # Queries e filtros do banco
│   ├── schemas/       # Schemas Pydantic (I/O)
│   └── services/      # Regras de negócio
├── seed.py            # Cria usuário admin
├── load_gold_data.py  # Importa CSVs Gold para o SQLite
└── docs/              # Documentação técnica detalhada
    └── modules/       # Um arquivo por módulo do sistema
```

## Documentação

| Módulo | Arquivo |
|---|---|
| Arquitetura em camadas | [docs/modules/arquitetura.md](docs/modules/arquitetura.md) |
| Autenticação e segurança | [docs/modules/autenticacao.md](docs/modules/autenticacao.md) |
| Referência de endpoints | [docs/modules/endpoints.md](docs/modules/endpoints.md) |
| Modelos SQLAlchemy | [docs/modules/modelos.md](docs/modules/modelos.md) |
| Schemas Pydantic | [docs/modules/schemas.md](docs/modules/schemas.md) |
| Camada de repositórios | [docs/modules/repositorios.md](docs/modules/repositorios.md) |
| Camada de serviços | [docs/modules/servicos.md](docs/modules/servicos.md) |
| Banco de dados e scripts | [docs/modules/banco-de-dados.md](docs/modules/banco-de-dados.md) |
| Integração AI Agent | [docs/modules/ai-agent.md](docs/modules/ai-agent.md) |

Para a documentação técnica completa e consolidada, veja [V-Commerce-backend-Documentacao.MD](V-Commerce-backend-Documentacao.MD).
