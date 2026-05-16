import type { ProductRow } from "@/types"
import { getProductImage } from "@/mocks/productImages"
import { categoryClasses } from "@/constants/badgeStyles"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RatingBadge, StatusBadge } from "@/components/shared/StatusBadge"

function getProductDescription(product: ProductRow): string {
  if (product.name.toLowerCase().includes("perfume")) {
    return "Uma fragrância sofisticada que traduz elegância e presença em cada detalhe. Com notas de saída frescas e envolventes, evolui para um coração floral marcante, finalizando com acordes amadeirados que permanecem na pele por horas. Desenvolvido para quem busca mais do que um perfume, mas uma assinatura única, capaz de transformar momentos em experiências memoráveis."
  }
  return "Produto cadastrado no catálogo V-Commerce com acompanhamento de estoque, preço, vendas e avaliação para apoiar decisões comerciais."
}

export function ProductDetailDialog({
  onClose,
  onEdit,
  product,
}: {
  onClose: () => void
  onEdit: () => void
  product: ProductRow
}) {
  const imageSrc = getProductImage(product)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[82dvh] overflow-hidden sm:max-w-140">
        <DialogHeader>
          <DialogTitle className="text-indigo-600">Detalhes do produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative h-36 overflow-hidden rounded-lg bg-slate-50 sm:h-40">
            {imageSrc ? (
              <img
                alt={product.name}
                className={`h-full w-full object-cover ${product.id === "PROD-0002" ? "object-[center_28%]" : "object-center"}`}
                src={imageSrc}
              />
            ) : (
              <div className="h-full bg-[linear-gradient(135deg,#f8fafc_0%,#fed7aa_38%,#f97316_39%,#fb923c_56%,#f8fafc_57%)]" />
            )}
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-orange-600 shadow-sm">
              {product.categories[0]}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
              {Math.max(12, product.sold % 120)} avaliações positivas
            </span>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-500 ring-1 ring-rose-200">
              {Math.max(4, product.stock % 40)} avaliações negativas
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{product.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-400">{product.id}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {product.categories.map((cat) => (
                  <StatusBadge key={cat} className={categoryClasses[cat]}>{cat}</StatusBadge>
                ))}
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-lg font-bold text-slate-700">{product.price}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Qt. no estoque: {product.stock}</p>
              <div className="mt-2 flex md:justify-end">
                <RatingBadge rating={product.rating} label={product.ratingLabel} />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">Descrição</p>
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{getProductDescription(product)}</p>
          </div>
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} type="button">Fechar</Button>
          <Button onClick={onEdit} type="button">Editar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
