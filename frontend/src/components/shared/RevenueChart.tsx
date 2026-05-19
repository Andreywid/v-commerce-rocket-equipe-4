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
  receita: number
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
      <p className="mb-1 font-semibold text-slate-700">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-1 flex items-center justify-between gap-5 text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
            Receita
          </span>
          <span className="font-medium text-slate-700">R$ {entry.value.toFixed(1)}K</span>
        </p>
      ))}
    </div>
  )
}

export function RevenueChart({
  data,
  onExport,
  onFilter,
  hasActiveFilters = false,
}: {
  data: RevenueChartPoint[]
  onExport: () => void
  onFilter: () => void
  hasActiveFilters?: boolean
}) {
  const subtitle =
    data.length >= 2
      ? `Receita bruta — ${data[0].mes} a ${data[data.length - 1].mes}`
      : data.length === 1
      ? `Receita bruta — ${data[0].mes}`
      : "Receita bruta — últimos 12 meses"

  const peakMes = data.length > 0
    ? data.reduce((a, b) => (a.receita > b.receita ? a : b)).mes
    : null

  return (
    <article className="h-94.25 rounded-lg border border-slate-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <span className="grid size-10 place-items-center rounded-full bg-indigo-50 text-indigo-600">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-xl font-bold text-slate-900 leading-none">Gráfico de receita</p>
            <p className="mt-1.5 text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
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

      <ResponsiveContainer width="100%" height={200} className="flex-1">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#818cf8" stopOpacity={0.34} />
              <stop offset="95%" stopColor="#818cf8" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickLine={false}
            axisLine={false}
            interval={1}
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
            dataKey="receita"
            name="Receita"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#gradReceita)"
            fillOpacity={1}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
          {peakMes ? (
            <>
              <span className="size-2 rounded-full bg-emerald-500" />
              {`Pico em ${peakMes}`}
            </>
          ) : (
            "Nenhum dado para o período selecionado"
          )}
        </p>
        <Button
          className="h-10 min-h-10 gap-2 rounded-full px-6 text-sm bg-[#0F172A] hover:bg-[#0F172A]/90 text-white"
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
