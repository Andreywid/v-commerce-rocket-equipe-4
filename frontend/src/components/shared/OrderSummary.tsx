import { useMemo } from "react"
import { ShoppingCart } from "lucide-react"

export type OrderSummaryData = {
  aprovados: number
  processando: number
  recusados: number
  reembolsados: number
}

export function OrderSummary({ data }: { data: OrderSummaryData }) {
  const { summary, counts } = useMemo(() => {
    const total = data.aprovados + data.processando + data.recusados + data.reembolsados || 1

    const pct = (n: number) => `${Math.round((n / total) * 100)}%`
    const barW = (n: number) => `${n > 0 ? Math.max((n / total) * 100, 6) : 0}%`

    const summaryData = [
      { label: pct(data.aprovados),    value: "Aprovados",    width: barW(data.aprovados),    color: "bg-emerald-500" },
      { label: pct(data.processando),  value: "Processando",  width: barW(data.processando),  color: "bg-indigo-600" },
      { label: pct(data.recusados),    value: "Recusados",    width: barW(data.recusados),    color: "bg-rose-500" },
      { label: pct(data.reembolsados), value: "Reembolsados", width: barW(data.reembolsados), color: "bg-amber-400" },
    ]

    const cardsData = [
      { label: "Aprovados",    value: data.aprovados,    color: "bg-emerald-500" },
      { label: "Processando",  value: data.processando,  color: "bg-indigo-600" },
      { label: "Recusados",    value: data.recusados,    color: "bg-rose-500" },
      { label: "Reembolsados", value: data.reembolsados, color: "bg-amber-400" },
    ]

    return { summary: summaryData, counts: cardsData }
  }, [data])

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
              {item.value.toLocaleString("pt-BR")}
              <span className="ml-1 text-[10px] font-medium text-slate-400 lowercase">unid.</span>
            </p>
          </div>
        ))}
      </div>
    </article>
  )
}
