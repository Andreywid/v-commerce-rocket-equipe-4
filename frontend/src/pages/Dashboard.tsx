import { useState } from "react"
import { toast } from "sonner"

import { useAppContext } from "@/context/AppContext"
import { useKpis, useTopCategorias, useTopRegioes } from "@/hooks/useKpis"
import { useProducts } from "@/hooks/useProducts"
import { getKpiCards, getKpiInsights } from "@/helpers/metrics"
import { exportKpiToCSV } from "@/helpers/export"
import { PageShell } from "@/components/shared/PageShell"
import { DataCard, DataGrid, InsightCard } from "@/components/shared/MetricCards"
import { RevenueChart, type RevenueChartPoint } from "@/components/shared/RevenueChart"
import { OrderSummary } from "@/components/shared/OrderSummary"
import { FilterModal, DEFAULT_FILTER, hasAnyFilter, type FilterState } from "@/components/shared/FilterModal"
import { TopRegioesModal } from "@/components/shared/TopRegioesModal"
import { TopProdutosModal } from "@/components/shared/TopProdutosModal"
import { TopCategoriasModal } from "@/components/shared/TopCategoriasModal"
import type { VendasKPIMes } from "@/types/api"

const MONTH_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

function CardSkeleton() {
  return (
    <div className="h-23.75 animate-pulse rounded-lg border border-slate-200 bg-white px-6 py-3 shadow-sm flex items-center justify-between">
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
  const [filterOpen, setFilterOpen]               = useState(false)
  const [appliedFilters, setAppliedFilters]       = useState<FilterState>(DEFAULT_FILTER)
  const [topRegioesOpen, setTopRegioesOpen]       = useState(false)
  const [topProdutosOpen, setTopProdutosOpen]     = useState(false)
  const [topCategoriasOpen, setTopCategoriasOpen] = useState(false)

  const { data: kpis, isPending } = useKpis("all")
  const { data: topProductData } = useProducts({ sort_by: "qtd_vendida_total", order: "desc" }, 1, 1)
  const { data: top5ProdutosData } = useProducts({ sort_by: "qtd_vendida_total", order: "desc" }, 1, 5)
  const { data: topRegioesData } = useTopRegioes()
  const { data: topCategoriasData } = useTopCategorias()
  const topProductName = topProductData?.items?.[0]?.nome_produto ?? null
  const topCategoriaNome = topCategoriasData?.categorias?.[0]?.categoria ?? null
  const topCategoriaQtd = topCategoriasData?.categorias?.[0]?.qtd_vendida ?? null
  const allMeses = kpis?.meses ?? []

  // ── Anos disponíveis e pares válidos ─────────────────────────────────────────
  const yearsInData = [...new Set(allMeses.map((m) => m.ano))].sort()

  // Par válido = dois anos consecutivos ambos presentes no dataset
  const availablePairs: string[] = []
  for (let i = yearsInData.length - 1; i >= 1; i--) {
    if (yearsInData[i] - yearsInData[i - 1] === 1) {
      availablePairs.push(`${yearsInData[i]}-${yearsInData[i - 1]}`)
    }
  }
  // Meses para o seletor de referência dos KPIs
  const availableMeses = [...new Set(allMeses.map((m) => m.ano_mes))].sort().reverse()

  // ── Par ativo para o gráfico ─────────────────────────────────────────────────
  const activePair = appliedFilters.pairKey !== ""
    ? appliedFilters.pairKey
    : availablePairs[0] ?? ""   // mais recente por padrão

  const [anoAtualStr, anoAnteriorStr] = activePair.split("-")
  const anoAtual    = parseInt(anoAtualStr    ?? "0")
  const anoAnterior = parseInt(anoAnteriorStr ?? "0")

  // ── Mês de referência para KPI cards ─────────────────────────────────────────
  const ultimoMes: VendasKPIMes | null = (() => {
    if (allMeses.length === 0) return null
    if (appliedFilters.mesAno !== "") {
      return allMeses.find((m) => m.ano_mes === appliedFilters.mesAno) ?? null
    }
    return allMeses[allMeses.length - 1]
  })()

  // ── Dados do gráfico ─────────────────────────────────────────────────────────
  const byYearMonth = new Map(allMeses.map((m) => [`${m.ano}-${m.mes}`, m]))

  const chartData: RevenueChartPoint[] = MONTH_ABBR.map((mes, idx) => {
    const mesNum   = idx + 1
    const atual    = byYearMonth.get(`${anoAtual}-${mesNum}`)
    const anterior = byYearMonth.get(`${anoAnterior}-${mesNum}`)
    return {
      mes,
      mesNum,
      receitaAtual:    atual    ? parseFloat((atual.receita_bruta    / 1000).toFixed(1)) : null,
      receitaAnterior: anterior ? parseFloat((anterior.receita_bruta / 1000).toFixed(1)) : null,
      pedidosAtual:    atual?.qtd_pedidos    ?? null,
      pedidosAnterior: anterior?.qtd_pedidos ?? null,
      ticketAtual:     atual    ? parseFloat(atual.ticket_medio.toFixed(0))    : null,
      ticketAnterior:  anterior ? parseFloat(anterior.ticket_medio.toFixed(0)) : null,
    }
  })

  // ── Derivados ─────────────────────────────────────────────────────────────────
  const metrics      = ultimoMes ? getKpiCards(ultimoMes)    : []
  const insights     = ultimoMes ? getKpiInsights(ultimoMes, topProductName, topCategoriaNome, topCategoriaQtd) : []
  const orderSummary = ultimoMes
    ? {
        aprovados:    ultimoMes.qtd_pedidos_aprovados,
        processando:  ultimoMes.qtd_pedidos_processando,
        recusados:    ultimoMes.qtd_pedidos_recusados,
        reembolsados: ultimoMes.qtd_pedidos_reembolsados,
      }
    : { aprovados: 0, processando: 0, recusados: 0, reembolsados: 0 }

  const activeFilters = hasAnyFilter(appliedFilters)

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (allMeses.length === 0) {
      toast.error("Nenhum dado disponível para exportar no momento.")
      return
    }
    exportKpiToCSV(allMeses)
    showNotice("Relatório CSV gerado com sucesso!")
  }

  const handleSaveFilter = (filters: FilterState) => {
    setAppliedFilters(filters)
    toast[hasAnyFilter(filters) ? "success" : "info"](
      hasAnyFilter(filters) ? "Filtros aplicados" : "Filtros limpos"
    )
  }

  return (
    <>
      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onSave={handleSaveFilter}
        initial={appliedFilters}
        availableMeses={availableMeses}
        availablePairs={availablePairs}
      />
      {topRegioesOpen && (
        <TopRegioesModal
          regioes={topRegioesData?.regioes ?? []}
          onClose={() => setTopRegioesOpen(false)}
        />
      )}
      {topProdutosOpen && (
        <TopProdutosModal
          produtos={top5ProdutosData?.items ?? []}
          onClose={() => setTopProdutosOpen(false)}
        />
      )}
      {topCategoriasOpen && (
        <TopCategoriasModal
          categorias={topCategoriasData?.categorias ?? []}
          onClose={() => setTopCategoriasOpen(false)}
        />
      )}
      <PageShell title="Dashboard">

        <DataGrid>
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : !ultimoMes
            ? <p className="col-span-full py-2 text-sm text-slate-500">Nenhum dado disponível.</p>
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

        <div className="mt-7 grid items-stretch gap-4 lg:grid-cols-[1fr_291px]">
          <RevenueChart
            data={chartData}
            anoAtual={anoAtual}
            anoAnterior={anoAnterior}
            onExport={handleExport}
            onFilter={() => setFilterOpen(true)}
            hasActiveFilters={activeFilters}
          />
          <OrderSummary data={orderSummary} />
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isPending
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : insights.map((insight) => (
                <InsightCard
                  key={insight.label}
                  label={insight.label}
                  value={insight.value}
                  helper={insight.helper}
                  tone={insight.tone}
                  onClick={
                    insight.label === "Top região" ? () => setTopRegioesOpen(true) :
                    insight.label === "Produto mais vendido" ? () => setTopProdutosOpen(true) :
                    insight.label === "Top categorias" ? () => setTopCategoriasOpen(true) :
                    undefined
                  }
                  actionLabel={
                    insight.label === "Top região" ||
                    insight.label === "Produto mais vendido" ||
                    insight.label === "Top categorias"
                      ? "Ver Top 5"
                      : undefined
                  }
                />
              ))}
        </div>

      </PageShell>
    </>
  )
}
