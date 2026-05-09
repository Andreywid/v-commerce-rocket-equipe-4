import { useMemo } from "react"
import { ShoppingCart } from "lucide-react"
import type { OrderRow } from "@/types"

export function OrderSummary({ orders }: { orders: OrderRow[] }) {
  const { summary, counts } = useMemo(() => {
    const total = orders.length || 1

    const stats = {
      delivered: orders.filter((o) => o.status === "Entregue").length,
      inTransit: orders.filter((o) => o.status === "Em trânsito").length,
      processing: orders.filter((o) => o.status === "Processando").length,
      cancelled: orders.filter((o) => o.status === "Cancelado").length,
    }

    const pct = (n: number) => `${Math.round((n / total) * 100)}%`
    const barW = (n: number) => `${n > 0 ? Math.max((n / total) * 100, 6) : 0}%`

    const summaryData = [
      { label: pct(stats.delivered), value: "Entregues", width: barW(stats.delivered), color: "bg-emerald-500" },
      { label: pct(stats.inTransit), value: "Em trânsito", width: barW(stats.inTransit), color: "bg-amber-400" },
      { label: pct(stats.processing), value: "Processando", width: barW(stats.processing), color: "bg-indigo-600" },
      { label: pct(stats.cancelled), value: "Cancelados", width: barW(stats.cancelled), color: "bg-rose-500" },
    ]

    const cardsData = [
      { label: "Entregues", value: stats.delivered, color: "bg-emerald-500" },
      { label: "Trânsito", value: stats.inTransit, color: "bg-amber-400" },
      { label: "Processando", value: stats.processing, color: "bg-indigo-600" },
      { label: "Cancelados", value: stats.cancelled, color: "bg-rose-500" },
    ]

    return { summary: summaryData, counts: cardsData }
  }, [orders])

  return (
    <article className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <ShoppingCart className="size-5" />
          </span>
          <p className="text-lg font-bold text-slate-900 leading-none">Resumo dos pedidos</p>
        </div>
        <div className="space-y-4">
          {summary.map((item) => (
            <div key={item.value} className="grid grid-cols-[1fr_36px] items-center gap-3">
              <div className="h-4 overflow-hidden rounded-sm bg-slate-100">
                <div
                  className={`h-full rounded-sm transition-all duration-700 ease-in-out ${item.color}`}
                  style={{ width: item.width }}
                />
              </div>
              <span className="text-right text-[11px] font-bold text-slate-600">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 gap-3">
        {counts.map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className={`block size-1.5 rounded-full ${item.color}`} />
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 truncate">
                {item.label}
              </p>
            </div>
            <p className="text-xl font-extrabold text-slate-900 leading-none">
              {item.value}
              <span className="ml-1 text-[10px] font-medium text-slate-400 lowercase">
                unid.
              </span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
