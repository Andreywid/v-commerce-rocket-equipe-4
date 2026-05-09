import { HighlightCard } from "./HighlightCard"
import type { ProductRow } from "@/types"

export function ProductHighlights({ highlights }: { highlights: any }) {
  if (!highlights) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <HighlightCard
        label="Produto mais vendido"
        metricLabel="Vendidos"
        metricValue={highlights.mostSold.sold.toLocaleString("pt-BR")}
        title={highlights.mostSold.name}
      />
      <HighlightCard
        label="Melhor avaliado"
        metricLabel="Avaliação"
        metricValue={highlights.bestRated.rating.toFixed(1)}
        title={highlights.bestRated.name}
      />
      <HighlightCard
        label="Menos vendido"
        metricLabel="Vendidos"
        metricValue={highlights.leastSold.sold.toLocaleString("pt-BR")}
        title={highlights.leastSold.name}
      />
      <HighlightCard
        label="Menor avaliado"
        metricLabel="Avaliação"
        metricValue={highlights.worstRated.rating.toFixed(1)}
        title={highlights.worstRated.name}
      />
    </div>
  )
}