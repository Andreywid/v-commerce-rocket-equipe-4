import { useAppContext } from "@/context/AppContext"
import { getDashboardMetrics, getDashboardInsights } from "@/helpers/metrics"
import { PageShell } from "@/components/shared/PageShell"
import { DataCard, DataGrid } from "@/components/shared/MetricCards"
import { RevenueChart } from "@/components/shared/RevenueChart"
import { OrderSummary } from "@/components/shared/OrderSummary"

export function Dashboard() {
  const { orders, tickets, clients, showNotice } = useAppContext()
  const metrics = getDashboardMetrics(orders, tickets)
  const insights = getDashboardInsights(orders, clients)

  const handleExport = () => showNotice("Relatório exportado com sucesso!")
  const handleFilter = () => showNotice("Filtros do gráfico abertos")

  return (
    <PageShell title="Dashboard">
      <DataGrid>
        {metrics.map((metric) => (
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
        <RevenueChart 
          onExport={handleExport} 
          onFilter={handleFilter} 
        />
        <OrderSummary orders={orders} />
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {insights.map((insight) => (
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
  )
}