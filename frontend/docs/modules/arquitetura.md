# Módulo de Arquitetura (Frontend)

## Visão Geral

O frontend é uma **SPA (Single Page Application)** construída em React 19 + TypeScript, servida por Vite 8. Toda a comunicação com o servidor ocorre via HTTP REST; não há WebSocket nem SSE. O estado de servidor é gerenciado exclusivamente pelo TanStack Query, eliminando a necessidade de Redux ou Zustand.

**Porta de desenvolvimento:** `5174`
**URL de desenvolvimento:** `http://127.0.0.1:5174`

## Responsabilidades

1. Renderizar a interface de CRM para as equipes de negócio (comercial, produto, suporte)
2. Gerenciar autenticação de sessão via JWT armazenado no `localStorage`
3. Fazer cache inteligente de dados do servidor com TanStack Query
4. Encaminhar todas as requisições HTTP ao backend FastAPI (`:8000`)
5. Prover o Assistente de IA integrado (chat flutuante) em todas as telas autenticadas
6. Exportar dados em CSV para qualquer entidade listada

## Arquitetura Interna

### Camadas da aplicação

```
Browser (SPA)
│
├── React Router DOM v7          ← roteamento client-side
│   └── Guarda de rota           ← verifica sessionEmail no localStorage
│
├── TanStack Query               ← cache de servidor (staleTime 2min, gcTime 10min)
│   └── QueryClient              ← configurado em App.tsx
│
├── Pages                        ← componentes de página por rota
│   └── Hooks TanStack Query     ← conectam páginas ao cache
│       └── api.ts               ← fetch() com injeção de JWT
│
├── Componentes compartilhados   ← tabelas, modais, badges, toolbar
│
├── AppContext                   ← showNotice() global via sonner
│
└── AssistantPanel               ← chat IA, overlay sobre AppLayout
```

### Árvore de componentes (macro)

```
App
├── QueryClientProvider          ← TanStack Query
├── BrowserRouter                ← React Router DOM v7
│   ├── /login → <LoginPage>
│   └── /* (protegida)
│       └── AppProvider          ← Context: showNotice()
│           └── AppLayout
│               ├── Sidebar      ← desktop aside + Sheet mobile
│               ├── Header       ← e-mail, nome, hambúrguer
│               ├── <Outlet>     ← página ativa
│               │   ├── Dashboard
│               │   ├── ProductsPage
│               │   ├── ClientsPage
│               │   ├── OrdersPage
│               │   └── SupportPage
│               ├── FloatingAssistant   ← botão fixo (bottom-right)
│               └── AssistantPanel      ← chat IA (overlay)
└── ReactQueryDevtools           ← devtools (dev only)
```

## Fluxo de Dados

### Requisição autenticada (happy path)

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
       │  2. monta headers: Content-Type + Authorization: Bearer
       │  3. fetch(`/api/v1${path}`)
       ▼
Vite Dev Server (proxy /api → localhost:8000)
       │
       ▼
Backend FastAPI → SQLite → resposta JSON
       │
       ▼
api.ts (trata !response.ok → lança HttpError)
       │
       ▼
TanStack Query (armazena no cache)
       │
       ▼
React re-render com novos dados
```

### Fluxo de autenticação

```
┌──────────┐  POST /auth/login   ┌────────────┐
│  Login   │ ──────────────────► │  Backend   │
│  Page    │ ◄────────────────── │  FastAPI   │
└──────────┘  { access_token }   └────────────┘
     │
     │  localStorage.setItem("token", ...)
     │  localStorage.setItem("userEmail", ...)
     │  localStorage.setItem("userName", ...)
     ▼
 setSessionEmail(email) → re-render → redireciona para /
```

## Configuração de Cache (TanStack Query)

```typescript
// App.tsx
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,   // 2 min: dados "frescos" sem refetch
      gcTime: 10 * 60 * 1000,     // 10 min: entradas inativas no cache
      retry: 1,                    // 1 tentativa extra em falha de rede
      refetchOnWindowFocus: false, // sem refetch ao focar a aba
    },
  },
})
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [api.md](api.md) | ← usa | Todos os hooks chamam api.ts para HTTP |
| [rotas.md](rotas.md) | ← usa | App.tsx define o mapa de rotas e a guarda |
| [hooks.md](hooks.md) | ← usa | Páginas consomem os custom hooks |
| Backend FastAPI | ↔ HTTP | Única fonte de dados; Vite faz proxy em dev |
| AI Agent `:8001` | ↔ (via be) | O backend encaminha as mensagens do chat |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | QueryClient, BrowserRouter, guarda de rota, login/logout |
| `src/main.tsx` | React.createRoot, ponto de entrada |
| `src/services/api.ts` | Cliente HTTP com JWT |
| `vite.config.ts` | Proxy `/api → :8000`, plugin React |
| `src/context/AppContext.tsx` | showNotice global |

## Glossário

| Termo | Significado |
|---|---|
| SPA | Single Page Application — o browser carrega uma única página HTML e navega sem recarregar |
| staleTime | Tempo que o TanStack Query considera os dados "frescos" antes de refetch automático |
| gcTime | Garbage Collection Time — tempo antes de remover entradas inativas do cache |
| queryFn | Função passada ao useQuery que faz a chamada HTTP |
| Outlet | Componente do React Router que renderiza a rota filha ativa |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
