import { useMemo } from "react"
import { Tag } from "lucide-react"

export type OrderSummaryData = {
  aprovados: number
  processando: number
  recusados: number
  reembolsados: number
}

const ITEMS = [
  { key: "aprovados",    label: "Entregues",   hex: "#22C55E", bg: "#F0FDF4" },
  { key: "reembolsados", label: "Em trânsito", hex: "#FBBF24", bg: "#FFFBEB" },
  { key: "processando",  label: "Processando", hex: "#4F46E5", bg: "#EEF2FF" },
  { key: "recusados",    label: "Cancelados",  hex: "#F43F5E", bg: "#FFF1F2" },
] as const

export function OrderSummary({ data }: { data: OrderSummaryData }) {
  const rows = useMemo(() => {
    const total = data.aprovados + data.processando + data.recusados + data.reembolsados || 1
    return ITEMS.map((item) => {
      const value = data[item.key]
      const pct = `${Math.round((value / total) * 100)}%`
      const width = `${value > 0 ? Math.max((value / total) * 100, 4) : 0}%`
      return { ...item, value, pct, width }
    })
  }, [data])

  return (
    <article className="h-94.25 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white py-4 px-4 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="grid size-8 place-items-center rounded-full bg-indigo-50 text-[#4F46E5]">
          <Tag className="size-4" />
        </span>
        <p className="text-sm font-semibold text-[#4F46E5] leading-none">Resumo dos pedidos</p>
      </div>

      {/* Bars */}
      <div className="flex flex-col gap-2 mt-1">
        {rows.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_32px] items-center gap-2">
            <div className="h-3.5 overflow-hidden rounded-sm" style={{ backgroundColor: item.bg }}>
              <div
                className="h-full rounded-sm transition-all duration-700 ease-in-out"
                style={{ width: item.width, backgroundColor: item.hex }}
              />
            </div>
            <span className="text-right text-[11px] font-bold text-slate-600">{item.pct}</span>
          </div>
        ))}
      </div>

      {/* Mini cards */}
      <div className="mt-auto grid grid-cols-2 gap-2">
        {rows.map((item) => (
          <div
            key={item.label}
            className="flex flex-col justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-3 px-4 min-h-21"
          >
            <div className="flex items-center gap-1.5">
              <span className="block h-1 w-6 shrink-0 rounded-full" style={{ backgroundColor: item.hex }} />
              <p className="text-[11px] font-medium text-slate-500 truncate">{item.label}</p>
            </div>
            <p className="text-lg font-bold text-slate-900 leading-none">
              {item.value.toLocaleString("pt-BR")}
              <span className="ml-1 text-[10px] font-normal text-slate-400">pedidos</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
