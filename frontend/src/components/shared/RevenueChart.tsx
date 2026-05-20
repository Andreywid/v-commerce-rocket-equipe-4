import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart3, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <text x="5.5" y="18.5" fontSize="5.5" fill="currentColor" stroke="none" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="0.3">PDF</text>
    </svg>
  )
}

export type RevenueChartPoint = {
  mes: string
  mesNum: number
  receitaAtual: number | null
  receitaAnterior: number | null
  pedidosAtual: number | null
  pedidosAnterior: number | null
  ticketAtual: number | null
  ticketAnterior: number | null
}

type Metric = "receita" | "pedidos" | "ticket"

const METRICS: Record<Metric, { label: string; atual: keyof RevenueChartPoint; anterior: keyof RevenueChartPoint; yFmt: (v: number) => string; tipFmt: (v: number) => string }> = {
  receita: {
    label: "Receita",
    atual: "receitaAtual",
    anterior: "receitaAnterior",
    yFmt: (v) => `${v}K`,
    tipFmt: (v) => `R$ ${v.toFixed(1)}K`,
  },
  pedidos: {
    label: "Pedidos",
    atual: "pedidosAtual",
    anterior: "pedidosAnterior",
    yFmt: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v)),
    tipFmt: (v) => v.toLocaleString("pt-BR"),
  },
  ticket: {
    label: "Ticket",
    atual: "ticketAtual",
    anterior: "ticketAnterior",
    yFmt: (v) => `R$${Math.round(v)}`,
    tipFmt: (v) => `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`,
  },
}

type TooltipEntry = { dataKey: string; value: number }

function ChartTooltip({
  active,
  payload,
  label,
  metric,
  anoAtual,
  anoAnterior,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  metric: Metric
  anoAtual: number
  anoAnterior: number
}) {
  if (!active || !payload?.length) return null

  const cfg = METRICS[metric]
  const atual    = payload.find((p) => p.dataKey === cfg.atual)
  const anterior = payload.find((p) => p.dataKey === cfg.anterior)
  const delta =
    atual?.value != null && anterior?.value != null && anterior.value !== 0
      ? ((atual.value - anterior.value) / anterior.value) * 100
      : null

  return (
    <div className="min-w-[164px] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[11px] shadow-lg shadow-slate-900/10">
      <p className="mb-2 font-semibold text-slate-700">Comparativo — {label}</p>
      {anterior && (
        <p className="flex items-center justify-between gap-4 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-slate-300" />
            {anoAnterior}
          </span>
          <span className="font-medium text-slate-600">{cfg.tipFmt(anterior.value)}</span>
        </p>
      )}
      {atual && (
        <p className="mt-1 flex items-center justify-between gap-4 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#C7D2FE]" />
            {anoAtual}
          </span>
          <span className="font-medium text-slate-700">{cfg.tipFmt(atual.value)}</span>
        </p>
      )}
      {delta != null && (
        <p className={cn(
          "mt-2 border-t border-slate-100 pt-1.5 text-center font-semibold",
          delta >= 0 ? "text-emerald-600" : "text-rose-500",
        )}>
          {delta >= 0 ? "+" : ""}{delta.toFixed(1)}% vs {anoAnterior}
        </p>
      )}
    </div>
  )
}

export function RevenueChart({
  data,
  anoAtual,
  anoAnterior,
  onExport,
  onFilter,
  hasActiveFilters = false,
}: {
  data: RevenueChartPoint[]
  anoAtual: number
  anoAnterior: number
  onExport: () => void
  onFilter: () => void
  hasActiveFilters?: boolean
}) {
  const [metric, setMetric] = useState<Metric>("receita")
  const cfg = METRICS[metric]

  // Footer: melhor mês do ano atual
  const bestPoint = data.reduce<RevenueChartPoint | null>((best, pt) => {
    const v = pt[cfg.atual] as number | null
    if (v == null) return best
    const bv = best ? (best[cfg.atual] as number | null) : null
    return bv == null || v > bv ? pt : best
  }, null)

  const footerInsight = (() => {
    if (!bestPoint) return null
    const curr = bestPoint[cfg.atual] as number | null
    const prev = bestPoint[cfg.anterior] as number | null
    if (curr == null) return null
    const delta = prev != null && prev !== 0 ? ((curr - prev) / prev) * 100 : null
    return delta != null
      ? `${bestPoint.mes} teve o melhor desempenho com ${cfg.tipFmt(curr)} (${delta >= 0 ? "+" : ""}${delta.toFixed(0)}% vs ${anoAnterior})`
      : `Melhor mês: ${bestPoint.mes} com ${cfg.tipFmt(curr)}`
  })()

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex flex-col">

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">

        <div className="flex items-start gap-3">
          <span className="grid size-9 min-h-9 min-w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600 shrink-0">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium leading-none text-[#4F46E5]">Gráfico comercial</p>
            <p className="mt-1.5 text-xs text-slate-500">
              Hoje: {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Legenda */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="size-2 rounded-sm border border-slate-300 bg-[#F1F5F9]" />
              Mês passado
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="size-2 rounded-sm bg-[#4F46E5]" />
              Mês atual
            </span>
          </div>

          {/* Toggle de métrica */}
          <div className="flex items-center gap-0.5 text-xs">
            {(Object.keys(METRICS) as Metric[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={cn(
                  "rounded-md px-3 py-1.5 transition-colors",
                  metric === m
                    ? "bg-[#4F46E5] text-white font-medium"
                    : "text-slate-500 hover:bg-slate-50",
                )}
              >
                {METRICS[m].label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "relative h-9 rounded-full px-5 text-sm gap-2 border-slate-200 hover:bg-slate-50",
              hasActiveFilters && "border-indigo-300 text-indigo-600 hover:bg-indigo-50",
            )}
            onClick={onFilter}
          >
            <SlidersHorizontal size={14} /> Filtros
            {hasActiveFilters && (
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-indigo-600" />
            )}
          </Button>
        </div>
      </div>

      {/* ── Gráfico ── */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradAtual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#C7D2FE" stopOpacity={0.75} />
              <stop offset="95%" stopColor="#C7D2FE" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#F1F5F9" stopOpacity={0.95} />
              <stop offset="95%" stopColor="#F1F5F9" stopOpacity={0.1}  />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} tickFormatter={cfg.yFmt} />

          <Tooltip
            content={<ChartTooltip metric={metric} anoAtual={anoAtual} anoAnterior={anoAnterior} />}
            cursor={{ stroke: "#d6dce7", strokeDasharray: "4 6" }}
          />

          {/* Ano anterior — atrás */}
          <Area type="monotone" dataKey={cfg.anterior as string}
            stroke="#cbd5e1" strokeWidth={2}
            fill="url(#gradAnterior)" fillOpacity={1}
            dot={false} connectNulls={false}
          />
          {/* Ano atual — à frente */}
          <Area type="monotone" dataKey={cfg.atual as string}
            stroke="#818cf8" strokeWidth={2.5}
            fill="url(#gradAtual)" fillOpacity={1}
            dot={false} connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* ── Footer ── */}
      <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          {footerInsight ? (
            <>
              <span className="size-2 shrink-0 rounded-full bg-emerald-500" />
              <span>{footerInsight}</span>
            </>
          ) : (
            "Nenhum dado para o período selecionado"
          )}
        </p>
        <Button
          className="h-10 min-h-10 shrink-0 gap-2 rounded-full px-6 text-sm bg-[#0F172A] hover:bg-[#0F172A]/90 text-white"
          onClick={onExport}
          type="button"
        >
          Exportar relatório
          <PdfIcon className="size-4" />
        </Button>
      </div>
    </article>
  )
}
