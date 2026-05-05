import { useState } from "react"
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
  type LucideIcon,
} from "lucide-react"

type PageKey = "dashboard" | "orders" | "support"

type NavItem = {
  id?: PageKey
  label: string
  icon: LucideIcon
}

type MetricTone = "rose" | "emerald" | "indigo" | "violet"

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
  status: "Processando" | "Entregue" | "Cancelado" | "Em trânsito"
  quantity: string
}

type SupportRow = {
  ticket: string
  customer: string
  type: "Pagamento" | "Delay" | "Reembolso"
  createdAt: string
  resolvedIn: string
  rating: string
  ratingLabel: "Otimo" | "Bom" | "Excelente" | "Critico"
}

const pageTitles: Record<PageKey, string> = {
  dashboard: "Dashboard",
  orders: "Pedidos",
  support: "Suporte",
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Pedidos", icon: Tag },
  { id: "support", label: "Suporte", icon: HeartHandshake },
]

const dashboardMetrics: Metric[] = [
  {
    label: "Receita Total",
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
    value: "312",
    helper: "Pedidos processados",
    tone: "indigo",
    icon: Tag,
  },
  {
    label: "Tickets resolvidos hoje",
    value: "81",
    helper: "Tickets",
    tone: "violet",
    icon: Heart,
  },
]

const ordersMetrics: Metric[] = [
  {
    label: "Pedidos pendentes",
    value: "12",
    helper: "Em processamento",
    tone: "indigo",
    icon: Users,
  },
  {
    label: "Total de pedidos",
    value: "312",
    helper: "Pedidos processados",
    tone: "indigo",
    icon: Smile,
  },
  {
    label: "Receita total",
    value: "R$150K",
    helper: "+20% vs mês anterior",
    tone: "rose",
    icon: Users,
  },
  {
    label: "Pedidos entregues",
    value: "2.148",
    helper: "+47% vs último mês",
    tone: "emerald",
    icon: Heart,
  },
]

const supportMetrics: Metric[] = [
  {
    label: "Pedidos resolvidos",
    value: "6.783",
    helper: "+3% vs mês anterior",
    tone: "emerald",
    icon: Users,
  },
  {
    label: "Pedidos em aberto",
    value: "4.6/5.0",
    helper: "+12% NPS médio",
    tone: "emerald",
    icon: Smile,
  },
  {
    label: "Pedidos em andamento",
    value: "312",
    helper: "Pedidos processados",
    tone: "indigo",
    icon: Users,
  },
  {
    label: "Tickets resolvidos hoje",
    value: "81",
    helper: "Tickets",
    tone: "violet",
    icon: Heart,
  },
]

const orderSummary = [
  { label: "47%", value: "Entregues", width: "47%", color: "bg-emerald-500" },
  { label: "16%", value: "Em trânsito", width: "16%", color: "bg-amber-400" },
  { label: "37%", value: "Processando", width: "37%", color: "bg-indigo-600" },
  { label: "1%", value: "Cancelados", width: "7%", color: "bg-rose-500" },
]

const deliveryCards = [
  { label: "Entregues", value: "987", detail: "pedidos", color: "bg-emerald-500" },
  { label: "Em trânsito", value: "340", detail: "pedidos", color: "bg-amber-400" },
  { label: "Processando", value: "777", detail: "pedidos", color: "bg-indigo-600" },
  { label: "Cancelados", value: "12", detail: "pedidos", color: "bg-rose-500" },
]

const orderRows: OrderRow[] = [
  {
    id: "PROD-0001",
    product: "Perfume Premium",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 32309,95",
    stock: "9.999",
    date: "29/12/2026",
    status: "Processando",
    quantity: "1x",
  },
  {
    id: "PROD-0002",
    product: "Conjunto de Pincéis",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 47346,82",
    stock: "123",
    date: "123",
    status: "Entregue",
    quantity: "2x",
  },
  {
    id: "PROD-0003",
    product: "Barraca de Camping",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ -100",
    stock: "24",
    date: "24",
    status: "Cancelado",
    quantity: "6x",
  },
  {
    id: "PROD-0004",
    product: "Chupeta Premium",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 28506,95",
    stock: "53",
    date: "53",
    status: "Entregue",
    quantity: "3x",
  },
  {
    id: "PROD-0005",
    product: "Vassoura Mágica",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 19165,58",
    stock: "12",
    date: "12",
    status: "Em trânsito",
    quantity: "4x",
  },
  {
    id: "PROD-0006",
    product: "Violão Acústico",
    customer: "Nome do Cliente da Silva Júnior",
    value: "R$ 2215,40",
    stock: "72",
    date: "72",
    status: "Processando",
    quantity: "2x",
  },
]

const supportRows: SupportRow[] = [
  {
    ticket: "b388e879e-d3c6...",
    customer: "Nome do Cliente",
    type: "Pagamento",
    createdAt: "R$ 32309,95",
    resolvedIn: "28",
    rating: "4.5",
    ratingLabel: "Otimo",
  },
  {
    ticket: "b388e879e-d3c6...",
    customer: "Nome do Cliente",
    type: "Pagamento",
    createdAt: "R$ 47346,82",
    resolvedIn: "123",
    rating: "4.0",
    ratingLabel: "Bom",
  },
  {
    ticket: "b388e879e-d3c6...",
    customer: "Nome do Cliente",
    type: "Delay",
    createdAt: "R$ -100",
    resolvedIn: "24",
    rating: "4.5",
    ratingLabel: "Otimo",
  },
  {
    ticket: "b388e879e-d3c6...",
    customer: "Nome do Cliente",
    type: "Reembolso",
    createdAt: "R$ 28506,95",
    resolvedIn: "53",
    rating: "4.1",
    ratingLabel: "Bom",
  },
  {
    ticket: "b388e879e-d3c6...",
    customer: "Nome do Cliente",
    type: "Reembolso",
    createdAt: "R$ 19165,58",
    resolvedIn: "12",
    rating: "4.7",
    ratingLabel: "Excelente",
  },
  {
    ticket: "b388e879e-d3c6...",
    customer: "Nome do Cliente",
    type: "Delay",
    createdAt: "R$ 2215,40",
    resolvedIn: "72",
    rating: "3.9",
    ratingLabel: "Critico",
  },
]

const toneClasses: Record<MetricTone, string> = {
  rose: "text-rose-500",
  emerald: "text-emerald-500",
  indigo: "text-indigo-600",
  violet: "text-violet-600",
}

const statusClasses: Record<OrderRow["status"], string> = {
  Processando: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Entregue: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Cancelado: "bg-rose-50 text-rose-500 ring-rose-200",
  "Em trânsito": "bg-amber-50 text-amber-500 ring-amber-200",
}

const supportTypeClasses: Record<SupportRow["type"], string> = {
  Pagamento: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Delay: "bg-amber-50 text-amber-500 ring-amber-200",
  Reembolso: "bg-rose-50 text-rose-500 ring-rose-200",
}

const ratingClasses: Record<SupportRow["ratingLabel"], string> = {
  Otimo: "bg-amber-50 text-amber-500 ring-amber-200",
  Bom: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Excelente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Critico: "bg-rose-50 text-rose-500 ring-rose-200",
}

function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>("dashboard")

  return (
    <main className="min-h-screen bg-[#1f1f20] px-4 py-6 text-slate-900 md:px-5">
      <p
        className={[
          "mb-2 text-base font-medium",
          currentPage === "dashboard" ? "text-sky-400" : "text-neutral-500",
        ].join(" ")}
      >
        {pageTitles[currentPage]}
      </p>

      <section
        className={[
          "mx-auto min-h-[800px] max-w-[1180px] overflow-hidden bg-white shadow-2xl shadow-black/20",
          currentPage === "dashboard" ? "border-2 border-sky-400" : "border border-slate-200",
        ].join(" ")}
      >
        <div className="grid min-h-[800px] grid-cols-1 bg-[#fbfcff] md:grid-cols-[210px_1fr]">
          <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

          <div className="flex min-w-0 flex-col">
            <Header />
            {currentPage === "dashboard" && <Dashboard />}
            {currentPage === "orders" && <OrdersPage />}
            {currentPage === "support" && <SupportPage />}
          </div>
        </div>
      </section>
    </main>
  )
}

function Sidebar({
  currentPage,
  onNavigate,
}: {
  currentPage: PageKey
  onNavigate: (page: PageKey) => void
}) {
  return (
    <aside className="flex border-b border-slate-200 bg-white md:min-h-full md:flex-col md:border-b-0 md:border-r">
      <div className="hidden px-7 py-8 md:block">
        <div className="flex items-end gap-2">
          <span className="text-lg font-bold text-indigo-600">V-Commerce</span>
          <span className="pb-0.5 text-[10px] font-medium text-slate-500">CRM 360</span>
        </div>
      </div>

      <nav className="flex w-full gap-2 overflow-x-auto px-4 py-3 md:block md:px-4 md:py-0">
        {navItems.map((item) => (
          <NavButton
            key={item.label}
            active={item.id === currentPage}
            item={item}
            onNavigate={onNavigate}
          />
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
      aria-disabled={!item.id}
      className={[
        "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition md:mb-2 md:w-full",
        active
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        !item.id ? "cursor-default" : "",
      ].join(" ")}
      onClick={() => {
        if (item.id) {
          onNavigate(item.id)
        }
      }}
      type="button"
    >
      <Icon className="size-4" />
      {item.label}
    </button>
  )
}

function Header() {
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
          type="button"
        >
          <Bell className="size-4" />
        </button>

        <div className="flex items-center gap-3">
          <Avatar size="sm" />

          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none text-slate-900">Mariana Albuquerque</p>
            <p className="mt-1 text-xs text-slate-500">V-commerce CEO</p>
          </div>
        </div>
      </div>
    </header>
  )
}

function Dashboard() {
  return (
    <section className="relative flex-1 px-5 py-6 md:px-7">
      <PageTitle title="Dashboard" />

      <div className="grid gap-4 lg:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <RevenueChart />
        <OrderSummary />
      </div>

      <div className="mt-7 grid gap-4 xl:grid-cols-3">
        <InsightCard
          label="Pedidos no prazo"
          value="42,8%"
          badge="Crítico"
          badgeClassName="bg-rose-50 text-rose-500"
          icon={Clock3}
        />
        <InsightCard
          label="Produto mais vendido"
          value="IPhone 16 128GB"
          badge="1.487 unidades"
          badgeClassName="bg-emerald-50 text-emerald-500"
          icon={Smartphone}
        />
        <InsightCard
          label="Top região"
          value="São Paulo"
          badge="28% da fatura total"
          badgeClassName="bg-emerald-50 text-emerald-500"
          icon={MapPin}
        />
      </div>

      <FloatingAssistant />
    </section>
  )
}

function OrdersPage() {
  return (
    <section className="relative flex-1 px-5 py-6 md:px-7">
      <PageTitle title="Pedidos" />

      <div className="grid gap-4 lg:grid-cols-4">
        {ordersMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-7 rounded-lg border border-slate-200 bg-white shadow-sm">
        <TableToolbar
          actionLabel="Criar novo"
          icon={ClipboardList}
          label="Pedidos solicitados"
          placeholder="Busque por um produto, data ou status"
        />
        <OrdersTable />
      </div>

      <DecorativeAvatar />
      <FloatingAssistant />
    </section>
  )
}

function SupportPage() {
  return (
    <section className="relative flex-1 px-5 py-6 md:px-7">
      <PageTitle title="Suporte" />

      <div className="grid gap-4 lg:grid-cols-4">
        {supportMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="mt-7 rounded-lg border border-slate-200 bg-white shadow-sm">
        <TableToolbar
          actionLabel="Adicionar ticket"
          icon={ClipboardList}
          label="Tickets de suporte"
          placeholder="Busque por um produto, código ou categoria"
        />
        <SupportTable />
      </div>

      <FloatingAssistant />
    </section>
  )
}

function PageTitle({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
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

function RevenueChart() {
  return (
    <article className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/10">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <BarChart3 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-indigo-600">Gráfico de Renda</p>
            <p className="mt-0.5 text-xs text-slate-500">Hoje: 27 de abril de 2026</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-slate-400" />
            Mês passado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-indigo-600" />
            Mês atual
          </span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-[75%] top-2 z-10 hidden -translate-x-1/2 rounded-full bg-white p-1 shadow-lg ring-1 ring-slate-200 sm:block">
          <Avatar size="md" />
        </div>

        <div className="absolute left-[68%] top-20 z-10 hidden rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] shadow-lg shadow-slate-900/10 sm:block">
          <p className="mb-1 font-semibold text-slate-700">Comparativo mensal</p>
          <p className="flex items-center justify-between gap-5 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-500" />
              Março
            </span>
            <span className="font-medium text-slate-700">R$180K</span>
          </p>
          <p className="mt-1 flex items-center justify-between gap-5 text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-indigo-600" />
              Abril
            </span>
            <span className="font-medium text-slate-700">R$150K</span>
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

        <button className="flex h-8 w-fit items-center gap-2 rounded-full bg-slate-950 px-5 text-xs font-semibold text-white transition hover:bg-slate-800">
          Exportar relatório
          <Download className="size-3.5" />
        </button>
      </div>
    </article>
  )
}

function OrderSummary() {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
          <ShoppingCart className="size-4" />
        </span>
        <p className="text-sm font-semibold text-indigo-600">Resumo dos pedidos</p>
      </div>

      <div className="space-y-3">
        {orderSummary.map((item) => (
          <div key={item.value} className="grid grid-cols-[1fr_34px] items-center gap-2">
            <div className="h-4 overflow-hidden rounded-sm bg-slate-100">
              <div className={`h-full rounded-sm ${item.color}`} style={{ width: item.width }} />
            </div>
            <span className="text-right text-xs font-semibold text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {deliveryCards.map((item) => (
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

function TableToolbar({
  actionLabel,
  icon: Icon,
  label,
  placeholder,
}: {
  actionLabel: string
  icon: LucideIcon
  label: string
  placeholder: string
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
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
            placeholder={placeholder}
            type="search"
          />
        </label>

        <button className="flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          <SlidersHorizontal className="size-4" />
          Filter
        </button>

        <button className="flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800">
          <Plus className="size-4" />
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

function OrdersTable() {
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
          {orderRows.map((row) => (
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
      <TablePagination />
    </div>
  )
}

function SupportTable() {
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
          {supportRows.map((row, index) => (
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
                <button className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500">
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <TablePagination />
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

function TablePagination() {
  return (
    <div className="flex min-w-[900px] flex-col gap-3 px-5 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <button className="font-medium transition hover:text-indigo-600">Anterior</button>
        <button className="font-medium transition hover:text-indigo-600">1</button>
        <button className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white font-medium shadow-sm">2</button>
        <button className="font-medium transition hover:text-indigo-600">3</button>
        <button className="font-medium transition hover:text-indigo-600">4</button>
        <span>...</span>
        <button className="font-medium transition hover:text-indigo-600">10</button>
        <button className="font-medium transition hover:text-indigo-600">Próximo</button>
      </div>
      <p className="text-slate-600">Mostrando 6 de 1.000 resultados</p>
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
  label,
  value,
  badge,
  badgeClassName,
  icon: Icon,
}: {
  label: string
  value: string
  badge: string
  badgeClassName: string
  icon: LucideIcon
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

function Avatar({ size }: { size: "sm" | "md" | "lg" }) {
  const sizeClass = {
    sm: "size-9",
    md: "size-11",
    lg: "size-16",
  }[size]

  return (
    <div className="relative">
      <div
        className={`${sizeClass} grid place-items-center overflow-hidden rounded-full border-2 border-white bg-[linear-gradient(135deg,#0f766e_0%,#eab308_37%,#f8d7ad_38%,#7c2d12_67%,#0f172a_68%)] shadow-md`}
      >
        <span className="translate-y-2 text-[10px] font-bold text-white">MA</span>
      </div>
      {size === "sm" && (
        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  )
}

function DecorativeAvatar() {
  return (
    <>
      <div className="absolute left-[28%] top-[190px] hidden rounded-full bg-white p-1 shadow-lg ring-1 ring-slate-200 xl:block">
        <Avatar size="md" />
      </div>
      <div className="absolute -right-6 top-[170px] hidden rounded-full bg-white p-4 shadow-xl ring-1 ring-slate-200 xl:block">
        <Avatar size="lg" />
      </div>
    </>
  )
}

function FloatingAssistant() {
  return (
    <button
      aria-label="Assistente inteligente"
      className="absolute bottom-7 right-5 grid size-16 place-items-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/35 transition hover:-translate-y-0.5 hover:bg-indigo-500 md:right-7"
      type="button"
    >
      <Sparkles className="size-7" />
    </button>
  )
}

export default App
