import type { RatingLabel } from "@/types"
import { Badge } from "@/components/ui/badge"

export function StatusBadge({ children, className }: { children: React.ReactNode; className: string }) {
  return <Badge className={className}>{children}</Badge>
}

const RATING_COLOR: Record<RatingLabel, { outer: string; inner: string }> = {
  Ótimo:     { outer: "bg-indigo-50 text-[#6366F1] border-indigo-200",  inner: "bg-[#6366F1]" },
  Bom:       { outer: "bg-amber-50 text-[#F59E0B] border-amber-200",    inner: "bg-[#F59E0B]" },
  Excelente: { outer: "bg-emerald-50 text-[#22C55E] border-emerald-200", inner: "bg-[#22C55E]" },
  Crítico:   { outer: "bg-rose-50 text-[#F43F5E] border-rose-200",      inner: "bg-[#F43F5E]" },
}

export function RatingBadge({ rating, label }: { rating: string; label: RatingLabel }) {
  const { outer, inner } = RATING_COLOR[label]
  return (
    <span className={`inline-flex h-6 items-center gap-2 rounded-full border px-1.5 text-xs font-medium whitespace-nowrap ${outer}`}>
      <span className={`inline-flex h-4 w-6.5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${inner}`}>
        {rating}
      </span>
      {label}
    </span>
  )
}
