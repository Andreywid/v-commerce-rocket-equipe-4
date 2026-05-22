# Módulo de Páginas (Frontend)

## Visão Geral

O frontend possui seis páginas, todas em `src/pages/`. Cinco são protegidas por autenticação e renderizadas dentro do `AppLayout`. Cada página gerencia seu próprio estado de UI com `useState` e delega o estado de servidor aos hooks TanStack Query.

## Responsabilidades

1. Compor a interface visual de cada seção do CRM
2. Gerenciar estado de UI local (filtros, modais, paginação, ordenação, busca)
3. Orquestrar hooks de dados e callbacks de mutação
4. Exibir notificações de sucesso/erro via `showNotice`
5. Oferecer exportação CSV dos dados listados

## Página: Dashboard (`/`)

**Arquivo:** `src/pages/Dashboard.tsx`

**Hooks:** `useKpis("all")`, `useProducts` (×2: mais vendido, top 5), `useTopRegioes`, `useTopCategorias`

**Layout:**

```
Dashboard
├── FilterModal (filtro de período e mês de referência)
│
└── PageShell
    ├── DataGrid — 4 KPI cards
    │   ├── DataCard: Receita Bruta do mês selecionado
    │   ├── DataCard: Pedidos Aprovados
    │   ├── DataCard: Ticket Médio
    │   └── DataCard: Clientes Únicos
    │
    ├── RevenueChart + OrderSummary
    │   ├── RevenueChart: gráfico de linhas (Recharts)
    │   │   ├── Métrica: Receita | Pedidos | Ticket Médio
    │   │   └── Comparativo entre dois anos selecionados
    │   └── OrderSummary: breakdown textual de status de pedidos
    │
    └── InsightCards — 4 cards clicáveis
        ├── Top Região      → abre TopRegioesModal
        ├── Produto mais vendido → abre TopProdutosModal
        ├── Top Categorias  → abre TopCategoriasModal
        └── Taxa de Aprovação (não clicável, exibe percentual)
```

**Exportação:** `exportKpiToCSV(data)` → `vcommerce_dashboard_kpi_YYYY-MM-DD.csv`

---

## Página: Produtos (`/produtos`)

**Arquivo:** `src/pages/Products.tsx`

**Hooks:** `useProducts` (×5: lista principal + 4 highlights), `useProductMutations`

**Highlight cards (4):**
- Produto mais vendido (emerald)
- Melhor avaliado (indigo)
- Menos vendido (amber)
- Menor avaliado (rose)

**Filtros disponíveis:**
- Busca por nome ou código (debounce 400ms, combina campo rápido + filtro avançado)
- Categorias múltiplas (`Eletronicos`, `Vestuario`, `Casa`, `Esportes`, `Beleza`, `Automotivo`, `Brinquedos`, `Moveis`)
- Faixa de preço (min/max, padrão 0–100.000)
- Ativo / Inativo (mutuamente exclusivos; se ambos, nenhum filtro aplicado)
- Ordenação: `preco_atual`, `nota_media`

**Modais:**
- `ProductDetailDialog` — abre ao clicar na linha; exibe métricas de performance + avaliações
- `ProductFormModal` — criação e edição (somente admin); inclui botão de exclusão ao editar
- `ProductFilterModal` — filtros avançados

---

## Página: Clientes (`/clientes`)

**Arquivo:** `src/pages/Clients.tsx`

**Hooks:** `useCustomers`, `useCustomerStats`, `useCustomerMutations`

**Cards de estatísticas (topo):**
- Total de clientes
- NPS médio
- Clientes em risco
- Ativos nos últimos 90 dias

**Filtros disponíveis:**
- Busca por nome ou e-mail (debounce 400ms)
- Estado(s) — UF(s)
- Segmento LTV (Alto / Médio / Baixo)
- Recorrência (Novo / Recorrente)
- Faixa de valor total gasto (min/max)

**ClientProfileDialog (perfil 360°):**

```
ClientProfileDialog
├── Dados cadastrais (cidade, estado, origem, data cadastro)
├── Métricas: valor total, ticket médio, qtd pedidos, LTV
│
└── Abas:
    ├── Pedidos → useOrders({ id_cliente })
    ├── Tickets → useSupport({ id_cliente })
    └── Avaliações → useCustomerReviews(id)
```

---

## Página: Pedidos (`/pedidos`)

**Arquivo:** `src/pages/Orders.tsx`

**Hooks:** `useOrders`, `useOrderMutations`

**Cabeçalho da lista:** exibe `total_pendentes`, `total_aprovados` e `receita_total` retornados pela API.

**Filtros disponíveis:**
- Busca por produto, cliente ou número do pedido (debounce 400ms)
- Status múltiplos: Aprovado, Recusado, Reembolsado, Processando
- Categoria do produto
- Estado do cliente (UF)
- Período de data (início / fim, formato `YYYY-MM-DD`)
- Faixa de valor (min/max)
- Dentro do prazo (boolean)

**Modais:** `OrderFormModal` (criação/edição admin), `TicketDetailModal` (visualização)

---

## Página: Suporte (`/suporte`)

**Arquivo:** `src/pages/Support.tsx`

**Hooks:** `useSupport`, `useSupportMutations`

**Filtros disponíveis:**
- Busca por cliente, ticket ou tipo (debounce 400ms)
- Tipo: Entrega, Reembolso, Produto, Pagamento
- Status: Aberto, Resolvido
- SLA estourado (boolean)
- Data de abertura mínima
- Satisfação do atendimento: alta, media, baixa, sem_avaliacao

**Modais:** `TicketFormModal` (criação/edição), `TicketDetailModal` (visualização)

---

## Página: Login (`/login`)

**Arquivo:** `src/pages/Login.tsx`

Formulário simples: e-mail + senha. Chama `api.post("/auth/login", { email, password })`, armazena o JWT no `localStorage` e chama `onLogin(email, name)` para atualizar o estado de sessão no `App.tsx`.

Se o usuário já está autenticado ao acessar `/login`, é redirecionado para `/`.

---

## Padrão de Estado de UI por Página

Todas as páginas listagem seguem o mesmo padrão:

```typescript
const [search, setSearch] = useState("")
const [advancedFilter, setAdvancedFilter] = useState(DEFAULT_FILTER)
const [filterOpen, setFilterOpen] = useState(false)
const [currentPage, setCurrentPage] = useState(1)
const [pageSize, setPageSize] = usePersistedPageSize("<chave>")
const [editingId, setEditingId] = useState<string | null>(null)
const [viewingId, setViewingId] = useState<string | null>(null)
const [sortBy, setSortBy] = useState<string | undefined>(undefined)
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [hooks.md](hooks.md) | ← usa | Dados e mutações via hooks TanStack Query |
| [componentes.md](componentes.md) | ← usa | Todas as tabelas, modais, toolbars e badges |
| [tipos.md](tipos.md) | ← usa | Tipagem dos dados e filtros |
| [helpers.md](helpers.md) | ← usa | Exportação CSV e formatação de labels |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/pages/Dashboard.tsx` | KPIs, gráfico de receita, insight cards |
| `src/pages/Products.tsx` | CRUD de produtos, highlight cards, detalhes |
| `src/pages/Clients.tsx` | CRUD de clientes, perfil 360°, stats |
| `src/pages/Orders.tsx` | CRUD de pedidos, resumo de status |
| `src/pages/Support.tsx` | CRUD de tickets, controle de SLA |
| `src/pages/Login.tsx` | Autenticação, callback onLogin |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
