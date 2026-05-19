import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { MetricTone } from "@/types"

interface DataCardProps {
  label: string
  value: string | number
  helper?: string
  tone?: MetricTone
  icon?: LucideIcon
  className?: string
}

export function DataCard({
  label,
  value,
  helper = "",
  tone = "indigo",
  icon: Icon,
  className,
}: DataCardProps) {
  const isPositiveTrend = helper.startsWith("+")
  const isDownward = isPositiveTrend && tone === "rose"
  const words = helper.split(" ")
  const accentPart = isPositiveTrend ? words[0] : null
  const labelPart = isPositiveTrend ? words.slice(1).join(" ") : helper

  return (
    <Card className={cn("h-23.75 flex-row items-center justify-between gap-0 rounded-lg border border-slate-200 px-6 py-3 shadow-sm ring-0", className)}>
      <div className="flex flex-col justify-between h-full py-0.5">
        <p className="text-sm font-medium leading-5 tracking-normal text-[#4F46E5]">{label}</p>
        <p className="text-[18px] font-semibold leading-6.75 tracking-normal text-slate-900">{value}</p>
        {helper && (
          <p className="flex items-center gap-1 text-sm font-normal leading-5 tracking-normal text-[#475569]">
            {isPositiveTrend && (
              <span className={cn("flex items-center gap-0.5", isDownward ? "text-rose-500" : "text-[#22C55E]")}>
                {isDownward ? <TrendingDown className="size-3" /> : <TrendingUp className="size-3" />}
                {accentPart}
              </span>
            )}
            {labelPart}
          </p>
        )}
      </div>

      {Icon && (
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-[#4F46E5]">
          <Icon className="size-4" />
        </div>
      )}
    </Card>
  )
}

export function DataGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  rose:    { bg: "#FECDD3", text: "#F43F5E" },
  emerald: { bg: "#BBF7D0", text: "#15803D" },
  indigo:  { bg: "#E0E7FF", text: "#4F46E5" },
  violet:  { bg: "#EDE9FE", text: "#7C3AED" },
}

interface InsightCardProps {
  label: string
  value: string | number
  helper?: string
  tone?: MetricTone
}

export function InsightCard({ label, value, helper = "", tone = "indigo" }: InsightCardProps) {
  const badge = BADGE_COLORS[tone] ?? BADGE_COLORS.indigo

  return (
    <Card className="h-20 flex-row items-center justify-between gap-2 rounded-lg border border-slate-200 px-6 py-3 shadow-sm ring-0">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium leading-5 text-[#4F46E5]">{label}</p>
        <p className="text-[18px] font-semibold leading-6.75 text-slate-900">{value}</p>
      </div>
      {helper && (
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
          style={{ backgroundColor: badge.bg, color: badge.text }}
        >
          {helper}
        </span>
      )}
    </Card>
  )
}
