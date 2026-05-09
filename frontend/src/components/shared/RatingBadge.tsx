import { cn } from "@/lib/utils"
import type { RatingLabel } from "@/types"

interface RatingBadgeProps {
  rating: number
  className?: string
}

const getRatingConfig = (rating: number): { label: RatingLabel; colors: string; innerBg: string } => {
  if (rating >= 4.7) {
    return { 
      label: "Excelente", 
      colors: "bg-emerald-50 text-emerald-600 border-emerald-200", 
      innerBg: "bg-emerald-500" 
    }
  }
  if (rating >= 4.4) {
    return { 
      label: "Ótimo", 
      colors: "bg-indigo-50 text-indigo-600 border-indigo-200", 
      innerBg: "bg-indigo-500" 
    }
  }
  if (rating >= 4.0) {
    return { 
      label: "Bom", 
      colors: "bg-amber-50 text-amber-600 border-amber-200", 
      innerBg: "bg-amber-500" 
    }
  }
  return { 
    label: "Crítico", 
    colors: "bg-rose-50 text-rose-600 border-rose-200", 
    innerBg: "bg-rose-500" 
  }
}

export function RatingBadge({ rating, className }: RatingBadgeProps) {
  const { label, colors, innerBg } = getRatingConfig(rating)

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-1.25 py-0.75 text-xs leading-none shrink-0",
        colors,
        className
      )}
    >
      <span className={cn("rounded-md px-1.5 py-0.5 text-white", innerBg)}>
        {rating.toFixed(1)}
      </span>
      
      <span className="pr-1">{label}</span>
    </div>
  )
}