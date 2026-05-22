# V-Commerce CRM 360 — Frontend

SPA de CRM para gestão e análise de operações de e-commerce, construída em **React 19 + TypeScript** com **Vite** e **TanStack Query**.

## Visão Geral

O frontend oferece uma interface completa para as equipes comercial, de produto e de suporte acompanharem métricas de venda, gerenciarem produtos, clientes, pedidos e tickets de suporte — tudo com um assistente de IA integrado que responde perguntas em linguagem natural sobre os dados.

## Stack Principal

| Tecnologia | Versão | Função |
|---|---|---|
| React | 19 | Framework de UI |
| TypeScript | ~6.0 | Tipagem estática |
| Vite | 8 | Build e dev server |
| React Router DOM | 7 | Roteamento client-side |
| TanStack Query | 5 | Cache e estado de servidor |
| Tailwind CSS | 4 | Estilização utilitária |
| Recharts | 3 | Gráficos |
| Sonner | 2 | Notificações toast |

## Funcionalidades

- **Dashboard** — KPIs mensais, gráfico de receita comparativo entre anos, top regiões, top categorias
- **Produtos** — CRUD, highlight cards (mais/menos vendido, melhor/pior avaliado), filtros avançados, exportação CSV
- **Clientes** — CRUD, perfil 360° com pedidos/tickets/avaliações, filtros por segmento/estado/LTV
- **Pedidos** — listagem completa com resumo de status, filtros por período/valor/UF
- **Suporte** — gestão de tickets com controle de SLA, filtros por tipo/status/satisfação
- **Assistente de IA** — chat flutuante com contexto de sessão, sugestões de perguntas, navegação por fonte

## Início Rápido

```powershell
# Instalar dependências
npm install

# Rodar em desenvolvimento (porta 5174)
npm run dev -- --host 127.0.0.1 --port 5174

# Build de produção
npm run build
```

**Pré-requisito:** backend FastAPI em execução na porta `8000`.

**Credenciais:** `admvcommerce@gmail.com` / `senha123!@#`

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `/api/v1` | URL base da API (produção) |

Em desenvolvimento, o Vite faz proxy de `/api/*` → `http://localhost:8000`.

## Estrutura

```
frontend/
├── src/
│   ├── components/    # Layout + componentes compartilhados + primitivos UI
│   ├── context/       # AppContext (showNotice global)
│   ├── helpers/       # CSV export, dictionary, metrics
│   ├── hooks/         # TanStack Query hooks + debounce + page size
│   ├── pages/         # Dashboard, Products, Clients, Orders, Support, Login
│   ├── services/      # Cliente HTTP (api.ts)
│   └── types/         # Tipos de domínio e contratos de API
├── public/            # Logos SVG
└── docs/              # Documentação técnica detalhada
    └── modules/       # Um arquivo por módulo do sistema
```

## Documentação

| Módulo | Arquivo |
|---|---|
| Arquitetura e fluxo de dados | [docs/modules/arquitetura.md](docs/modules/arquitetura.md) |
| Roteamento e autenticação | [docs/modules/rotas.md](docs/modules/rotas.md) |
| Serviço de API (HTTP client) | [docs/modules/api.md](docs/modules/api.md) |
| Hooks TanStack Query | [docs/modules/hooks.md](docs/modules/hooks.md) |
| Páginas | [docs/modules/paginas.md](docs/modules/paginas.md) |
| Componentes compartilhados | [docs/modules/componentes.md](docs/modules/componentes.md) |
| Tipos TypeScript | [docs/modules/tipos.md](docs/modules/tipos.md) |
| Helpers e utilitários | [docs/modules/helpers.md](docs/modules/helpers.md) |

Para a documentação técnica completa e consolidada, veja [V-Commerce-frontend-Documentacao.MD](V-Commerce-frontend-Documentacao.MD).
