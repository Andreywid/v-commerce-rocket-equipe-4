import { TrendingDown, TrendingUp } from "lucide-react"

import type { Metric } from "@/types"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon
  const isPositiveTrend = metric.helper.startsWith("+")
  const isDownward = isPositiveTrend && metric.tone === "rose"
  const words = metric.helper.split(" ")
  const accentPart = isPositiveTrend ? words[0] : null
  const labelPart = isPositiveTrend ? words.slice(1).join(" ") : metric.helper

  return (
    <Card className="h-23.75 flex-row items-center justify-between gap-0 rounded-lg border border-slate-200 px-6 py-3 shadow-sm ring-0">
      <div className="flex flex-col justify-between h-full py-0.5">
        <p className="text-sm font-medium leading-5 tracking-normal text-[#4F46E5]">
          {metric.label}
        </p>
        <p className="text-[18px] font-semibold leading-6.75 tracking-normal text-slate-900">
          {metric.value}
        </p>
        <p className="flex items-center gap-1 text-sm font-normal leading-5 tracking-normal text-[#475569]">
          {isPositiveTrend && (
            <span className={cn("flex items-center gap-0.5", isDownward ? "text-rose-500" : "text-[#22C55E]")}>
              {isDownward ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
              {accentPart}
            </span>
          )}
          {labelPart}
        </p>
      </div>

      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-[#4F46E5]">
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
