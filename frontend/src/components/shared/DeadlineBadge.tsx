import { StatusBadge } from "./StatusBadge"
import type { OrderTimeline } from "@/types"

const timelineClasses: Record<OrderTimeline, string> = {
  "No Prazo": "bg-indigo-50 text-indigo-500 ring-indigo-200",
  "Fora do Prazo": "bg-rose-50 text-rose-500 ring-rose-200",
}

export function DeadlineBadge({ status }: { status: OrderTimeline }) {
  return (
    <StatusBadge className={timelineClasses[status]}>
      {status}
    </StatusBadge>
  )
}