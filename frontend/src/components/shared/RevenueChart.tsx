import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
  } from "recharts"
  import { BarChart3, Download, SlidersHorizontal } from "lucide-react"
  
  import { Button } from "@/components/ui/button"
  import { revenueData } from "@/helpers/metrics"
  
  function ChartLegend({ color, label }: { color: string; label: string }) {
    return (
      <span className="flex items-center gap-1.5">
        <span className={`size-2 rounded-sm ${color}`} />
        {label}
      </span>
    )
  }
  
  function RevenueTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] shadow-lg shadow-slate-900/10">
        <p className="mb-1 font-semibold text-slate-700">Dia {label}</p>
        {payload.map((entry: any) => (
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
  
  export function RevenueChart({ 
    onExport, 
    onFilter 
  }: { 
    onExport: () => void; 
    onFilter: () => void 
  }) {
    return (
      <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="flex items-start gap-4">
            <span className="grid size-10 place-items-center rounded-full bg-indigo-50 text-indigo-600">
              <BarChart3 className="size-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-slate-900 leading-none">Gráfico de renda</p>
              <p className="mt-1.5 text-xs text-slate-500">Comparativo mensal — Março vs Abril</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 text-xs text-slate-500 sm:flex mr-2">
              <ChartLegend color="bg-slate-400" label="Mês passado" />
              <ChartLegend color="bg-indigo-600" label="Mês atual" />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 rounded-full px-5 text-sm gap-2 border-slate-200 hover:bg-slate-50" 
              onClick={onFilter}
            >
              <SlidersHorizontal size={14} /> Filtros
            </Button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
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
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
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
              strokeWidth={1.5}
              fill="url(#gradLastMonth)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="currentMonth"
              name="Abril"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#gradCurrentMonth)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span className="size-2 rounded-full bg-emerald-500" />
            Março teve o melhor impacto na sua renda, cerca de 92% de aumento médio.
          </p>
          <Button className="h-9 gap-2 rounded-full px-6 text-sm" onClick={onExport} type="button">
            Exportar relatório
            <Download className="size-3.5" />
          </Button>
        </div>
      </article>
    )
}