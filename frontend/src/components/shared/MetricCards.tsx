import { type LucideIcon } from "lucide-react"
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

const toneClasses: Record<MetricTone, string> = {
  rose: "text-rose-500",
  emerald: "text-emerald-500",
  indigo: "text-indigo-600",
  violet: "text-violet-600",
}

export function DataCard({
  label,
  value,
  helper,
  tone = "indigo",
  icon: Icon,
  className,
}: DataCardProps) {
  return (
    <Card className={cn("flex min-h-[105px] flex-row items-center justify-between px-6 py-4 bg-white shadow-sm", className)}>
      <div className="flex flex-col h-full justify-between gap-1 overflow-hidden">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-extrabold text-indigo-600/70 mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 leading-tight truncate">
            {value}
          </p>
        </div>

        {helper && (
          <p className={cn("text-xs font-semibold flex items-center gap-1", toneClasses[tone])}>
            {helper}
          </p>
        )}
      </div>

      {Icon && (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
    </Card>
  )
}

export function DataGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  )
}
