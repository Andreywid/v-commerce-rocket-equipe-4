import { useState } from "react"
import { Check, Pencil, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import type { ProductCategory } from "@/types"
import type { ProductCreate } from "@/types/api"
import { formatCategoryLabel } from "@/helpers/dictionary"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"

const CATEGORIES: ProductCategory[] = ["Eletronicos", "Vestuario", "Casa", "Esportes", "Beleza", "Automotivo", "Brinquedos", "Moveis", "Sem categoria"]

const EMPTY: ProductCreate = {
  nome_produto: "",
  categoria: "Eletronicos",
  preco_atual: 0,
  ativo: true,
  estoque: 0,
}

export function ProductFormModal({
  initialValues = EMPTY,
  isSubmitting = false,
  onClose,
  onDelete,
  onSubmit,
  productId,
  title = "Adicionar produto",
}: {
  initialValues?: ProductCreate
  isSubmitting?: boolean
  onClose: () => void
  onDelete?: () => void
  onSubmit: (values: ProductCreate) => void
  productId?: string
  title?: string
}) {
  const [form, setForm] = useState<ProductCreate>(initialValues)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const isEditing = productId !== undefined

  function handleSubmit() {
    if (!form.nome_produto.trim()) {
      toast.error("O nome do produto é obrigatório")
      return
    }
    if (!form.preco_atual || form.preco_atual <= 0) {
      toast.error("Informe um preço válido para o produto")
      return
    }
    onSubmit(form)
  }

  return (
    <>
    <ConfirmDeleteDialog
      open={confirmingDelete}
      entityName="produto"
      onCancel={() => setConfirmingDelete(false)}
      onConfirm={() => { setConfirmingDelete(false); onDelete?.() }}
    />
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-medium text-[#4F46E5]">
            <Pencil className="size-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 pt-4" onSubmit={(e) => e.preventDefault()}>
          {/* Row 1: Nome | Código */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Nome do produto</Label>
              <Input
                placeholder="ex: Perfume Premium"
                value={form.nome_produto}
                onChange={(e) => setForm({ ...form, nome_produto: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Código do produto</Label>
              <Input
                className="bg-slate-50 text-slate-400"
                disabled
                placeholder="Gerado automaticamente"
                value={isEditing ? `#${productId}` : ""}
                readOnly
                onChange={() => {}}
              />
            </div>
          </div>

          {/* Row 2: Preço | Categoria | Estoque */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Preço</Label>
              <div className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3">
                <span className="shrink-0 text-sm text-slate-500">R$</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  placeholder="199,90"
                  value={form.preco_atual === 0 ? "" : String(form.preco_atual).replace(".", ",")}
                  onChange={(e) => setForm({ ...form, preco_atual: parseFloat(e.target.value.replace(",", ".")) || 0 })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm({ ...form, categoria: v as ProductCategory })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((opt) => (
                    <SelectItem key={opt} value={opt}>{formatCategoryLabel(opt)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Quantidade no estoque</Label>
              <Input
                placeholder="ex: 24"
                value={form.estoque === 0 || form.estoque == null ? "" : String(form.estoque)}
                onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            {onDelete ? (
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full border-[#F43F5E] px-6 text-[#F43F5E] hover:bg-rose-50 hover:text-[#F43F5E]"
                onClick={() => setConfirmingDelete(true)}
                type="button"
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full px-6"
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
                Cancelar
              </Button>
              <Button
                className="h-10 gap-2 rounded-full px-6 bg-[#1E293B] hover:bg-[#1E293B]/90 text-white disabled:opacity-60"
                disabled={isSubmitting}
                type="button"
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Check className="size-4" />
                )}
                {isEditing ? "Salvar alterações" : "Adicionar produto"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
