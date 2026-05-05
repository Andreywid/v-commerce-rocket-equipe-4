import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpDown,
  BarChart3,
  Bell,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Download,
  Heart,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  MapPin,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Smile,
  Sparkles,
  Tag,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

type PageKey = "dashboard" | "orders" | "support"
type MetricTone = "rose" | "emerald" | "indigo" | "violet"
type OrderStatus = "Processando" | "Entregue" | "Cancelado" | "Em trânsito"
type SupportType = "Pagamento" | "Atraso" | "Reembolso"
type RatingLabel = "Ótimo" | "Bom" | "Excelente" | "Crítico"

type NavItem = {
  id: PageKey
  label: string
  icon: LucideIcon
}

type Metric = {
  label: string
  value: string
  helper: string
  tone: MetricTone
  icon: LucideIcon
}

type OrderRow = {
  id: string
  product: string
  customer: string
  value: string
  stock: string
  date: string
  status: OrderStatus
  quantity: string
}

type SupportRow = {
  ticket: string
  customer: string
  type: SupportType
  createdAt: string
  resolvedIn: string
  rating: string
  ratingLabel: RatingLabel
}

type OrderFormValues = Omit<OrderRow, "id">
type SupportFormValues = Omit<SupportRow, "ticket">
type FilterValue<T extends string> = "Todos" | T
type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: Tag },
  { id: "support", label: "Suporte", icon: HeartHandshake },
]

const orderStatusOptions: OrderStatus[] = ["Processando", "Entregue", "Cancelado", "Em trânsito"]
const supportTypeOptions: SupportType[] = ["Pagamento", "Atraso", "Reembolso"]
const ratingLabelOptions: RatingLabel[] = ["Ótimo", "Bom", "Excelente", "Crítico"]

const ordersStorageKey = "v-commerce-orders"
const supportStorageKey = "v-commerce-support-tickets"

const initialOrders: OrderRow[] = [
  {
    id: "PROD-0001",
    product: "Perfume Premium",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 32.309,95",
    stock: "9.999",
    date: "29/12/2026",
    status: "Processando",
    quantity: "1x",
  },
  {
    id: "PROD-0002",
    product: "Conjunto de Pincéis",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 47.346,82",
    stock: "123",
    date: "12/04/2026",
    status: "Entregue",
    quantity: "2x",
  },
  {
    id: "PROD-0003",
    product: "Barraca de Camping",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 899,90",
    stock: "24",
    date: "24/04/2026",
    status: "Cancelado",
    quantity: "6x",
  },
  {
    id: "PROD-0004",
    product: "Chupeta Premium",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 28.506,95",
    stock: "53",
    date: "25/04/2026",
    status: "Entregue",
    quantity: "3x",
  },
  {
    id: "PROD-0005",
    product: "Vassoura Mágica",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 19.165,58",
    stock: "12",
    date: "26/04/2026",
    status: "Em trânsito",
    quantity: "4x",
  },
  {
    id: "PROD-0006",
    product: "Violão Acústico",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 2.215,40",
    stock: "72",
    date: "27/04/2026",
    status: "Processando",
    quantity: "2x",
  },
]

const initialSupportTickets: SupportRow[] = [
  {
    ticket: "TCK-0001",
    customer: "Nome do Cliente",
    type: "Pagamento",
    createdAt: "28/04/2026",
    resolvedIn: "2h",
    rating: "4.5",
    ratingLabel: "Ótimo",
  },
  {
    ticket: "TCK-0002",
    customer: "Nome do Cliente",
    type: "Pagamento",
    createdAt: "28/04/2026",
    resolvedIn: "4h",
    rating: "4.0",
    ratingLabel: "Bom",
  },
  {
    ticket: "TCK-0003",
    customer: "Nome do Cliente",
    type: "Atraso",
    createdAt: "29/04/2026",
    resolvedIn: "24h",
    rating: "4.5",
    ratingLabel: "Ótimo",
  },
  {
    ticket: "TCK-0004",
    customer: "Nome do Cliente",
    type: "Reembolso",
    createdAt: "30/04/2026",
    resolvedIn: "53h",
    rating: "4.1",
    ratingLabel: "Bom",
  },
  {
    ticket: "TCK-0005",
    customer: "Nome do Cliente",
    type: "Reembolso",
    createdAt: "01/05/2026",
    resolvedIn: "12h",
    rating: "4.7",
    ratingLabel: "Excelente",
  },
  {
    ticket: "TCK-0006",
    customer: "Nome do Cliente",
    type: "Atraso",
    createdAt: "02/05/2026",
    resolvedIn: "72h",
    rating: "3.9",
    ratingLabel: "Crítico",
  },
]

const emptyOrderForm: OrderFormValues = {
  product: "",
  customer: "",
  value: "",
  stock: "",
  date: "",
  status: "Processando",
  quantity: "",
}

const emptySupportForm: SupportFormValues = {
  customer: "",
  type: "Pagamento",
  createdAt: "",
  resolvedIn: "",
  rating: "",
  ratingLabel: "Bom",
}

const toneClasses: Record<MetricTone, string> = {
  rose: "text-rose-500",
  emerald: "text-emerald-500",
  indigo: "text-indigo-600",
  violet: "text-violet-600",
}

const statusClasses: Record<OrderStatus, string> = {
  Processando: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Entregue: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Cancelado: "bg-rose-50 text-rose-500 ring-rose-200",
  "Em trânsito": "bg-amber-50 text-amber-500 ring-amber-200",
}

const supportTypeClasses: Record<SupportType, string> = {
  Pagamento: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Atraso: "bg-amber-50 text-amber-500 ring-amber-200",
  Reembolso: "bg-rose-50 text-rose-500 ring-rose-200",
}

const ratingClasses: Record<RatingLabel, string> = {
  Ótimo: "bg-amber-50 text-amber-500 ring-amber-200",
  Bom: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Excelente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Crítico: "bg-rose-50 text-rose-500 ring-rose-200",
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard")
  const [orders, setOrders] = useState<OrderRow[]>(() => readStoredRows(ordersStorageKey, initialOrders))
  const [tickets, setTickets] = useState<SupportRow[]>(() => readStoredRows(supportStorageKey, initialSupportTickets))
  const [orderSearch, setOrderSearch] = useState("")
  const [ticketSearch, setTicketSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState<FilterValue<OrderStatus>>("Todos")
  const [ticketTypeFilter, setTicketTypeFilter] = useState<FilterValue<SupportType>>("Todos")
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null)
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    localStorage.setItem(ordersStorageKey, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(supportStorageKey, JSON.stringify(tickets))
  }, [tickets])

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = rowIncludes(order, orderSearch)
        const matchesStatus = orderStatusFilter === "Todos" || order.status === orderStatusFilter
        return matchesSearch && matchesStatus
      }),
    [orderSearch, orderStatusFilter, orders],
  )

  const filteredTickets = useMemo(
    () =>
      tickets
        .map((ticket, index) => ({ ticket, index }))
        .filter(({ ticket }) => {
          const matchesSearch = rowIncludes(ticket, ticketSearch)
          const matchesType = ticketTypeFilter === "Todos" || ticket.type === ticketTypeFilter
          return matchesSearch && matchesType
        }),
    [ticketSearch, ticketTypeFilter, tickets],
  )

  const dashboardMetrics = getDashboardMetrics(orders, tickets)
  const ordersMetrics = getOrdersMetrics(orders)
  const supportMetrics = getSupportMetrics(tickets)

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 1800)
  }

  function addOrder(values: OrderFormValues) {
    setOrders((current) => [{ id: createOrderId(current), ...values }, ...current])
    setIsOrderModalOpen(false)
    showNotice("Pedido adicionado")
  }

  function addTicket(values: SupportFormValues) {
    setTickets((current) => [{ ticket: createTicketId(current), ...values }, ...current])
    setIsTicketModalOpen(false)
    showNotice("Ticket adicionado")
  }

  function updateTicket(values: SupportFormValues) {
    if (editingTicketIndex === null) return

    setTickets((current) =>
      current.map((ticket, index) => (index === editingTicketIndex ? { ...ticket, ...values } : ticket)),
    )
    setEditingTicketIndex(null)
    showNotice("Ticket atualizado")
  }

  return (
    <main className="min-h-dvh w-full bg-[#fbfcff] text-slate-900">
      <div className="grid min-h-dvh w-full grid-cols-1 bg-[#fbfcff] md:grid-cols-[270px_1fr]">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

        <div className="flex min-w-0 flex-col">
          <Header onNotify={() => showNotice("Nenhuma nova notificação")} />
          {currentPage === "dashboard" && (
            <Dashboard metrics={dashboardMetrics} onExport={() => showNotice("Relatório exportado")} />
          )}
          {currentPage === "orders" && (
            <OrdersPage
              filteredOrders={filteredOrders}
              metrics={ordersMetrics}
              onAddOrder={() => setIsOrderModalOpen(true)}
              orderSearch={orderSearch}
              orderStatusFilter={orderStatusFilter}
              ordersCount={orders.length}
              setOrderSearch={setOrderSearch}
              setOrderStatusFilter={setOrderStatusFilter}
            />
          )}
          {currentPage === "support" && (
            <SupportPage
              filteredTickets={filteredTickets}
              metrics={supportMetrics}
              onAddTicket={() => setIsTicketModalOpen(true)}
              onEditTicket={setEditingTicketIndex}
              setTicketSearch={setTicketSearch}
              setTicketTypeFilter={setTicketTypeFilter}
              ticketSearch={ticketSearch}
              ticketTypeFilter={ticketTypeFilter}
              ticketsCount={tickets.length}
            />
          )}
        </div>
      </div>

      <FloatingAssistant onClick={() => setIsAssistantOpen(true)} />
      {notice && <Notice message={notice} />}

      {isOrderModalOpen && <OrderFormModal onClose={() => setIsOrderModalOpen(false)} onSubmit={addOrder} />}
      {isTicketModalOpen && (
        <SupportFormModal onClose={() => setIsTicketModalOpen(false)} onSubmit={addTicket} title="Adicionar ticket" />
      )}
      {editingTicketIndex !== null && (
        <SupportFormModal
          initialValues={tickets[editingTicketIndex]}
          onClose={() => setEditingTicketIndex(null)}
          onSubmit={updateTicket}
          title="Editar ticket"
        />
      )}
      {isAssistantOpen && (
        <AssistantPanel
          currentPage={currentPage}
          onClose={() => setIsAssistantOpen(false)}
          orders={orders}
          tickets={tickets}
        />
      )}
    </main>
  )
}

function Sidebar({ currentPage, onNavigate }: { currentPage: PageKey; onNavigate: (page: PageKey) => void }) {
  return (
    <aside className="flex border-b border-slate-200 bg-white md:min-h-screen md:flex-col md:border-b-0 md:border-r">
      <div className="hidden px-8 py-8 md:block">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold leading-tight text-indigo-600">V-Commerce</span>
          <span className="text-[11px] font-semibold text-slate-500">CRM 360</span>
        </div>
      </div>

      <nav className="flex w-full gap-2 overflow-x-auto px-4 py-3 md:block md:px-4 md:py-0">
        {navItems.map((item) => (
          <NavButton key={item.id} active={item.id === currentPage} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <button className="mt-auto hidden h-11 items-center gap-3 px-7 text-sm font-medium text-slate-600 transition hover:text-indigo-600 md:flex">
        <LogOut className="size-4" />
        Sair
      </button>
    </aside>
  )
}

function NavButton({
  active,
  item,
  onNavigate,
}: {
  active: boolean
  item: NavItem
  onNavigate: (page: PageKey) => void
}) {
  const Icon = item.icon

  return (
    <button
      className={[
        "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition md:mb-2 md:w-full",
        active
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      ].join(" ")}
      onClick={() => onNavigate(item.id)}
      type="button"
    >
      <Icon className="size-4" />
      {item.label}
    </button>
  )
}

function Header({ onNotify }: { onNotify: () => void }) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-7">
      <div className="md:hidden">
        <div className="flex items-end gap-1.5">
          <span className="text-base font-bold text-indigo-600">V-Commerce</span>
          <span className="pb-0.5 text-[9px] font-medium text-slate-500">CRM 360</span>
        </div>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-5">
        <button
          aria-label="Notificações"
          className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={onNotify}
          type="button"
        >
          <Bell className="size-4" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none text-slate-900">Mariana Albuquerque</p>
          <p className="mt-1 text-xs text-slate-500">V-Commerce CEO</p>
        </div>
      </div>
    </header>
  )
}

function Dashboard({ metrics, onExport }: { metrics: Metric[]; onExport: () => void }) {
  return (
    <PageShell title="Dashboard">
      <MetricGrid metrics={metrics} />

      <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <RevenueChart onExport={onExport} />
        <OrderSummary />
      </div>

      <div className="mt-7 grid gap-4 xl:grid-cols-3">
        <InsightCard
          badge="Crítico"
          badgeClassName="bg-rose-50 text-rose-500"
          icon={Clock3}
          label="Pedidos no prazo"
          value="42,8%"
        />
        <InsightCard
          badge="1.487 unidades"
          badgeClassName="bg-emerald-50 text-emerald-500"
          icon={Smartphone}
          label="Produto mais vendido"
          value="iPhone 16 128GB"
        />
        <InsightCard
          badge="28% do faturamento"
          badgeClassName="bg-emerald-50 text-emerald-500"
          icon={MapPin}
          label="Top região"
          value="São Paulo"
        />
      </div>
    </PageShell>
  )
}

function OrdersPage({
  filteredOrders,
  metrics,
  onAddOrder,
  orderSearch,
  orderStatusFilter,
  ordersCount,
  setOrderSearch,
  setOrderStatusFilter,
}: {
  filteredOrders: OrderRow[]
  metrics: Metric[]
  onAddOrder: () => void
  orderSearch: string
  orderStatusFilter: FilterValue<OrderStatus>
  ordersCount: number
  setOrderSearch: (value: string) => void
  setOrderStatusFilter: (value: FilterValue<OrderStatus>) => void
}) {
  return (
    <PageShell title="Pedidos">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Criar novo"
          filterLabel="Status"
          filterOptions={["Todos", ...orderStatusOptions]}
          filterValue={orderStatusFilter}
          icon={ClipboardList}
          label="Pedidos solicitados"
          onAction={onAddOrder}
          onFilterChange={(value) => setOrderStatusFilter(value as FilterValue<OrderStatus>)}
          onSearchChange={setOrderSearch}
          placeholder="Busque por produto, cliente, data ou status"
          searchValue={orderSearch}
        />
        <OrdersTable rows={filteredOrders} totalCount={ordersCount} />
      </DataPanel>
    </PageShell>
  )
}

function SupportPage({
  filteredTickets,
  metrics,
  onAddTicket,
  onEditTicket,
  setTicketSearch,
  setTicketTypeFilter,
  ticketSearch,
  ticketTypeFilter,
  ticketsCount,
}: {
  filteredTickets: Array<{ ticket: SupportRow; index: number }>
  metrics: Metric[]
  onAddTicket: () => void
  onEditTicket: (index: number) => void
  setTicketSearch: (value: string) => void
  setTicketTypeFilter: (value: FilterValue<SupportType>) => void
  ticketSearch: string
  ticketTypeFilter: FilterValue<SupportType>
  ticketsCount: number
}) {
  return (
    <PageShell title="Suporte">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar ticket"
          filterLabel="Tipo"
          filterOptions={["Todos", ...supportTypeOptions]}
          filterValue={ticketTypeFilter}
          icon={ClipboardList}
          label="Tickets de suporte"
          onAction={onAddTicket}
          onFilterChange={(value) => setTicketTypeFilter(value as FilterValue<SupportType>)}
          onSearchChange={setTicketSearch}
          placeholder="Busque por ticket, cliente, tipo ou avaliação"
          searchValue={ticketSearch}
        />
        <SupportTable onEditTicket={onEditTicket} rows={filteredTickets} totalCount={ticketsCount} />
      </DataPanel>
    </PageShell>
  )
}

function PageShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="relative flex-1 px-5 py-6 md:px-7">
      <h1 className="mb-6 text-xl font-bold text-slate-800">{title}</h1>
      {children}
    </section>
  )
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  )
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon

  return (
    <article className="flex min-h-[78px] items-center justify-between rounded-lg border border-slate-200 bg-white px-5 shadow-sm">
      <div>
        <p className="text-xs font-semibold text-indigo-600">{metric.label}</p>
        <p className="mt-1 text-lg font-bold leading-tight text-slate-900">{metric.value}</p>
        <p className={`mt-2 text-xs font-medium ${toneClasses[metric.tone]}`}>{metric.helper}</p>
      </div>

      <div className="grid size-8 place-items-center rounded-full bg-indigo-100 text-indigo-600">
        <Icon className="size-4" />
      </div>
    </article>
  )
}

function RevenueChart({ onExport }: { onExport: () => void }) {
  return (
    <article className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/10">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <BarChart3 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-indigo-600">Gráfico de renda</p>
            <p className="mt-0.5 text-xs text-slate-500">Hoje: 27 de abril de 2026</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
          <ChartLegend color="bg-slate-400" label="Mês passado" />
          <ChartLegend color="bg-indigo-600" label="Mês atual" />
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[68%] top-20 z-10 hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] shadow-lg shadow-slate-900/10 sm:block">
          <p className="mb-1 font-semibold text-slate-700">Comparativo mensal</p>
          <p className="flex items-center justify-between gap-5 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-500" />
              Março
            </span>
            <span className="font-medium text-slate-700">R$ 180K</span>
          </p>
          <p className="mt-1 flex items-center justify-between gap-5 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              Abril
            </span>
            <span className="font-medium text-slate-700">R$ 150K</span>
          </p>
        </div>

        <svg
          aria-label="Comparativo de renda mensal"
          className="h-[210px] w-full overflow-visible"
          role="img"
          viewBox="0 0 720 220"
        >
          <defs>
            <linearGradient id="lastMonthFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#dbe5f1" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#eef3f9" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="currentMonthFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.08" />
            </linearGradient>
          </defs>
          <path d="M0 187H720" stroke="#e7ebf2" />
          <path
            d="M0 145C88 91 137 79 203 91C275 104 339 151 426 153C511 156 591 128 720 135V187H0Z"
            fill="url(#lastMonthFill)"
          />
          <path
            d="M0 145C88 91 137 79 203 91C275 104 339 151 426 153C511 156 591 128 720 135"
            fill="none"
            stroke="#8ea4c1"
            strokeWidth="1.4"
          />
          <path
            d="M0 177C82 151 127 144 185 151C251 159 299 177 365 169C433 161 475 149 542 161C601 172 649 172 720 166V187H0Z"
            fill="url(#currentMonthFill)"
          />
          <path
            d="M0 177C82 151 127 144 185 151C251 159 299 177 365 169C433 161 475 149 542 161C601 172 649 172 720 166"
            fill="none"
            stroke="#5b55ff"
            strokeWidth="2"
          />
          <circle cx="604" cy="172" fill="#4f46e5" r="3.5" />
          <circle cx="604" cy="126" fill="#8ea4c1" r="3.5" />
          <line stroke="#d6dce7" strokeDasharray="4 6" x1="604" x2="604" y1="49" y2="187" />
        </svg>

        <div className="mt-1 grid grid-cols-15 text-center text-[10px] text-slate-500">
          {["2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30"].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <span className="size-2 rounded-full bg-emerald-500" />
          Março teve o melhor impacto na sua renda, cerca de 92% de aumento.
        </p>

        <button
          className="flex h-8 w-fit items-center gap-2 rounded-full bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800"
          onClick={onExport}
          type="button"
        >
          Exportar relatório
          <Download className="size-3.5" />
        </button>
      </div>
    </article>
  )
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

function OrderSummary() {
  const summary = [
    { label: "47%", value: "Entregues", width: "47%", color: "bg-emerald-500" },
    { label: "16%", value: "Em trânsito", width: "16%", color: "bg-amber-400" },
    { label: "37%", value: "Processando", width: "37%", color: "bg-indigo-600" },
    { label: "1%", value: "Cancelados", width: "7%", color: "bg-rose-500" },
  ]

  const cards = [
    { label: "Entregues", value: "987", detail: "pedidos", color: "bg-emerald-500" },
    { label: "Em trânsito", value: "340", detail: "pedidos", color: "bg-amber-400" },
    { label: "Processando", value: "777", detail: "pedidos", color: "bg-indigo-600" },
    { label: "Cancelados", value: "12", detail: "pedidos", color: "bg-rose-500" },
  ]

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
          <ShoppingCart className="size-4" />
        </span>
        <p className="text-sm font-semibold text-indigo-600">Resumo dos pedidos</p>
      </div>

      <div className="space-y-3">
        {summary.map((item) => (
          <div key={item.value} className="grid grid-cols-[1fr_34px] items-center gap-2">
            <div className="h-4 overflow-hidden rounded-sm bg-slate-100">
              <div className={`h-full rounded-sm ${item.color}`} style={{ width: item.width }} />
            </div>
            <span className="text-right text-xs font-semibold text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {cards.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-200 p-3">
            <span className={`mb-3 block h-1 w-5 rounded-full ${item.color}`} />
            <p className="text-xs font-medium text-slate-600">{item.label}</p>
            <p className="mt-3 text-sm font-bold text-slate-900">
              {item.value} <span className="text-[10px] font-medium text-slate-400">{item.detail}</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

function DataPanel({ children }: { children: React.ReactNode }) {
  return <div className="mt-7 rounded-lg border border-slate-200 bg-white shadow-sm">{children}</div>
}

function TableToolbar({
  actionLabel,
  filterLabel,
  filterOptions,
  filterValue,
  icon: Icon,
  label,
  onAction,
  onFilterChange,
  onSearchChange,
  placeholder,
  searchValue,
}: {
  actionLabel: string
  filterLabel: string
  filterOptions: string[]
  filterValue: string
  icon: LucideIcon
  label: string
  onAction: () => void
  onFilterChange: (value: string) => void
  onSearchChange: (value: string) => void
  placeholder: string
  searchValue: string
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <Icon className="size-4" />
          </span>
          <p className="text-sm font-semibold text-indigo-600">{label}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-9 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 sm:w-[310px]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={placeholder}
              type="search"
              value={searchValue}
            />
          </label>

          <button
            className={[
              "flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
              filterValue === "Todos"
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "border-indigo-200 bg-indigo-50 text-indigo-600",
            ].join(" ")}
            onClick={() => setIsFilterOpen((current) => !current)}
            type="button"
          >
            <SlidersHorizontal className="size-4" />
            Filtro
          </button>

          <button
            className="flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={onAction}
            type="button"
          >
            <Plus className="size-4" />
            {actionLabel}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="text-xs font-semibold text-slate-500" htmlFor={`${label}-filter`}>
            {filterLabel}
          </label>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            id={`${label}-filter`}
            onChange={(event) => onFilterChange(event.target.value)}
            value={filterValue}
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {filterValue !== "Todos" && (
            <button
              className="h-9 rounded-md px-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
              onClick={() => onFilterChange("Todos")}
              type="button"
            >
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function OrdersTable({ rows, totalCount }: { rows: OrderRow[]; totalCount: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] table-fixed text-left">
        <thead>
          <tr className="h-12 border-b border-slate-200 text-sm text-slate-950">
            <TableHead className="w-[110px] pl-5">Pedido</TableHead>
            <TableHead className="w-[160px]">Produto</TableHead>
            <TableHead className="w-[250px]">Cliente</TableHead>
            <TableHead sortable className="w-[130px]">
              Valor
            </TableHead>
            <TableHead className="w-[100px]">Estoque</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px]">Quant.</TableHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="h-[58px] border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
              <td className="pl-5 font-medium text-slate-400">{row.id}</td>
              <td className="font-semibold text-slate-800">{row.product}</td>
              <td>{row.customer}</td>
              <td className="font-medium">{row.value}</td>
              <td>{row.stock}</td>
              <td>{row.date}</td>
              <td>
                <StatusBadge className={statusClasses[row.status]}>{row.status}</StatusBadge>
              </td>
              <td className="font-medium">{row.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum pedido encontrado." />}
      <TablePagination filteredCount={rows.length} totalCount={totalCount} />
    </div>
  )
}

function SupportTable({
  onEditTicket,
  rows,
  totalCount,
}: {
  onEditTicket: (index: number) => void
  rows: Array<{ ticket: SupportRow; index: number }>
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] table-fixed text-left">
        <thead>
          <tr className="h-12 border-b border-slate-200 text-sm text-slate-950">
            <TableHead sortable className="w-[170px] pl-5">
              Ticket
            </TableHead>
            <TableHead className="w-[160px]">Cliente</TableHead>
            <TableHead className="w-[130px]">Tipo</TableHead>
            <TableHead sortable className="w-[170px]">
              Data de criação
            </TableHead>
            <TableHead className="w-[150px]">Data de resolução</TableHead>
            <TableHead sortable className="w-[140px]">
              Avaliação
            </TableHead>
            <TableHead className="w-[90px]" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ticket: row, index }) => (
            <tr
              key={`${row.ticket}-${index}`}
              className="h-[58px] border-b border-slate-100 text-sm text-slate-700 last:border-b-0"
            >
              <td className="pl-5 font-semibold text-slate-800">{row.ticket}</td>
              <td>{row.customer}</td>
              <td>
                <StatusBadge className={supportTypeClasses[row.type]}>{row.type}</StatusBadge>
              </td>
              <td className="font-medium">{row.createdAt}</td>
              <td>{row.resolvedIn}</td>
              <td>
                <StatusBadge className={ratingClasses[row.ratingLabel]}>
                  {row.rating} {row.ratingLabel}
                </StatusBadge>
              </td>
              <td>
                <button
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  onClick={() => onEditTicket(index)}
                  type="button"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum ticket encontrado." />}
      <TablePagination filteredCount={rows.length} totalCount={totalCount} />
    </div>
  )
}

function TableHead({
  children,
  className = "",
  sortable = false,
}: {
  children?: React.ReactNode
  className?: string
  sortable?: boolean
}) {
  return (
    <th className={`font-semibold ${className}`}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && <ArrowUpDown className="size-3 text-slate-400" />}
      </span>
    </th>
  )
}

function EmptyTableState({ message }: { message: string }) {
  return (
    <div className="min-w-[900px] border-t border-slate-100 px-5 py-8 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  )
}

function TablePagination({ filteredCount, totalCount }: { filteredCount: number; totalCount: number }) {
  return (
    <div className="flex min-w-[900px] flex-col gap-3 px-5 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <button className="font-medium transition hover:text-indigo-600" type="button">
          Anterior
        </button>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          1
        </button>
        <button className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white font-medium shadow-sm" type="button">
          2
        </button>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          3
        </button>
        <span>...</span>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          10
        </button>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          Próximo
        </button>
      </div>
      <p className="text-slate-600">
        Mostrando {filteredCount} de {totalCount} resultados
      </p>
    </div>
  )
}

function StatusBadge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ${className}`}>
      {children}
    </span>
  )
}

function InsightCard({
  badge,
  badgeClassName,
  icon: Icon,
  label,
  value,
}: {
  badge: string
  badgeClassName: string
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="flex min-h-[66px] items-center justify-between rounded-lg border border-slate-200 bg-white px-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="hidden size-8 place-items-center rounded-full bg-slate-100 text-slate-500 sm:grid">
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold text-indigo-600">{label}</p>
          <p className="mt-2 text-base font-bold text-slate-900">{value}</p>
        </div>
      </div>

      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassName}`}>{badge}</span>
    </article>
  )
}

function OrderFormModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (values: OrderFormValues) => void
}) {
  const [form, setForm] = useState<OrderFormValues>(emptyOrderForm)

  return (
    <ModalFrame title="Criar novo pedido" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <FormInput label="Produto" onChange={(value) => setForm({ ...form, product: value })} value={form.product} />
        <FormInput label="Cliente" onChange={(value) => setForm({ ...form, customer: value })} value={form.customer} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Valor" onChange={(value) => setForm({ ...form, value })} placeholder="R$ 199,90" value={form.value} />
          <FormInput label="Estoque" onChange={(value) => setForm({ ...form, stock: value })} placeholder="24" value={form.stock} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Data" onChange={(value) => setForm({ ...form, date: value })} placeholder="05/05/2026" value={form.date} />
          <FormInput label="Quantidade" onChange={(value) => setForm({ ...form, quantity: value })} placeholder="1x" value={form.quantity} />
        </div>
        <FormSelect
          label="Status"
          onChange={(value) => setForm({ ...form, status: value as OrderStatus })}
          options={orderStatusOptions}
          value={form.status}
        />
        <ModalActions onClose={onClose} submitLabel="Adicionar pedido" />
      </form>
    </ModalFrame>
  )
}

function SupportFormModal({
  initialValues = emptySupportForm,
  onClose,
  onSubmit,
  title,
}: {
  initialValues?: SupportFormValues
  onClose: () => void
  onSubmit: (values: SupportFormValues) => void
  title: string
}) {
  const [form, setForm] = useState<SupportFormValues>(initialValues)

  return (
    <ModalFrame title={title} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <FormInput label="Cliente" onChange={(value) => setForm({ ...form, customer: value })} value={form.customer} />
        <FormSelect
          label="Tipo"
          onChange={(value) => setForm({ ...form, type: value as SupportType })}
          options={supportTypeOptions}
          value={form.type}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Data de criação" onChange={(value) => setForm({ ...form, createdAt: value })} value={form.createdAt} />
          <FormInput
            label="Data de resolução"
            onChange={(value) => setForm({ ...form, resolvedIn: value })}
            required={false}
            value={form.resolvedIn}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Avaliação" onChange={(value) => setForm({ ...form, rating: value })} placeholder="4.5" value={form.rating} />
          <FormSelect
            label="Classificação"
            onChange={(value) => setForm({ ...form, ratingLabel: value as RatingLabel })}
            options={ratingLabelOptions}
            value={form.ratingLabel}
          />
        </div>
        <ModalActions onClose={onClose} submitLabel={title === "Editar ticket" ? "Salvar alterações" : "Adicionar ticket"} />
      </form>
    </ModalFrame>
  )
}

function ModalFrame({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <section className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl shadow-slate-950/25">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function ModalActions({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        onClick={onClose}
        type="button"
      >
        Cancelar
      </button>
      <button className="h-10 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800" type="submit">
        {submitLabel}
      </button>
    </div>
  )
}

function FormInput({
  label,
  onChange,
  placeholder,
  required = true,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? label}
        required={required}
        value={value}
      />
    </label>
  )
}

function FormSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <select
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function FloatingAssistant({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Assistente inteligente"
      className="fixed bottom-7 right-5 z-30 grid size-16 place-items-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/35 transition hover:-translate-y-0.5 hover:bg-indigo-500 md:right-7"
      onClick={onClick}
      type="button"
    >
      <Sparkles className="size-7" />
    </button>
  )
}

function AssistantPanel({
  currentPage,
  onClose,
  orders,
  tickets,
}: {
  currentPage: PageKey
  onClose: () => void
  orders: OrderRow[]
  tickets: SupportRow[]
}) {
  const quickActions = ["Resumo geral", "Pedidos pendentes", "Tickets críticos", "Reembolsos"]
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant" as const,
      content: getAssistantSummary(currentPage, orders, tickets),
    },
  ])

  function sendMessage(message: string) {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user" as const, content: trimmedMessage },
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: getAssistantAnswer(trimmedMessage, currentPage, orders, tickets),
      },
    ])
    setQuestion("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/25 sm:bg-slate-950/20">
      <section className="flex h-[86dvh] w-full flex-col rounded-t-lg bg-white shadow-2xl shadow-slate-950/25 sm:mb-5 sm:mr-5 sm:h-[calc(100dvh-2.5rem)] sm:max-w-[420px] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-indigo-600">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assistente IA</h2>
              <p className="text-xs text-slate-500">Conversa sobre o CRM</p>
            </div>
          </div>
          <button
            aria-label="Fechar assistente"
            className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                key={message.id}
              >
                <p
                  className={[
                    "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6",
                    message.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map((action) => (
              <button
                className="h-8 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                key={action}
                onClick={() => sendMessage(action)}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(question)
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Pergunte sobre pedidos ou tickets"
              value={question}
            />
            <button
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}

function Notice({ message }: { message: string }) {
  return (
    <div className="fixed right-6 top-6 z-50 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">
      {message}
    </div>
  )
}

function getDashboardMetrics(orders: OrderRow[], tickets: SupportRow[]): Metric[] {
  return [
    {
      label: "Receita total",
      value: "R$ 150K",
      helper: "+20% vs mês anterior",
      tone: "rose",
      icon: CircleDollarSign,
    },
    {
      label: "Taxa de satisfação",
      value: "4.6/5.0",
      helper: "+12% NPS médio",
      tone: "emerald",
      icon: Smile,
    },
    {
      label: "Total de pedidos",
      value: String(orders.length),
      helper: "Pedidos cadastrados",
      tone: "indigo",
      icon: Tag,
    },
    {
      label: "Tickets resolvidos hoje",
      value: String(tickets.length),
      helper: "Tickets",
      tone: "violet",
      icon: Heart,
    },
  ]
}

function getOrdersMetrics(orders: OrderRow[]): Metric[] {
  const pendingOrders = orders.filter((order) => order.status === "Processando").length
  const deliveredOrders = orders.filter((order) => order.status === "Entregue").length

  return [
    {
      label: "Pedidos pendentes",
      value: String(pendingOrders),
      helper: "Em processamento",
      tone: "indigo",
      icon: Users,
    },
    {
      label: "Total de pedidos",
      value: String(orders.length),
      helper: "Pedidos cadastrados",
      tone: "indigo",
      icon: Smile,
    },
    {
      label: "Receita total",
      value: "R$ 150K",
      helper: "+20% vs mês anterior",
      tone: "rose",
      icon: CircleDollarSign,
    },
    {
      label: "Pedidos entregues",
      value: String(deliveredOrders),
      helper: "Concluídos",
      tone: "emerald",
      icon: Heart,
    },
  ]
}

function getSupportMetrics(tickets: SupportRow[]): Metric[] {
  const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico").length

  return [
    {
      label: "Tickets resolvidos",
      value: String(tickets.length),
      helper: "+3% vs mês anterior",
      tone: "emerald",
      icon: Users,
    },
    {
      label: "Satisfação média",
      value: "4.6/5.0",
      helper: "+12% NPS médio",
      tone: "emerald",
      icon: Smile,
    },
    {
      label: "Tickets críticos",
      value: String(criticalTickets),
      helper: "Atenção prioritária",
      tone: "rose",
      icon: Users,
    },
    {
      label: "Resolvidos hoje",
      value: String(tickets.length),
      helper: "Tickets",
      tone: "violet",
      icon: Heart,
    },
  ]
}

function getAssistantSummary(currentPage: PageKey, orders: OrderRow[], tickets: SupportRow[]) {
  const pendingOrders = orders.filter((order) => order.status === "Processando").length
  const transitOrders = orders.filter((order) => order.status === "Em trânsito").length
  const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico").length

  if (currentPage === "orders") {
    return `Você tem ${orders.length} pedidos cadastrados. ${pendingOrders} estão em processamento e ${transitOrders} estão em trânsito.`
  }

  if (currentPage === "support") {
    return `Você tem ${tickets.length} tickets cadastrados. ${criticalTickets} precisam de atenção crítica.`
  }

  return `Resumo geral: ${orders.length} pedidos, ${tickets.length} tickets e ${criticalTickets} ticket(s) críticos no suporte.`
}

function getAssistantAnswer(question: string, currentPage: PageKey, orders: OrderRow[], tickets: SupportRow[]) {
  const normalizedQuestion = normalizeText(question)

  if (!normalizedQuestion) {
    return getAssistantSummary(currentPage, orders, tickets)
  }

  if (normalizedQuestion.includes("pedido") || normalizedQuestion.includes("venda")) {
    const deliveredOrders = orders.filter((order) => order.status === "Entregue").length
    const canceledOrders = orders.filter((order) => order.status === "Cancelado").length

    return `Pedidos: ${orders.length} no total, ${deliveredOrders} entregues e ${canceledOrders} cancelados. Use o filtro de status para isolar cada grupo.`
  }

  if (normalizedQuestion.includes("ticket") || normalizedQuestion.includes("suporte")) {
    const refundTickets = tickets.filter((ticket) => ticket.type === "Reembolso").length
    const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico").length

    return `Suporte: ${tickets.length} tickets no total, ${refundTickets} sobre reembolso e ${criticalTickets} críticos. Tickets críticos merecem prioridade.`
  }

  if (normalizedQuestion.includes("critico") || normalizedQuestion.includes("problema")) {
    const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico")

    return criticalTickets.length
      ? `Encontrei ${criticalTickets.length} ticket(s) críticos. O primeiro é ${criticalTickets[0].ticket}, do cliente ${criticalTickets[0].customer}.`
      : "Não há tickets críticos agora."
  }

  return getAssistantSummary(currentPage, orders, tickets)
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function rowIncludes(row: Record<string, string>, search: string) {
  const normalizedSearch = normalizeText(search.trim())
  if (!normalizedSearch) return true

  return Object.values(row).some((value) => normalizeText(value).includes(normalizedSearch))
}

function readStoredRows<Row>(storageKey: string, fallback: Row[]) {
  try {
    const storedRows = localStorage.getItem(storageKey)
    return storedRows ? (JSON.parse(storedRows) as Row[]) : fallback
  } catch {
    return fallback
  }
}

function createOrderId(orders: OrderRow[]) {
  return `PROD-${String(orders.length + 1).padStart(4, "0")}`
}

function createTicketId(tickets: SupportRow[]) {
  return `TCK-${String(tickets.length + 1).padStart(4, "0")}`
}

export default App
