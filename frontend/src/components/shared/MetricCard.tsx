import type { Metric, MetricTone } from "@/types"
import { Card } from "@/components/ui/card"

const toneClasses: Record<MetricTone, string> = {
  rose: "text-rose-500",
  emerald: "text-emerald-500",
  indigo: "text-indigo-600",
  violet: "text-violet-600",
}

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon

  return (
    <Card className="min-h-[78px] flex-row items-center justify-between gap-0 px-5 py-0">
      <div>
        <p className="text-xs font-semibold text-indigo-600">{metric.label}</p>
        <p className="mt-1 text-lg font-bold leading-tight text-slate-900">{metric.value}</p>
        <p className={`mt-2 text-xs font-medium ${toneClasses[metric.tone]}`}>{metric.helper}</p>
      </div>

      <div className="grid size-8 place-items-center rounded-full bg-indigo-100 text-indigo-600">
        <Icon className="size-4" />
      </div>
    </Card>
  )
}

export function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} metric={metric} />
      ))}
    </div>
  )
}
