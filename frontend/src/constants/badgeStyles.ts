import type { ProductCategory, RatingLabel } from "@/types"

export const categoryClasses: Record<ProductCategory, string> = {
  Perfumaria:               "bg-indigo-50 text-indigo-600 border-indigo-200",
  Artes:                    "bg-sky-50 text-sky-600 border-sky-200",
  Esporte:                  "bg-emerald-50 text-emerald-600 border-emerald-200",
  Lazer:                    "bg-amber-50 text-amber-600 border-amber-200",
  Bebês:                    "bg-pink-50 text-pink-600 border-pink-200",
  "Utilidades domésticas":  "bg-orange-50 text-orange-600 border-orange-200",
  "Instrumentos Musicais":  "bg-indigo-50 text-indigo-600 border-indigo-200",
  Tecnologia:               "bg-cyan-50 text-cyan-600 border-cyan-200",
}

export const ratingClasses: Record<RatingLabel, string> = {
  Ótimo:     "h-6 py-1 bg-indigo-50 text-indigo-500 border-indigo-200",
  Bom:       "h-6 py-1 bg-amber-50 text-amber-500 border-amber-200",
  Excelente: "h-6 py-1 bg-emerald-50 text-emerald-500 border-emerald-200",
  Crítico:   "h-6 py-1 bg-rose-50 text-rose-500 border-rose-200",
}
