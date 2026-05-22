import type { ProductCategory } from "@/types"
import type { ProductOut } from "@/types/api"
import { categoryClasses } from "@/constants/badgeStyles"
import { formatCategoryLabel, getCategoryIcon } from "@/helpers/dictionary"
import { useProductPerformance } from "@/hooks/useProducts"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { ThumbsUp, ThumbsDown } from "lucide-react"

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProductDetailDialog({
  onClose,
  product,
}: {
  onClose: () => void
  product: ProductOut
}) {
  const { data: perf } = useProductPerformance(product.id_produto)

  const qtdPositivas = perf != null && perf.pct_recomendam != null
    ? Math.round(perf.qtd_avaliacoes * (perf.pct_recomendam / 100))
    : null
  const qtdNegativas = perf != null && perf.pct_recomendam != null
    ? Math.round(perf.qtd_avaliacoes * (1 - perf.pct_recomendam / 100))
    : null

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[784px] p-0">
        <div className="pt-4 px-6 pb-10">
          <DialogHeader>
            <DialogTitle className="text-black">Detalhes do produto</DialogTitle>
          </DialogHeader>

          {/* Hero */}
          <div className="mt-4 flex h-56 w-full items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-100">
            {(() => {
              const Icon = getCategoryIcon(product.categoria)
              return <Icon className="size-24 text-indigo-400/60" />
            })()}
          </div>

          {/* Review badges */}
          {(qtdPositivas != null || qtdNegativas != null) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {qtdPositivas != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-[#BBF7D0] text-green-800">
                  <ThumbsUp className="size-3.5" />
                  {qtdPositivas.toLocaleString("pt-BR")} avaliações positivas
                </span>
              )}
              {qtdNegativas != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium bg-[#FECDD3] text-rose-800">
                  <ThumbsDown className="size-3.5" />
                  {qtdNegativas.toLocaleString("pt-BR")} avaliações negativas
                </span>
              )}
            </div>
          )}

          {/* Name + price */}
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-black">{product.nome_produto}</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">#{product.id_produto}</p>
              <div className="mt-1.5">
                <StatusBadge className={categoryClasses[product.categoria as ProductCategory]}>
                  {formatCategoryLabel(product.categoria)}
                </StatusBadge>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-[#334155]">{formatBRL(product.preco_atual)}</p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
