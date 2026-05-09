import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { RatingBadge } from "./RatingBadge"
import type { ProductRow, ProductCategory } from "@/types"

export const categoryClasses: Record<ProductCategory, string> = {
  Perfumaria: "bg-violet-50 text-violet-600 ring-violet-200",
  Artes: "bg-sky-50 text-sky-600 ring-sky-200",
  Esporte: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  Lazer: "bg-amber-50 text-amber-600 ring-amber-200",
  Bebês: "bg-pink-50 text-pink-600 ring-pink-200",
  "Utilidades domésticas": "bg-orange-50 text-orange-600 ring-orange-200",
  "Instrumentos Musicais": "bg-indigo-50 text-indigo-600 ring-indigo-200",
  Tecnologia: "bg-cyan-50 text-cyan-600 ring-cyan-200",
}

export function ProductDetailDialog({ onClose, onEdit, product }: {
  onClose: () => void
  onEdit: () => void
  product: ProductRow
}) {
  const formattedPrice = new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  }).format(product.price)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{product.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">{product.id}</span>
            {product.categories.map((cat) => (
              <StatusBadge key={cat} className={categoryClasses[cat]}>{cat}</StatusBadge>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-xs font-medium text-slate-500">Preço</p>
              <p className="mt-1 text-base font-bold text-slate-900">{formattedPrice}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-xs font-medium text-slate-500">Estoque</p>
              <p className="mt-1 text-base font-bold text-slate-900">{product.stock}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3 text-center">
              <p className="text-xs font-medium text-slate-500">Vendidos</p>
              <p className="mt-1 text-base font-bold text-slate-900">{product.sold.toLocaleString("pt-BR")}</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <p className="text-sm font-medium text-slate-600">Avaliação</p>
            <RatingBadge rating={product.rating} />
          </div>
        </div>
        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={onEdit}>Editar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}