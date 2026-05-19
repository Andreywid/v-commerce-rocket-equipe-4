import { useState } from "react"
import { toast } from "sonner"

import { useAppContext } from "@/context/AppContext"
import { useKpis } from "@/hooks/useKpis"
import { getKpiCards, getKpiInsights, formatMesLabel } from "@/helpers/metrics"
import { exportKpiToCSV } from "@/helpers/export"
import { PageShell } from "@/components/shared/PageShell"
import { DataCard, DataGrid, InsightCard } from "@/components/shared/MetricCards"
import { RevenueChart, type RevenueChartPoint } from "@/components/shared/RevenueChart"
import { OrderSummary } from "@/components/shared/OrderSummary"
import { FilterModal, type FilterState, MONTHS } from "@/components/shared/FilterModal"
import type { VendasKPIMes } from "@/types/api"

const DEFAULT_FILTER: FilterState = { comparisonDate: "", months: [], years: [] }

function hasAnyFilter(f: FilterState): boolean {
  return f.months.length > 0 || f.years.length > 0 || f.comparisonDate !== ""
}

function applyFilters(meses: VendasKPIMes[], f: FilterState): VendasKPIMes[] {
  return meses.filter((m) => {
    if (f.months.length > 0 && !f.months.includes(MONTHS[m.mes - 1])) return false
    if (f.years.length > 0 && !f.years.includes(String(m.ano))) return false
    if (f.comparisonDate !== "" && m.ano_mes < f.comparisonDate.slice(0, 7)) return false
    return true
  })
}

function CardSkeleton() {
  return (
    <div className="h-23.75 rounded-lg border border-slate-200 bg-white px-6 py-3 shadow-sm animate-pulse flex items-center justify-between">
      <div className="flex flex-col justify-between h-full py-0.5">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-5 w-32 rounded bg-slate-100" />
        <div className="h-3 w-20 rounded bg-slate-100" />
      </div>
      <div className="size-9 rounded-full bg-slate-100 shrink-0" />
    </div>
  )
}

export function Dashboard() {
  const { showNotice } = useAppContext()
  const [filterOpen, setFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTER)

  const { data: kpis, isPending } = useKpis("all")

  const handleExport = () => {
    if (!filteredMeses || filteredMeses.length === 0) {
      toast.error("Nenhum dado disponível para exportar no momento.")
      return
    }
    exportKpiToCSV(filteredMeses)
    showNotice("Relatório CSV gerado com sucesso!")
  }

  const handleFilter = () => setFilterOpen(true)
  const handleSaveFilter = (filters: FilterState) => {
    setAppliedFilters(filters)
    if (hasAnyFilter(filters)) {
      toast.success("Filtros aplicados")
    } else {
      toast.info("Filtros limpos")
    }
  }

  const activeFilters = hasAnyFilter(appliedFilters)
  const allMeses = kpis?.meses ?? []
  // Se não houver filtros, mostramos os últimos 12 meses (comportamento padrão)
  // Se houver filtros, filtramos sobre a base completa
  const filteredMeses = activeFilters 
    ? applyFilters(allMeses, appliedFilters) 
    : allMeses.slice(-12)
  const ultimoMes: VendasKPIMes | null = filteredMeses.length > 0
    ? filteredMeses[filteredMeses.length - 1]
    : null

  const metrics = ultimoMes ? getKpiCards(ultimoMes) : []
  const insights = ultimoMes ? getKpiInsights(ultimoMes) : []

  const chartData: RevenueChartPoint[] = filteredMeses.map((m) => ({
    mes: formatMesLabel(m.ano_mes),
    receita: parseFloat((m.receita_bruta / 1000).toFixed(1)),
  }))

  const orderSummary = ultimoMes
    ? {
        aprovados: ultimoMes.qtd_pedidos_aprovados,
        processando: ultimoMes.qtd_pedidos_processando,
        recusados: ultimoMes.qtd_pedidos_recusados,
        reembolsados: ultimoMes.qtd_pedidos_reembolsados,
      }
    : { aprovados: 0, processando: 0, recusados: 0, reembolsados: 0 }

  const emptyFiltered = !isPending && activeFilters && filteredMeses.length === 0

  return (
    <>
      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onSave={handleSaveFilter}
        initial={appliedFilters}
      />
      <PageShell title="Dashboard">
        <DataGrid>
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : emptyFiltered
            ? (
              <p className="col-span-full py-2 text-sm text-slate-500">
                Nenhum dado para o período selecionado. Ajuste os filtros para ver métricas.
              </p>
            )
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

        <div className="mt-7 grid gap-4 lg:grid-cols-[1fr_272px]">
          <RevenueChart
            data={chartData}
            onExport={handleExport}
            onFilter={handleFilter}
            hasActiveFilters={activeFilters}
          />
          <OrderSummary data={orderSummary} />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {isPending
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : insights.map((insight) => (
                <InsightCard
                  key={insight.label}
                  label={insight.label}
                  value={insight.value}
                  helper={insight.helper}
                  tone={insight.tone}
                />
              ))}
        </div>
      </PageShell>
    </>
  )
}
