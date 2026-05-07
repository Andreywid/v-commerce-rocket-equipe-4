import { useMemo } from "react"
import { BarChart3, Clock3, Download, MapPin, ShoppingCart, Smartphone } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { OrderRow } from "@/types"
import { useAppContext } from "@/context/AppContext"
import { getDashboardMetrics } from "@/helpers/metrics"
import { Button } from "@/components/ui/button"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"

// ── Dataset de receita mensal (R$ mil) — 30 dias ───────────────────────────
const revenueData = [
  { day: "1",  lastMonth: 105, currentMonth: 68 },
  { day: "2",  lastMonth: 118, currentMonth: 75 },
  { day: "3",  lastMonth: 138, currentMonth: 82 },
  { day: "4",  lastMonth: 162, currentMonth: 88 },
  { day: "5",  lastMonth: 178, currentMonth: 92 },
  { day: "6",  lastMonth: 192, currentMonth: 98 },
  { day: "7",  lastMonth: 185, currentMonth: 105 },
  { day: "8",  lastMonth: 172, currentMonth: 115 },
  { day: "9",  lastMonth: 162, currentMonth: 122 },
  { day: "10", lastMonth: 148, currentMonth: 118 },
  { day: "11", lastMonth: 138, currentMonth: 110 },
  { day: "12", lastMonth: 128, currentMonth: 98 },
  { day: "13", lastMonth: 140, currentMonth: 88 },
  { day: "14", lastMonth: 152, currentMonth: 82 },
  { day: "15", lastMonth: 162, currentMonth: 88 },
  { day: "16", lastMonth: 175, currentMonth: 95 },
  { day: "17", lastMonth: 170, currentMonth: 102 },
  { day: "18", lastMonth: 162, currentMonth: 108 },
  { day: "19", lastMonth: 155, currentMonth: 115 },
  { day: "20", lastMonth: 148, currentMonth: 120 },
  { day: "21", lastMonth: 140, currentMonth: 118 },
  { day: "22", lastMonth: 135, currentMonth: 115 },
  { day: "23", lastMonth: 148, currentMonth: 122 },
  { day: "24", lastMonth: 160, currentMonth: 130 },
  { day: "25", lastMonth: 172, currentMonth: 140 },
  { day: "26", lastMonth: 182, currentMonth: 150 },
  { day: "27", lastMonth: 188, currentMonth: 158 },
  { day: "28", lastMonth: 192, currentMonth: 162 },
  { day: "29", lastMonth: 190, currentMonth: 160 },
  { day: "30", lastMonth: 185, currentMonth: 155 },
]

// ── Componentes auxiliares ─────────────────────────────────────────────────
function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-sm ${color}`} />
      {label}
    </span>
  )
}

type TooltipPayloadEntry = { name: string; value: number; color: string }
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] shadow-lg shadow-slate-900/10">
      <p className="mb-1 font-semibold text-slate-700">Dia {label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-1 flex items-center justify-between gap-5 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </span>
          <span className="font-medium text-slate-700">R$ {entry.value}K</span>
        </p>
      ))}
    </div>
  )
}

// ── RevenueChart ───────────────────────────────────────────────────────────
function RevenueChart({ onExport }: { onExport: () => void }) {
  return (
    <article className="relative rounded-lg border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/10">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <BarChart3 className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-indigo-600">Gráfico de renda</p>
            <p className="mt-0.5 text-xs text-slate-500">Comparativo mensal — Março vs Abril</p>
          </div>
        </div>

        <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex">
          <ChartLegend color="bg-slate-400" label="Mês passado" />
          <ChartLegend color="bg-indigo-600" label="Mês atual" />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradLastMonth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dbe5f1" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#eef3f9" stopOpacity={0.65} />
            </linearGradient>
            <linearGradient id="gradCurrentMonth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.08} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#e7ebf2" vertical={false} />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            tickFormatter={(d: string) => (Number(d) % 2 === 0 ? d : "")}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}K`}
          />

          <Tooltip
            content={<RevenueTooltip />}
            cursor={{ stroke: "#d6dce7", strokeDasharray: "4 6" }}
          />

          <Area
            type="monotone"
            dataKey="lastMonth"
            name="Março"
            stroke="#8ea4c1"
            strokeWidth={1.4}
            fill="url(#gradLastMonth)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="currentMonth"
            name="Abril"
            stroke="#5b55ff"
            strokeWidth={2}
            fill="url(#gradCurrentMonth)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <span className="size-2 rounded-full bg-emerald-500" />
          Março teve o melhor impacto na sua renda, cerca de 92% de aumento.
        </p>
        <Button className="h-8 rounded-full px-5 text-xs" onClick={onExport} type="button">
          Exportar relatório
          <Download className="size-3.5" />
        </Button>
      </div>
    </article>
  )
}

// ── OrderSummary ───────────────────────────────────────────────────────────
function OrderSummary({ orders }: { orders: OrderRow[] }) {
  const total = Math.max(orders.length, 1)

  const counts = useMemo(
    () => ({
      delivered: orders.filter((o) => o.status === "Entregue").length,
      inTransit: orders.filter((o) => o.status === "Em trânsito").length,
      processing: orders.filter((o) => o.status === "Processando").length,
      cancelled: orders.filter((o) => o.status === "Cancelado").length,
    }),
    [orders],
  )

  const pct = (n: number) => `${Math.round((n / total) * 100)}%`
  const barW = (n: number) => `${n > 0 ? Math.max((n / total) * 100, 6) : 0}%`

  const summary = [
    { label: pct(counts.delivered), value: "Entregues", width: barW(counts.delivered), color: "bg-emerald-500" },
    { label: pct(counts.inTransit), value: "Em trânsito", width: barW(counts.inTransit), color: "bg-amber-400" },
    { label: pct(counts.processing), value: "Processando", width: barW(counts.processing), color: "bg-indigo-600" },
    { label: pct(counts.cancelled), value: "Cancelados", width: barW(counts.cancelled), color: "bg-rose-500" },
  ]

  const cards = [
    { label: "Entregues", value: String(counts.delivered), color: "bg-emerald-500" },
    { label: "Em trânsito", value: String(counts.inTransit), color: "bg-amber-400" },
    { label: "Processando", value: String(counts.processing), color: "bg-indigo-600" },
    { label: "Cancelados", value: String(counts.cancelled), color: "bg-rose-500" },
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
              <div
                className={`h-full rounded-sm transition-all duration-500 ${item.color}`}
                style={{ width: item.width }}
              />
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
              {item.value} <span className="text-[10px] font-medium text-slate-400">pedidos</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}

// ── InsightCard ────────────────────────────────────────────────────────────
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

// ── Dashboard (página) ─────────────────────────────────────────────────────
export function Dashboard() {
  const { orders, tickets, clients, showNotice } = useAppContext()
  const metrics = getDashboardMetrics(orders, tickets)

  const onTimeRate =
    orders.length > 0
      ? Math.round((orders.filter((o) => o.status === "Entregue").length / orders.length) * 100)
      : 0

  const { topProduct, topProductQty } = useMemo(() => {
    const sales: Record<string, number> = {}
    for (const o of orders) {
      const qty = parseInt(o.quantity.replace("x", ""), 10) || 1
      sales[o.product] = (sales[o.product] || 0) + qty
    }
    const sorted = Object.entries(sales).sort(([, a], [, b]) => b - a)
    return {
      topProduct: sorted[0]?.[0] ?? "—",
      topProductQty: sorted[0]?.[1] ?? 0,
    }
  }, [orders])

  const topRegion = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of clients) {
      const city = c.location.split(",")[0]
      counts[city] = (counts[city] || 0) + 1
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "São Paulo"
  }, [clients])

  const onTimeBadge =
    onTimeRate >= 75
      ? { text: "Ótimo", cls: "bg-emerald-50 text-emerald-500" }
      : onTimeRate >= 50
        ? { text: "Regular", cls: "bg-amber-50 text-amber-500" }
        : { text: "Crítico", cls: "bg-rose-50 text-rose-500" }

  return (
    <PageShell title="Dashboard">
      <MetricGrid metrics={metrics} />

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <RevenueChart onExport={() => showNotice("Relatório exportado")} />
        <OrderSummary orders={orders} />
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <InsightCard
          badge={onTimeBadge.text}
          badgeClassName={onTimeBadge.cls}
          icon={Clock3}
          label="Pedidos no prazo"
          value={`${onTimeRate}% entregues`}
        />
        <InsightCard
          badge={`${topProductQty} unid.`}
          badgeClassName="bg-emerald-50 text-emerald-500"
          icon={Smartphone}
          label="Produto mais pedido"
          value={topProduct}
        />
        <InsightCard
          badge="Mais pedidos"
          badgeClassName="bg-indigo-50 text-indigo-500"
          icon={MapPin}
          label="Top região"
          value={topRegion}
        />
      </div>
    </PageShell>
  )
}
