type HighlightTone = "emerald" | "amber" | "rose"

const highlightBadge: Record<HighlightTone, string> = {
  emerald: "bg-[#22C55E]/15 border-[#22C55E]/40 text-[#22C55E]",
  amber:   "bg-[#FDE68A]/40 border-[#FDE68A]    text-[#F59E0B]",
  rose:    "bg-[#FECDD3]/40 border-[#FECDD3]    text-[#F43F5E]",
}

export function ProductHighlightCard({
  label,
  metricLabel,
  metricValue,
  productName,
  tone = "emerald",
}: {
  label: string
  metricLabel: string
  metricValue: string
  productName: string
  tone?: HighlightTone
}) {
  return (
    <article className="h-18.75 flex flex-col justify-between rounded-lg border border-slate-200 bg-white px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#4F46E5]">{label}</p>
        <span className="text-xs font-medium text-slate-400">{metricLabel}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-base font-bold text-slate-900">{productName}</p>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-bold ${highlightBadge[tone]}`}>
          {metricValue}
        </span>
      </div>
    </article>
  )
}
