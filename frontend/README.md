# V-Commerce CRM 360

Dashboard CRM para gestão de pedidos, produtos, clientes e suporte — construído com React, TypeScript e Vite.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Roteamento | React Router DOM |
| Estilo | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Componentes base | shadcn/ui + `@base-ui/react` |
| Ícones | lucide-react |
| Variantes | class-variance-authority (CVA) |
| Fontes | Inter Variable (`@fontsource-variable/inter`) |

## Comandos

```bash
npm run dev       # servidor de desenvolvimento com HMR
npm run build     # type-check (tsc) + build de produção
npm run lint      # ESLint
npm run preview   # servir o build de produção localmente
```

## Rotas

| URL | Página |
|-----|--------|
| `/` | Dashboard |
| `/produtos` | Produtos |
| `/clientes` | Clientes |
| `/pedidos` | Pedidos |
| `/suporte` | Suporte |

## Estrutura do projeto

```
src/
├── App.tsx                          # BrowserRouter + Routes + AppProvider (~22 linhas)
├── index.css                        # Tailwind v4 + tokens shadcn + Inter
│
├── types/
│   └── index.ts                     # Todos os tipos TypeScript compartilhados
│
├── context/
│   └── AppContext.tsx               # Estado global: orders, tickets, products, clients, notice
│                                    # Sync com localStorage + ações (add/update)
│
├── mocks/                           # Dados iniciais e constantes de cada entidade
│   ├── orders.ts                    # initialOrders, orderStatusOptions, emptyOrderForm
│   ├── tickets.ts                   # initialSupportTickets, supportTypeOptions, ratingLabelOptions
│   ├── products.ts                  # initialProducts, productCategoryOptions
│   └── clients.ts                   # initialClients, clientStatusOptions
│
├── helpers/                         # Funções puras, sem JSX
│   ├── storage.ts                   # readStoredRows, createOrderId/TicketId/ProductId/ClientId, rowIncludes
│   ├── metrics.ts                   # getDashboardMetrics, getOrdersMetrics, getSupportMetrics, getClientsMetrics
│   └── assistant.ts                 # getAssistantSummary, getAssistantAnswer (rule-based, sem API)
│
├── lib/
│   └── utils.ts                     # cn() (clsx + tailwind-merge), normalizeText()
│
├── pages/                           # Cada página é autônoma: busca dados do context, gerencia estado de UI próprio
│   ├── Dashboard.tsx                # Métricas gerais + gráfico de renda + resumo de pedidos + insights
│   ├── Products.tsx                 # Tabela de produtos com filtro por categoria
│   ├── Clients.tsx                  # Tabela de clientes com métricas e filtro por status
│   ├── Orders.tsx                   # Tabela de pedidos com filtro por status + modal de criação
│   └── Support.tsx                  # Tabela de tickets com filtro por tipo + modais de criação/edição
│
└── components/
    ├── ui/                          # Componentes shadcn (gerados via `npx shadcn add`)
    │   ├── button.tsx
    │   └── button-variants.ts
    │
    ├── layout/
    │   ├── AppLayout.tsx            # Shell visual: Sidebar + Header + <Outlet> + Notice + AssistantPanel
    │   ├── Sidebar.tsx              # Navegação via NavLink (ativo automático pela rota)
    │   └── Header.tsx               # Barra superior com notificações e perfil
    │
    └── shared/                      # Componentes reutilizáveis entre páginas
        ├── MetricCard.tsx           # MetricCard + MetricGrid
        ├── StatusBadge.tsx          # Badge colorido (status, tipo, avaliação)
        ├── DataPanel.tsx            # Container de tabela com borda
        ├── PageShell.tsx            # Wrapper de página com título
        ├── TableToolbar.tsx         # Busca + filtro + botão de ação
        ├── Table.tsx                # TableHead, EmptyTableState, TablePagination
        ├── Notice.tsx               # Toast de feedback (auto-remove em 1.8s)
        ├── FloatingAssistant.tsx    # Botão flutuante do assistente IA
        ├── AssistantPanel.tsx       # Painel de chat com o assistente
        ├── FormPrimitives.tsx       # ModalFrame, ModalActions, FormInput, FormSelect
        ├── OrderFormModal.tsx       # Modal de criação de pedido
        ├── SupportFormModal.tsx     # Modal de criação/edição de ticket
        ├── ProductFormModal.tsx     # Modal de criação/edição de produto
        └── ClientFormModal.tsx      # Modal de criação/edição de cliente
```

## Modelo de dados

Todas as entidades são persistidas no `localStorage`.

| Entidade | Campos principais | Chave localStorage |
|----------|------------------|--------------------|
| `OrderRow` | `id`, `product`, `customer`, `value`, `stock`, `date`, `status`, `quantity` | `v-commerce-orders` |
| `SupportRow` | `ticket`, `customer`, `type`, `createdAt`, `resolvedIn`, `rating`, `ratingLabel` | `v-commerce-support-tickets` |
| `ProductRow` | `id`, `name`, `categories`, `price`, `stock`, `rating`, `ratingLabel`, `sold` | `v-commerce-products` |
| `ClientRow` | `id`, `name`, `location`, `status`, `lastOrder`, `orderCount`, `total` | `v-commerce-clients` |

## Fluxo de dados

```
AppProvider (context)
  └── orders, tickets, products, clients  ←→  localStorage
        ↓ useAppContext()
  pages/  (estado de UI local: search, filter, modal open/close)
        ↓ props
  components/shared/
```

O `AppContext` expõe apenas ações (`addOrder`, `updateTicket`, etc.) — os setters diretos ficam encapsulados. O `showNotice` também vem do context, então qualquer página pode disparar o toast sem prop drilling.

## Adicionando novos componentes shadcn

```bash
npx shadcn add <componente>
```

Os arquivos são gerados em `src/components/ui/`.
