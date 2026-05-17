import type { ProductCategory, ProductClassificacao } from "@/types"
import type { ProductOut } from "@/types/api"
import { categoryClasses, classificacaoClasses } from "@/constants/badgeStyles"
import { formatCategoryLabel, getCategoryIcon } from "@/helpers/dictionary"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RatingBadge } from "@/components/shared/RatingBadge"
import { StatusBadge } from "@/components/shared/StatusBadge"

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProductDetailDialog({
  onClose,
  onEdit,
  product,
}: {
  onClose: () => void
  onEdit: () => void
  product: ProductOut
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[82dvh] overflow-hidden sm:max-w-140">
        <DialogHeader>
          <DialogTitle className="text-indigo-600">Detalhes do produto</DialogTitle>
        </DialogHeader>

        {/* Hero icon */}
        <div className="relative flex h-36 w-full items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-slate-100 border border-slate-100">
          {(() => {
            const Icon = getCategoryIcon(product.categoria)
            return <Icon className="size-16 text-indigo-400/60" />
          })()}
          {product.nota_media != null && (
            <span className="absolute bottom-2 left-2">
              <RatingBadge nota={product.nota_media} />
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-950">{product.nome_produto}</h2>
              <p className="mt-0.5 text-xs font-medium text-slate-400">#{product.id_produto}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <StatusBadge className={categoryClasses[product.categoria as ProductCategory]}>
                  {formatCategoryLabel(product.categoria)}
                </StatusBadge>

                <StatusBadge className={classificacaoClasses[product.classificacao as ProductClassificacao]}>
                  {product.classificacao}
                </StatusBadge>
                <StatusBadge className={product.ativo ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"}>
                  {product.ativo ? "Ativo" : "Inativo"}
                </StatusBadge>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xl font-bold text-slate-700">{formatBRL(product.preco_atual)}</p>
              {product.estoque != null && (
                <p className="mt-0.5 text-sm text-slate-500">{product.estoque} em estoque</p>
              )}
            </div>
          </div>

          {product.descricao && (
            <p className="text-sm leading-relaxed text-slate-600">{product.descricao}</p>
          )}
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} type="button">Fechar</Button>
          <Button onClick={onEdit} type="button">Editar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
