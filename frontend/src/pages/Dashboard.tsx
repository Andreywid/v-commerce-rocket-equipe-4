import { useEffect, useState } from "react"
import { toast } from "sonner"

import { useAppContext } from "@/context/AppContext"
import { fetchKpis } from "@/services/dashboardService"
import { getKpiCards, getKpiInsights, formatMesLabel } from "@/helpers/metrics"
import { PageShell } from "@/components/shared/PageShell"
import { DataCard, DataGrid } from "@/components/shared/MetricCards"
import { RevenueChart, type RevenueChartPoint } from "@/components/shared/RevenueChart"
import { OrderSummary } from "@/components/shared/OrderSummary"
import { FilterModal, type FilterState } from "@/components/shared/FilterModal"
import type { KPIsResponse } from "@/types/dashboard"

function CardSkeleton() {
  return (
    <div className="min-h-[105px] rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm animate-pulse">
      <div className="h-3 w-24 rounded bg-slate-100 mb-4" />
      <div className="h-7 w-32 rounded bg-slate-100 mb-3" />
      <div className="h-3 w-20 rounded bg-slate-100" />
    </div>
  )
}

export function Dashboard() {
  const { showNotice } = useAppContext()
  const [kpis, setKpis] = useState<KPIsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterOpen, setFilterOpen] = useState(false)

  useEffect(() => {
    fetchKpis("12m")
      .then(setKpis)
      .catch(() => toast.error("Erro ao carregar métricas", {
        description: "Verifique se o backend está rodando e tente novamente.",
      }))
      .finally(() => setLoading(false))
  }, [])

  const handleExport = () => showNotice("Relatório exportado com sucesso!")
  const handleFilter = () => setFilterOpen(true)
  const handleSaveFilter = (filters: FilterState) => {
    const parts: string[] = []
    if (filters.months.length) parts.push(filters.months.join(", "))
    if (filters.years.length) parts.push(filters.years.join(", "))
    showNotice(parts.length ? `Filtros aplicados: ${parts.join(" · ")}` : "Filtros limpos")
  }

  const ultimoMes = kpis ? kpis.meses[kpis.meses.length - 1] : null

  const metrics = ultimoMes ? getKpiCards(ultimoMes) : []
  const insights = ultimoMes ? getKpiInsights(ultimoMes) : []

  const chartData: RevenueChartPoint[] = kpis
    ? kpis.meses.map((m) => ({
        mes: formatMesLabel(m.ano_mes),
        receita: parseFloat((m.receita_bruta / 1000).toFixed(1)),
      }))
    : []

  const orderSummary = ultimoMes
    ? {
        aprovados: ultimoMes.qtd_pedidos_aprovados,
        processando: ultimoMes.qtd_pedidos_processando,
        recusados: ultimoMes.qtd_pedidos_recusados,
        reembolsados: ultimoMes.qtd_pedidos_reembolsados,
      }
    : { aprovados: 0, processando: 0, recusados: 0, reembolsados: 0 }

  return (
    <>
      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onSave={handleSaveFilter}
      />
      <PageShell title="Dashboard">
        <DataGrid>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : metrics.map((metric) => (
                <DataCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  helper={metric.helper}
                  tone={metric.tone}
                  icon={metric.icon}
                />
              ))}
        </DataGrid>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_377px]">
          <RevenueChart data={chartData} onExport={handleExport} onFilter={handleFilter} />
          <OrderSummary data={orderSummary} />
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : insights.map((insight) => (
                <DataCard
                  key={insight.label}
                  label={insight.label}
                  value={insight.value}
                  helper={insight.helper}
                  tone={insight.tone}
                  icon={insight.icon}
                  className="min-h-[110px]"
                />
              ))}
        </div>
      </PageShell>
    </>
  )
}
