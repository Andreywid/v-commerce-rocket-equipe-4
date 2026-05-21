# V-Commerce CRM 360 — Documentação Técnica do Frontend

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Geral](#2-arquitetura-geral)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Tecnologias e Dependências](#4-tecnologias-e-dependências)
5. [Configuração e Ambiente](#5-configuração-e-ambiente)
6. [Roteamento e Autenticação](#6-roteamento-e-autenticação)
7. [Serviço de API](#7-serviço-de-api)
8. [Gerenciamento de Estado](#8-gerenciamento-de-estado)
9. [Hooks TanStack Query](#9-hooks-tanstack-query)
10. [Páginas](#10-páginas)
11. [Componentes](#11-componentes)
12. [Tipos TypeScript](#12-tipos-typescript)
13. [Helpers e Utilitários](#13-helpers-e-utilitários)
14. [Exportação CSV](#14-exportação-csv)
15. [Assistente de IA](#15-assistente-de-ia)
16. [Como Executar](#16-como-executar)

---

## 1. Visão Geral

O frontend do V-Commerce CRM 360 é uma **SPA (Single Page Application)** construída em **React 19** com **TypeScript**. Ela oferece uma interface de CRM completa para análise e gestão de operações de e-commerce: dashboard com KPIs, gestão de produtos, clientes, pedidos, suporte e um assistente de IA integrado.

**Porta padrão em desenvolvimento:** `5174`
**URL padrão:** `http://127.0.0.1:5174`

---

## 2. Arquitetura Geral

### Fluxo de dados e camadas

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (SPA)                               │
│                                                                     │
│  ┌─────────────┐   ┌──────────────────────────────────────────┐    │
│  │  React      │   │           TanStack Query Cache           │    │
│  │  Router DOM │   │  (staleTime: 2min, gcTime: 10min)       │    │
│  │  v7         │   └──────────────┬───────────────────────────┘    │
│  └──────┬──────┘                  │                                 │
│         │                         │                                 │
│  ┌──────▼──────────────────────────▼──────────────────────────┐    │
│  │                        Pages                               │    │
│  │  Dashboard │ Products │ Clients │ Orders │ Support │ Login │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │ usa hooks                             │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                   Custom Hooks                              │    │
│  │  useKpis │ useProducts │ useCustomers │ useOrders │ ...    │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │ chama                                 │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │               src/services/api.ts                          │    │
│  │         fetch() + injeção automática do JWT                │    │
│  └──────────────────────────┬──────────────────────────────────┘    │
│                             │ HTTP                                  │
└─────────────────────────────┼───────────────────────────────────────┘
                              │  /api/v1/* (proxy Vite em dev)
                              ▼
                    Backend FastAPI :8000
```

### Árvore de componentes (visão macro)

```
App
├── QueryClientProvider          ← TanStack Query
├── BrowserRouter                ← React Router DOM v7
│   ├── Route /login → <LoginPage>
│   └── Route /* (protegida)
│       └── AppProvider          ← Context: showNotice()
│           └── AppLayout
│               ├── Sidebar      ← navegação lateral (desktop + Sheet mobile)
│               ├── Header       ← usuário e menu mobile
│               ├── <Outlet>     ← página ativa
│               │   ├── Dashboard
│               │   ├── ProductsPage
│               │   ├── ClientsPage
│               │   ├── OrdersPage
│               │   └── SupportPage
│               ├── FloatingAssistant   ← botão fixo, canto inf. direito
│               └── AssistantPanel      ← chat IA (overlay)
└── ReactQueryDevtools           ← ferramenta de debug (dev)
```

### Fluxo de autenticação

```
┌──────────┐      1. POST /auth/login        ┌────────────┐
│  Login   │  ───────────────────────────►   │  Backend   │
│  Page    │  ◄───────────────────────────   │  FastAPI   │
└──────────┘      2. { access_token, user }  └────────────┘
     │
     │  3. localStorage.setItem("token", ...)
     │     localStorage.setItem("userEmail", ...)
     │     localStorage.setItem("userName", ...)
     ▼
┌──────────┐      4. Redireciona para /
│  App     │
│  Layout  │      Em cada requisição:
└──────────┘      Authorization: Bearer <token>
     │
     │  5. Logout: remove token + email + name do localStorage
     ▼
┌──────────┐
│  /login  │
└──────────┘
```

### Fluxo de uma requisição autenticada

```
Componente / Hook
       │
       │  useQuery / useMutation
       ▼
TanStack Query (verifica cache)
       │
       │  cache miss → chama queryFn
       ▼
api.ts::request(path, options)
       │
       │  1. lê token do localStorage
       │  2. monta headers: Content-Type + Authorization
       │  3. fetch(`/api/v1${path}`)
       ▼
Vite Dev Server (proxy /api → localhost:8000)
       │
       ▼
Backend FastAPI  →  SQLite  →  resposta JSON
       │
       ▼
api.ts (trata erros HTTP → lança HttpError)
       │
       ▼
TanStack Query (armazena no cache, atualiza estado)
       │
       ▼
React re-render com novos dados
```

---

## 3. Estrutura de Pastas

```
frontend/
├── public/
│   ├── V-Horizontal.svg         # Logo horizontal (sidebar desktop)
│   └── V.svg                    # Logo ícone (sidebar mobile)
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # Shell autenticado: Sidebar + Header + Outlet + IA
│   │   │   ├── Header.tsx       # Barra superior: email, nome, botão menu mobile
│   │   │   └── Sidebar.tsx      # Nav lateral + Sheet mobile
│   │   │
│   │   ├── shared/              # Componentes reutilizáveis de domínio
│   │   │   ├── AssistantPanel.tsx         # Painel de chat IA
│   │   │   ├── ClientAdvancedFilterDialog.tsx
│   │   │   ├── ClientFormModal.tsx        # CRUD de clientes
│   │   │   ├── ClientProfileDialog.tsx    # Perfil 360° do cliente
│   │   │   ├── ConfirmDeleteDialog.tsx    # Confirmação de exclusão
│   │   │   ├── DataPanel.tsx              # Container de tabelas com borda/sombra
│   │   │   ├── FilterModal.tsx            # Filtro do dashboard (período/mês)
│   │   │   ├── FloatingAssistant.tsx      # Botão flutuante do chat IA
│   │   │   ├── FormPrimitives.tsx         # Label + Input reutilizáveis
│   │   │   ├── MetricCard.tsx             # Card de KPI individual
│   │   │   ├── MetricCards.tsx            # DataCard, DataGrid, InsightCard
│   │   │   ├── Notice.tsx                 # Alerta inline
│   │   │   ├── OrderFilterModal.tsx       # Filtros da página de pedidos
│   │   │   ├── OrderFormModal.tsx         # CRUD de pedidos
│   │   │   ├── OrderSummary.tsx           # Card de resumo de status de pedidos
│   │   │   ├── PageShell.tsx              # Container padrão de página (título + padding)
│   │   │   ├── ProductDetailDialog.tsx    # Modal de detalhe de produto
│   │   │   ├── ProductFilterModal.tsx     # Filtros da página de produtos
│   │   │   ├── ProductFormModal.tsx       # CRUD de produtos
│   │   │   ├── ProductHighlightCard.tsx   # Card de destaque (mais/menos vendido etc.)
│   │   │   ├── RatingBadge.tsx            # Badge de nota (cor por faixa)
│   │   │   ├── RevenueChart.tsx           # Gráfico de receita (Recharts)
│   │   │   ├── StatusBadge.tsx            # Badge de status genérico
│   │   │   ├── SupportFilterModal.tsx     # Filtros da página de suporte
│   │   │   ├── Table.tsx                  # TableHead, TableBody, TableRow, Pagination
│   │   │   ├── TableToolbar.tsx           # Busca + filtro + export + ação
│   │   │   ├── TicketDetailModal.tsx      # Modal de detalhe de ticket
│   │   │   ├── TicketFormModal.tsx        # CRUD de tickets
│   │   │   ├── TopCategoriasModal.tsx     # Modal top 5 categorias
│   │   │   ├── TopProdutosModal.tsx       # Modal top 5 produtos
│   │   │   └── TopRegioesModal.tsx        # Modal top 5 regiões
│   │   │
│   │   └── ui/                  # Primitivos de UI (shadcn/Base UI)
│   │       ├── avatar.tsx
│   │       ├── badge.tsx / badge-variants.ts
│   │       ├── button.tsx / button-variants.ts
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── select.tsx
│   │       ├── sheet.tsx        # Drawer/Sheet para mobile
│   │       ├── sonner.tsx       # Toast integrado
│   │       └── table.tsx
│   │
│   ├── constants/
│   │   └── badgeStyles.ts       # Classes CSS por categoria, status e tipo
│   │
│   ├── context/
│   │   └── AppContext.tsx        # showNotice() via sonner (disponível globalmente)
│   │
│   ├── helpers/
│   │   ├── dictionary.ts        # formatCategoryLabel(), getCategoryIcon()
│   │   ├── export.ts            # Funções de exportação CSV
│   │   └── metrics.ts           # getKpiCards(), getKpiInsights()
│   │
│   ├── hooks/
│   │   ├── useAgent.ts          # useAgentSuggestions, useAgentChat
│   │   ├── useCustomers.ts      # useCustomers, useCustomer360, useCustomerStats...
│   │   ├── useDebounce.ts       # Debounce genérico (400ms padrão)
│   │   ├── useKpis.ts           # useKpis, useTopRegioes, useTopCategorias
│   │   ├── useOrders.ts         # useOrders, useOrder, useOrderMutations
│   │   ├── usePersistedPageSize.ts  # Persiste pageSize no localStorage
│   │   ├── useProducts.ts       # useProducts, useProductPerformance...
│   │   └── useSupport.ts        # useSupport, useSupportTicket, useSupportMutations
│   │
│   ├── lib/
│   │   └── utils.ts             # cn() = clsx + tailwind-merge
│   │
│   ├── pages/
│   │   ├── Clients.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Orders.tsx
│   │   ├── Products.tsx
│   │   └── Support.tsx
│   │
│   ├── services/
│   │   └── api.ts               # Cliente HTTP com JWT, HttpError, api.get/post/put/delete
│   │
│   ├── types/
│   │   ├── api.ts               # Contratos de request/response espelhando o backend
│   │   ├── dashboard.ts         # Tipos auxiliares do dashboard
│   │   └── index.ts             # Tipos de domínio (OrderStatus, SupportType, etc.)
│   │
│   ├── App.tsx                  # Root: rotas, sessão, QueryClient
│   └── main.tsx                 # Entry point React.createRoot
│
├── package.json
└── vite.config.ts
```

---

## 4. Tecnologias e Dependências

### Dependências de produção

| Pacote | Versão | Função |
|---|---|---|
| `react` + `react-dom` | 19 | Framework base da SPA |
| `typescript` | ~6.0 | Tipagem estática |
| `vite` | 8 | Build e dev server |
| `@vitejs/plugin-react` | 6 | Plugin React para Vite |
| `react-router-dom` | 7 | Roteamento client-side |
| `@tanstack/react-query` | 5 | Cache, sincronização e estado de servidor |
| `@tanstack/react-query-devtools` | 5 | Inspetor de cache (dev) |
| `tailwindcss` | 4 | Estilização utilitária |
| `@tailwindcss/vite` | 4 | Plugin Tailwind para Vite |
| `shadcn` | 4.6 | CLI de componentes (shadcn/ui) |
| `@base-ui/react` | 1.4+ | Primitivos acessíveis (Dialog, Select, Sheet) |
| `recharts` | 3 | Gráficos de linha e área |
| `lucide-react` | 1.14 | Biblioteca de ícones SVG |
| `sonner` | 2 | Notificações toast |
| `class-variance-authority` | 0.7 | Variantes de componentes com CVA |
| `clsx` | 2 | Composição condicional de classes |
| `tailwind-merge` | 3 | Merge de classes Tailwind sem conflitos |
| `tw-animate-css` | 1.4 | Animações utilitárias Tailwind |
| `next-themes` | 0.4 | Suporte a tema claro/escuro |
| `@fontsource-variable/geist` | 5 | Fonte Geist (variável) |
| `@fontsource-variable/inter` | 5 | Fonte Inter (variável) |

### Dependências de desenvolvimento

| Pacote | Função |
|---|---|
| `eslint` + plugins | Linting TypeScript/React |
| `typescript-eslint` | Regras ESLint para TypeScript |
| `@types/react` + `@types/react-dom` | Tipagens |
| `@types/node` | Tipagens Node.js |

---

## 5. Configuração e Ambiente

### `vite.config.ts`

```typescript
// Proxy de desenvolvimento: /api/* → http://localhost:8000/*
server: {
  proxy: {
    "/api": {
      target: "http://localhost:8000",
      changeOrigin: true,
    },
  },
}
```

Em **desenvolvimento**, todas as chamadas para `/api/v1/*` são redirecionadas para o backend na porta 8000, evitando erros de CORS.

Em **produção**, defina a variável de ambiente:

```env
VITE_API_URL=https://api.seudominio.com/api/v1
```

O `api.ts` lê essa variável como fallback:

```typescript
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1"
```

### `localStorage` — chaves utilizadas

| Chave | Tipo | Conteúdo |
|---|---|---|
| `token` | string | JWT retornado pelo backend |
| `userEmail` | string | E-mail do usuário autenticado |
| `userName` | string | Nome do usuário autenticado |
| `pageSize:produtos` | string | Tamanho de página da tabela de produtos |
| `pageSize:clientes` | string | Tamanho de página da tabela de clientes |
| `pageSize:pedidos` | string | Tamanho de página da tabela de pedidos |
| `pageSize:suporte` | string | Tamanho de página da tabela de suporte |

---

## 6. Roteamento e Autenticação

### Mapa de rotas (`App.tsx`)

```
/login          → <LoginPage>   (pública — redireciona para / se autenticado)
/               → <Dashboard>   (protegida)
/produtos       → <ProductsPage>(protegida)
/clientes       → <ClientsPage> (protegida)
/pedidos        → <OrdersPage>  (protegida)
/suporte        → <SupportPage> (protegida)
```

Qualquer rota não listada redireciona para `/login` se não autenticado, ou para `/` se autenticado.

### Guarda de rota

A guarda é simples: se `sessionEmail` (estado derivado do `localStorage`) for vazio, o `<Outlet>` protegido renderiza `<Navigate replace to="/login" />`.

```typescript
// App.tsx — lógica simplificada
const [sessionEmail, setSessionEmail] = useState(
  () => localStorage.getItem("userEmail") ?? ""
)

// Rota protegida:
sessionEmail
  ? <AppProvider><AppLayout .../></AppProvider>
  : <Navigate replace to="/login" />
```

### Fluxo de login/logout

```
Login bem-sucedido
├── localStorage.setItem("token", access_token)
├── localStorage.setItem("userEmail", email)
├── localStorage.setItem("userName", name)
└── setSessionEmail(email) → re-render → redireciona para /

Logout
├── localStorage.removeItem("token")
├── localStorage.removeItem("userEmail")
├── localStorage.removeItem("userName")
└── setSessionEmail("") → re-render → redireciona para /login
```

---

## 7. Serviço de API

Arquivo: `src/services/api.ts`

### Classe `HttpError`

Todos os erros HTTP são normalizados em `HttpError`:

```typescript
class HttpError extends Error {
  status: number   // código HTTP (0 = falha de rede)
  detail: string   // mensagem do body.detail ou "Erro desconhecido"
}
```

### Função `request<T>`

```
request(path, options?)
│
├── 1. Lê token do localStorage
├── 2. Faz fetch para `${BASE_URL}${path}`
│      headers: Content-Type: application/json
│               Authorization: Bearer <token> (se houver)
├── 3. Se !response.ok → lança HttpError(status, detail)
├── 4. Se status 204 ou content-length 0 → retorna undefined
└── 5. Retorna response.json() como Promise<T>
```

### API pública

```typescript
api.get<T>(path: string)                    // GET
api.post<T>(path: string, body: unknown)    // POST com JSON
api.put<T>(path: string, body: unknown)     // PUT com JSON
api.delete(path: string)                    // DELETE
```

### Tratamento de erros nas páginas

```typescript
// Padrão usado nas páginas para mostrar erros do backend:
function notifyError(err: unknown, fallback: string) {
  const msg = err instanceof HttpError
    ? `Erro ${err.status}: ${err.detail}`
    : fallback
  showNotice(msg)
}
```

---

## 8. Gerenciamento de Estado

O frontend não utiliza Redux, Zustand ou similar. O estado é dividido em três categorias:

### 1. Estado de servidor — TanStack Query

Todo dado que vem do backend é gerenciado pelo TanStack Query. Configuração global do `QueryClient` (`App.tsx`):

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,       // 2 minutos antes de refetch automático
      gcTime: 10 * 60 * 1000,         // 10 minutos para descartar do cache
      retry: 1,                        // 1 tentativa extra em caso de falha
      refetchOnWindowFocus: false,     // não refetch ao focar a aba
    },
  },
})
```

### 2. Estado de sessão — `App.tsx`

```typescript
sessionEmail  // string — controla autenticação e guarda de rota
sessionName   // string — nome do usuário para exibição
```

### 3. Estado de UI — `useState` local

Cada página gerencia seu próprio estado de UI:
- filtros aplicados
- página atual
- modal aberto / fechado
- item em edição (`editingId`)
- item em visualização (`viewingId`)
- busca e debounce

### 4. Estado global de notificações — `AppContext`

```typescript
// context/AppContext.tsx
const AppContext = createContext<{ showNotice: (message: string) => void }>()

// Uso em qualquer componente dentro de AppProvider:
const { showNotice } = useAppContext()
showNotice("Produto salvo com sucesso")  // dispara toast via sonner
```

---

## 9. Hooks TanStack Query

### `useKpis.ts`

```typescript
useKpis(periodo: "3m" | "6m" | "12m" | "all" = "12m")
// queryKey: ["kpis", periodo]
// staleTime: 5 min
// Chama: GET /dashboard/kpis?periodo=<periodo>
// Retorna: KPIsResponse

useTopRegioes()
// queryKey: ["dashboard", "top-regioes"]
// staleTime: 10 min
// Chama: GET /dashboard/top-regioes
// Retorna: TopRegioesResponse

useTopCategorias()
// queryKey: ["dashboard", "top-categorias"]
// staleTime: 10 min
// Chama: GET /dashboard/top-categorias
// Retorna: TopCategoriasResponse
```

### `useProducts.ts`

```typescript
useProducts(filters: ProductFilters, page = 1, size = 20)
// queryKey: ["products", filters, page, size]
// placeholderData: keepPreviousData (sem flash durante paginação)
// Chama: GET /products?...params

useProductPerformance(id: string | null)
// queryKey: ["product-perf", id]
// enabled: id !== null
// staleTime: 3 min
// Chama: GET /products/{id}/performance

useProductReviews(id: string | null, page = 1)
// queryKey: ["product-reviews", id, page]
// enabled: id !== null
// Chama: GET /products/{id}/avaliacoes

useProductMutations()
// Retorna: { create, update, remove }
// create:  POST /products
// update:  PUT  /products/{id}
// remove:  DELETE /products/{id}
// onSuccess: invalida queryKey ["products"]
```

### `useCustomers.ts`

```typescript
useCustomers(filters: CustomerFilters, page = 1, size = 20)
// queryKey: ["customers", filters, page, size]
// Chama: GET /customers?...params

useCustomer360(id: string | null)
// queryKey: ["customer360", id]
// enabled: id !== null
// Chama: GET /customers/{id}/perfil-360

useCustomerStats()
// queryKey: ["customerStats"]
// staleTime: 5 min
// Chama: GET /customers/stats

useCustomerReviews(id: string | null, page = 1, size = 5)
// queryKey: ["customerReviews", id, page, size]
// enabled: id !== null

useCustomerMutations()
// Retorna: { create, update, remove }
// invalida queryKey ["customers"]
```

### `useOrders.ts`

```typescript
useOrders(filters: OrderFilters, page = 1, size = 20)
// queryKey: ["orders", filters, page, size]
// Chama: GET /orders?...params

useOrder(id: string | null)
// queryKey: ["order", id]
// enabled: id !== null

useOrderMutations()
// Retorna: { create, update, remove }
// invalida queryKey ["orders"]
```

### `useSupport.ts`

```typescript
useSupport(filters: SupportFilters, page = 1, size = 20)
// queryKey: ["support", filters, page, size]
// Chama: GET /support?...params

useSupportTicket(id: number | null)
// queryKey: ["ticket", id]
// enabled: id !== null

useSupportMutations()
// Retorna: { create, update, remove }
// invalida queryKey ["support"]
```

### `useAgent.ts`

```typescript
useAgentSuggestions()
// queryKey: ["agent-suggestions"]
// staleTime: 10 min
// Chama: GET /agent/suggestions
// Retorna: string[]

useAgentChat()
// useMutation
// Chama: POST /agent/chat
// Retorna: ChatResponse
```

### `useDebounce.ts`

```typescript
useDebounce<T>(value: T, delay: number): T
// Retorna o valor com atraso. Usado nas buscas com delay de 400ms.
```

### `usePersistedPageSize.ts`

```typescript
usePersistedPageSize(pageKey: string): [number, (size: number) => void]
// Tamanhos válidos: [6, 10, 20, 50]
// Padrão: 6
// Persiste no localStorage com chave `pageSize:<pageKey>`
```

---

## 10. Páginas

### Dashboard (`/`)

**Componente:** `src/pages/Dashboard.tsx`

**Hooks utilizados:**
- `useKpis("all")` — todos os meses disponíveis
- `useProducts({ sort_by: "qtd_vendida_total", order: "desc" }, 1, 1)` — produto mais vendido
- `useProducts({ sort_by: "qtd_vendida_total", order: "desc" }, 1, 5)` — top 5 produtos
- `useTopRegioes()`
- `useTopCategorias()`

**Fluxo de renderização:**

```
Dashboard
├── FilterModal (filtro de período e mês de referência)
├── TopRegioesModal (top 5 estados por receita)
├── TopProdutosModal (top 5 produtos por quantidade vendida)
├── TopCategoriasModal (top 5 categorias)
│
└── PageShell
    ├── DataGrid (4 KPI cards)
    │   ├── DataCard: Receita Bruta do mês
    │   ├── DataCard: Pedidos Aprovados
    │   ├── DataCard: Ticket Médio
    │   └── DataCard: Clientes Únicos
    │
    ├── RevenueChart + OrderSummary
    │   ├── RevenueChart: gráfico de linha (receita/pedidos/ticket)
    │   │   comparativo entre dois anos selecionados
    │   └── OrderSummary: donut textual de status de pedidos
    │
    └── InsightCards (4 cards clicáveis)
        ├── Top Região    → abre TopRegioesModal
        ├── Produto mais vendido → abre TopProdutosModal
        ├── Top Categorias → abre TopCategoriasModal
        └── Taxa de Aprovação (não clicável)
```

**Exportação:** botão "Exportar" gera `vcommerce_dashboard_kpi_YYYY-MM-DD.csv` com todos os meses.

---

### Produtos (`/produtos`)

**Componente:** `src/pages/Products.tsx`

**Hooks utilizados:**
- `useProducts(filters, page, size)` — lista principal
- `useProducts({ sort_by: "qtd_vendida_total", order: "desc" }, 1, 1)` — mais vendido
- `useProducts({ sort_by: "qtd_vendida_total", order: "asc"  }, 1, 1)` — menos vendido
- `useProducts({ sort_by: "nota_media", order: "desc" }, 1, 1)` — melhor avaliado
- `useProducts({ sort_by: "nota_media", order: "asc"  }, 1, 1)` — pior avaliado
- `useProductMutations()` — create / update / remove

**Filtros disponíveis:**
- Busca por nome ou código (debounce 400ms)
- Categorias múltiplas
- Faixa de preço (min/max)
- Ativo / Inativo
- Ordenação: `preco_atual`, `nota_media`

**Fluxo de criação/edição de produto (somente admin):**

```
Clica em "Adicionar produto"
       │
       ▼
ProductFormModal (campos: nome, categoria, preço, ativo, estoque, descrição, imagem)
       │
       │  onSubmit → create.mutateAsync(values)
       │           → api.post<ProductOut>("/products", data)
       ▼
TanStack Query invalida ["products"] → lista atualiza automaticamente
```

**ProductDetailDialog:** exibe métricas de performance (últimos 30d/90d) e avaliações do produto via `useProductPerformance` e `useProductReviews`.

---

### Clientes (`/clientes`)

**Componente:** `src/pages/Clients.tsx`

**Hooks utilizados:**
- `useCustomers(filters, page, size)` — lista principal
- `useCustomerStats()` — estatísticas gerais
- `useCustomerMutations()` — create / update / remove

**Cards de estatísticas (topo da página):**
- Total de clientes
- NPS médio
- Clientes em risco
- Ativos nos últimos 90 dias

**Filtros disponíveis:**
- Busca por nome ou e-mail (debounce 400ms)
- Estado(s) (UF)
- Segmento LTV (Alto / Médio / Baixo)
- Recorrência (Novo / Recorrente)
- Faixa de valor total gasto

**ClientProfileDialog (perfil 360°):**

```
ClientProfileDialog (abre ao clicar em uma linha)
├── Dados cadastrais (cidade, estado, origem, data cadastro)
├── Métricas (valor total, ticket médio, qtd pedidos, LTV)
│
└── Abas:
    ├── Pedidos → useOrders({ id_cliente })
    ├── Tickets → useSupport({ id_cliente })
    └── Avaliações → useCustomerReviews(id)
```

---

### Pedidos (`/pedidos`)

**Componente:** `src/pages/Orders.tsx`

**Hooks utilizados:**
- `useOrders(filters, page, size)` — lista principal
- `useOrderMutations()` — create / update / remove (admin)

**Filtros disponíveis:**
- Busca por produto, cliente ou número do pedido (debounce 400ms)
- Status (múltiplos: Aprovado / Recusado / Reembolsado / Processando)
- Categoria do produto
- Estado do cliente (UF)
- Período de data (início / fim)
- Faixa de valor
- Dentro do prazo (boolean)

**Cabeçalho da lista** exibe totais da resposta: `total_pendentes`, `total_aprovados`, `receita_total`.

---

### Suporte (`/suporte`)

**Componente:** `src/pages/Support.tsx`

**Hooks utilizados:**
- `useSupport(filters, page, size)` — lista principal
- `useSupportMutations()` — create / update / remove

**Filtros disponíveis:**
- Busca por cliente, ticket ou tipo (debounce 400ms)
- Tipo (Entrega / Reembolso / Produto / Pagamento)
- Status (Aberto / Resolvido)
- SLA estourado (boolean)
- Data de abertura mínima
- Satisfação do atendimento (alta / media / baixa / sem_avaliacao)

---

### Login (`/login`)

**Componente:** `src/pages/Login.tsx`

- Formulário simples: e-mail + senha
- `POST /auth/login` → armazena JWT no localStorage → redireciona para `/`
- Se já autenticado, redireciona direto para `/`

---

## 11. Componentes

### Layout

#### `AppLayout`

```
AppLayout
├── Sidebar (fixa no desktop, Sheet no mobile)
│   ├── Logo
│   ├── NavLinks (Dashboard, Produtos, Clientes, Pedidos, Suporte)
│   └── Botão Sair
├── div.flex-col
│   ├── Header (email, nome, botão hamburger mobile)
│   └── <Outlet> (página ativa)
├── FloatingAssistant (botão fixo)
└── AssistantPanel (painel de chat, overlay)
```

#### `Sidebar`

- **Desktop:** `<aside>` fixo de 270px com `NavLink` (active state com `bg-indigo-600`)
- **Mobile:** `<Sheet>` (drawer) da Base UI, abre ao clicar no hambúrguer do `<Header>`

### Componentes compartilhados

#### `TableToolbar`

Toolbar padrão de todas as tabelas:

```
┌──────────────────────────────────────────────────────────┐
│ [ícone] Título da lista                                  │
│                          [🔍 Busca] [⚙ Filtros] [↓ CSV] [+ Ação] │
└──────────────────────────────────────────────────────────┘
```

Props: `label`, `icon`, `searchValue`, `onSearchChange`, `placeholder`, `onAdvancedFilter`, `advancedFilterActive`, `onExport`, `onAction`, `actionLabel`.

#### `Table` (componentes primitivos)

```typescript
<TableHeader>
  <TableRow>
    <TableHead sortKey="campo" currentSortKey={...} onSort={...}>
      Coluna
    </TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  <TableRow onClick={...}>
    <TableCell>conteúdo</TableCell>
  </TableRow>
</TableBody>
<TablePagination
  currentPage={...}
  pageCount={...}
  pageSize={...}
  totalCount={...}
  filteredCount={...}
  onPageChange={...}
  onPageSizeChange={...}
/>
<EmptyTableState message="Nenhum item encontrado." />
```

`TableHead` com `sortKey` renderiza setas de ordenação (↑ ↓) e chama `onSort(key)` ao clicar.

#### `StatusBadge`

Badge colorido para status. Recebe `className` com as classes de cor via `badgeStyles.ts`.

```typescript
// badgeStyles.ts
export const orderStatusClasses: Record<OrderStatus, string> = {
  Aprovado:    "bg-emerald-50 text-emerald-700",
  Processando: "bg-amber-50 text-amber-700",
  Recusado:    "bg-rose-50 text-rose-700",
  Reembolsado: "bg-slate-50 text-slate-700",
}
```

#### `RatingBadge`

Badge de nota numérica com cor por faixa (verde ≥ 4, amarelo ≥ 3, vermelho < 3).

#### `MetricCards` (DataCard / InsightCard)

- **DataCard:** card de KPI com label, valor, helper e ícone com tone de cor (rose / emerald / indigo / violet)
- **InsightCard:** card clicável com `onClick` e `actionLabel` (ex: "Ver Top 5")
- **DataGrid:** grid responsivo de 4 colunas que envolve os cards

#### `RevenueChart`

Gráfico de linhas duplas (Recharts) comparando receita bruta entre dois anos. Suporta troca de métrica: Receita / Pedidos / Ticket Médio.

#### `AssistantPanel` + `FloatingAssistant`

Ver seção [15. Assistente de IA](#15-assistente-de-ia).

---

## 12. Tipos TypeScript

### `src/types/index.ts` — tipos de domínio

```typescript
type OrderStatus        = "Aprovado" | "Recusado" | "Reembolsado" | "Processando"
type SupportType        = "Entrega" | "Reembolso" | "Produto" | "Pagamento"
type SupportStatus      = "Aberto" | "Resolvido"
type SatisfacaoAtendimento = "alta" | "media" | "baixa" | "sem_avaliacao"
type ProductCategory    = "Eletronicos" | "Vestuario" | "Casa" | "Esportes"
                        | "Beleza" | "Automotivo" | "Brinquedos" | "Moveis" | "Sem categoria"
type ProductClassificacao = "Top Vendedor" | "Estável" | "Problemático" | "Encalhado"
type ClientSegmento     = "Alto" | "Medio" | "Baixo"
type ReviewSentimento   = "positivo" | "neutro" | "negativo"
type MetodoPagamento    = "Cartao" | "PIX" | "Boleto" | "App"
type MetricTone         = "rose" | "emerald" | "indigo" | "violet"
type ChatMessage        = { id, role, content, timestamp, source?, isError? }
```

### `src/types/api.ts` — contratos da API

```typescript
// Paginação genérica
type PagedResponse<T> = { total: number; page: number; size: number; items: T[] }

// Auth
type UserOut        = { id, email, name, role: "admin" | "user" }
type LoginResponse  = { access_token, token_type, user: UserOut }

// Dashboard
type VendasKPIMes   = { ano, mes, ano_mes, qtd_pedidos, qtd_pedidos_aprovados,
                        receita_bruta, ticket_medio, qtd_clientes_unicos, ... }
type KPIsResponse   = { periodo: string; meses: VendasKPIMes[] }
type TopRegiao      = { estado, receita, percentual }
type TopCategoria   = { categoria, qtd_vendida, percentual }

// Clientes
type CustomerOut    = { id_cliente, nome, email, telefone, data_cadastro, cidade,
                        estado, origem, qtd_pedidos_total, valor_total_gasto,
                        ticket_medio, data_ultimo_pedido, qtd_tickets_abertos,
                        segmento_ltv, is_ativo_90d, is_em_risco }
type Customer360    = CustomerOut & { qtd_pedidos_aprovados, qtd_pedidos_recusados,
                        data_primeiro_pedido, qtd_tickets_total, qtd_avaliacoes,
                        nota_media_dada, nps_medio_avaliacoes_cliente,
                        qtd_eventos_clickstream, canal_preferido, ... }
type CustomerListResponse = PagedResponse<CustomerOut> & { segmento_alto: number }
type CustomerStats  = { total_clientes, nps_medio, nota_media, top_estado,
                        clientes_em_risco, clientes_ativos_90d, segmentos }

// Pedidos
type OrderOut       = { id_pedido, id_cliente, id_produto, data_pedido,
                        quantidade, valor_unitario, valor_total, status,
                        metodo_pagamento, nome_cliente, estado_cliente,
                        nome_produto, categoria_produto, ano, mes, trimestre }
type OrderListResponse = PagedResponse<OrderOut> & {
                        total_pendentes, total_aprovados, receita_total }

// Produtos
type ProductOut     = { id_produto, nome_produto, categoria, preco_atual, ativo,
                        estoque, descricao, imagem_url, qtd_vendida_total,
                        receita_total, nota_media, qtd_tickets_associados, classificacao }
type ProductPerformance = ProductOut & { qtd_vendida_30d, qtd_vendida_90d,
                        receita_30d, qtd_tickets_30d, taxa_problema,
                        qtd_avaliacoes, pct_recomendam, qtd_visualizacoes,
                        qtd_carrinho, taxa_conversao, data_referencia_calculo }

// Tickets
type TicketOut      = { id_ticket, id_cliente, id_pedido, id_produto,
                        tipo_problema, satisfacao_atendimento, data_abertura,
                        data_resolucao, tempo_resolucao_horas, agente_suporte,
                        nota_avaliacao, status_ticket, sla_estourado,
                        nome_cliente, nome_produto }

// Avaliações
type ReviewOut      = { id_avaliacao, id_cliente, id_pedido, id_produto,
                        nota_produto, nota_nps, recomenda, comentario,
                        sentimento, data_avaliacao, nome_produto,
                        categoria_produto, nome_cliente }

// Agente IA
type ChatRequest    = { message: string; session_id: string | null }
type ChatResponse   = { answer, sql_used, data, session_id }
```

---

## 13. Helpers e Utilitários

### `src/lib/utils.ts`

```typescript
function cn(...inputs: ClassValue[]): string
// Combina clsx + tailwind-merge para composição segura de classes Tailwind.
// Uso: cn("base-class", condicional && "extra-class", props.className)
```

### `src/helpers/dictionary.ts`

```typescript
formatCategoryLabel(categoria: string): string
// Ex: "Eletronicos" → "Eletrônicos"

getCategoryIcon(categoria: string): LucideIcon
// Retorna o ícone lucide-react correspondente à categoria do produto.
```

### `src/helpers/metrics.ts`

```typescript
getKpiCards(mes: VendasKPIMes): Metric[]
// Gera os 4 DataCards do Dashboard a partir dos dados do mês selecionado.
// Cards: Receita Bruta, Pedidos Aprovados, Ticket Médio, Clientes Únicos

getKpiInsights(mes, topProduct, topCategoria, topCategoriaQtd): Metric[]
// Gera os 4 InsightCards: Top Região, Produto mais vendido,
// Top Categorias, Taxa de Aprovação
```

---

## 14. Exportação CSV

Arquivo: `src/helpers/export.ts`

### Arquitetura das funções de export

```
exportXxxToCSV(data: XxxOut[])
       │
       ├── 1. Define headers (array de strings)
       ├── 2. Mapeia data → rows (array de valores)
       ├── 3. generateCSV(headers, rows) → string CSV
       │      ├── Escapa aspas duplas (replace " → "")
       │      └── Envolve em aspas campos com vírgulas
       └── 4. downloadFile(csv, filename, "text/csv;charset=utf-8;")
              ├── Cria Blob
              ├── URL.createObjectURL(blob)
              ├── Cria <a> invisível e simula clique
              ├── Remove <a> do DOM
              └── setTimeout → URL.revokeObjectURL (libera memória)
```

### Funções disponíveis

| Função | Arquivo gerado | Colunas |
|---|---|---|
| `exportKpiToCSV(data)` | `vcommerce_dashboard_kpi_YYYY-MM-DD.csv` | Ano/Mês, Pedidos, Aprovados, Receita, Ticket Médio, Clientes Únicos, Taxa Aprovação, Categoria Top |
| `exportProductsToCSV(data)` | `vcommerce_produtos_YYYY-MM-DD.csv` | ID, Nome, Categoria, Preço, Ativo, Estoque, Qtd Vendida, Receita, Nota, Classificação |
| `exportClientesToCSV(data)` | `vcommerce_clientes_YYYY-MM-DD.csv` | ID, Nome, Email, Telefone, Cidade, Estado, Origem, Data Cadastro, Pedidos, Valor Total, Ticket Médio, Último Pedido, Tickets Abertos, Segmento, Ativo 90d, Em Risco |
| `exportOrdersToCSV(data)` | `vcommerce_pedidos_YYYY-MM-DD.csv` | ID Pedido, ID Cliente, Nome Cliente, ID Produto, Nome Produto, Categoria, Data, Qtd, Valor Unitário, Valor Total, Status, Pagamento, Estado |
| `exportTicketsToCSV(data)` | `vcommerce_tickets_YYYY-MM-DD.csv` | ID Ticket, Cliente, Tipo, Status, Data Abertura, Data Resolução, Agente, Nota, SLA Estourado |

---

## 15. Assistente de IA

### Componentes envolvidos

```
AppLayout
├── FloatingAssistant   ← botão fixo (bottom-right), sempre visível
└── AssistantPanel      ← painel de chat (overlay), visível quando isAssistantOpen=true
```

### Fluxo de uma pergunta

```
Usuário digita pergunta e pressiona Enter / botão Send
         │
         ▼
sendMessage(message)
│
├── 1. Cria msgId (user) e pendingId (assistant "…")
├── 2. Adiciona ambos ao estado messages[]
├── 3. Limpa campo de input
│
└── mutation.mutate({ message, session_id })
        │
        │  POST /api/v1/agent/chat
        ▼
    Backend → AI Agent (:8001/ask) → SQL → resultado
        │
        ▼
    onSuccess(response)
    ├── parseAnswer(response.answer)
    │   ├── extrai "source" (tabela consultada)
    │   ├── remove blocos de código SQL
    │   └── limpa whitespace extra
    ├── setSessionId(response.session_id)  ← mantém contexto
    └── substitui mensagem "…" pela resposta real
```

### Renderização de mensagens

```
Mensagem do usuário   → bolha direita (borda cinza)
Mensagem do assistente → sem bolha, texto puro
    ├── Se isError → <ErrorBlock> (rose)
    └── Se tem source → <SourceBlock>
            ├── Nome da tabela
            └── Botão "Ver fonte" → navega para a rota relacionada
```

### Mapeamento source → rota

```typescript
routeForSource(source: string): string | null
// "pedido" / "order"  → "/pedidos"
// "cliente" / "cust"  → "/clientes"
// "produto" / "prod"  → "/produtos"
// "ticket" / "suporte"→ "/suporte"
// outros              → null (botão não aparece)
```

### Sugestões de perguntas

Carregadas via `useAgentSuggestions()` (`GET /agent/suggestions`). Fallback local caso o endpoint falhe:

```
"Qual minha renda mensal?"
"Qual meu produto mais vendido?"
"Quantos produtos foram vendidos esse mês?"
```

---

## 16. Como Executar

### Pré-requisitos

- Node.js 18+
- npm
- Backend em execução na porta 8000

### Instalação

```powershell
cd ".\frontend"
npm install
```

### Desenvolvimento

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

Acesse: `http://127.0.0.1:5174`

### Lint

```powershell
npm run lint
```

### Build de produção

```powershell
npm run build
```

Os arquivos estáticos são gerados em `frontend/dist/`.

### Preview do build

```powershell
npm run preview
```

### Credenciais de desenvolvimento

- **E-mail:** `admvcommerce@gmail.com`
- **Senha:** `senha123!@#`

> O backend precisa estar rodando. Se o banco estiver vazio, execute `seed.py` e `load_gold_data.py` no backend.
