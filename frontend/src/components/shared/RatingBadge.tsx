import type { RatingLabel } from "@/types"
import { getRatingLabel } from "@/helpers/dictionary"

type RatingStyle = {
  outerBg: string
  outerBorder: string
  innerBg: string
  textColor: string
}

const RATING_STYLES: Record<RatingLabel, RatingStyle> = {
  "Excelente": {
    outerBg:    "bg-[#22C55E]/15",
    outerBorder:"border-[#22C55E]/40",
    innerBg:    "bg-[#22C55E]",
    textColor:  "text-[#22C55E]",
  },
  "Ótimo": {
    outerBg:    "bg-[#C7D2FE]/40",
    outerBorder:"border-[#C7D2FE]",
    innerBg:    "bg-[#6366F1]",
    textColor:  "text-[#6366F1]",
  },
  "Bom": {
    outerBg:    "bg-[#FDE68A]/40",
    outerBorder:"border-[#FDE68A]",
    innerBg:    "bg-[#F59E0B]",
    textColor:  "text-[#F59E0B]",
  },
  "Crítico": {
    outerBg:    "bg-[#FECDD3]/40",
    outerBorder:"border-[#FECDD3]",
    innerBg:    "bg-[#F43F5E]",
    textColor:  "text-[#F43F5E]",
  },
}

export function RatingBadge({ nota }: { nota: number }) {
  const label = getRatingLabel(nota)
  const s = RATING_STYLES[label]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${s.outerBg} ${s.outerBorder}`}>
      <span className={`inline-flex h-4 items-center rounded px-1 text-[11px] font-bold leading-none text-white ${s.innerBg}`}>
        {nota.toFixed(1)}
      </span>
      <span className={`text-xs font-medium ${s.textColor}`}>{label}</span>
    </span>
  )
}
