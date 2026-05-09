export function HighlightCard({
    label,
    metricLabel,
    metricValue,
    title,
  }: {
    label: string
    metricLabel: string
    metricValue: string | number
    title: string
  }) {
    return (
      <article className="flex min-h-[80px] flex-col justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold text-indigo-600">{label}</p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-xs font-medium text-slate-400">{metricLabel}</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">{metricValue}</span>
          </div>
        </div>
        <p className="mt-2 text-base font-bold leading-tight text-slate-900">{title}</p>
      </article>
    )
  }