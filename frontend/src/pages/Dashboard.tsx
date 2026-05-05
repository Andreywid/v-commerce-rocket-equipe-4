import { BarChart3, Clock3, Download, MapPin, ShoppingCart, Smartphone } from "lucide-react"

import { useAppContext } from "@/context/AppContext"
import { getDashboardMetrics } from "@/helpers/metrics"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${color}`} />
      {label}
    </span>
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

function InsightCard({
  badge,
  badgeClassName,
  icon: Icon,
  label,
  value,
}: {
  badge: string
  badgeClassName: string
  icon: React.ElementType
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

export function Dashboard() {
  const { orders, tickets, showNotice } = useAppContext()
  const metrics = getDashboardMetrics(orders, tickets)

  return (
    <PageShell title="Dashboard">
      <MetricGrid metrics={metrics} />

      <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px]">
        <RevenueChart onExport={() => showNotice("Relatório exportado")} />
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
