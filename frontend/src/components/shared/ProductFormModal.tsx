import { useRef, useState } from "react"
import { Check, Pencil, Trash2, Upload, X } from "lucide-react"

import type { ProductCategory, ProductFormValues } from "@/types"
import { emptyProductForm, productCategoryOptions } from "@/mocks/products"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function deriveImageName(imageUrl?: string): string {
  if (!imageUrl) return ""
  const parts = imageUrl.split("/")
  const last = parts[parts.length - 1]
  return last.includes(".") ? last : "imagem.jpg"
}

export function ProductFormModal({
  initialValues = emptyProductForm,
  onClose,
  onDelete,
  onSubmit,
  productId,
  title = "Adicionar produto",
}: {
  initialValues?: ProductFormValues
  onClose: () => void
  onDelete?: () => void
  onSubmit: (values: ProductFormValues) => void
  productId?: string
  title?: string
}) {
  const [form, setForm] = useState<ProductFormValues>(initialValues)
  const [imageName, setImageName] = useState(() => deriveImageName(initialValues.imageUrl))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!productId

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageName(file.name)
    const url = URL.createObjectURL(file)
    setForm((prev) => ({ ...prev, imageUrl: url }))
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-medium text-[#4F46E5]">
            <Pencil className="size-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4 pt-4"
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
        >
          {/* Row 1: Nome | Código */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Nome do produto</Label>
              <Input
                placeholder="ex: Perfume Premium"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Código do produto</Label>
              <Input
                className={isEditing ? "bg-slate-50 text-slate-400" : ""}
                disabled={isEditing}
                placeholder="ex: PROD-0001"
                value={isEditing ? productId : ""}
                readOnly={isEditing}
                onChange={() => {}}
              />
            </div>
          </div>

          {/* Row 2: Preço | Categoria | Quantidade no estoque */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Preço</Label>
              <div className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3">
                <span className="shrink-0 text-sm text-slate-500">R$</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  placeholder="199,90"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Categoria</Label>
              <Select
                value={form.categories[0]}
                onValueChange={(v) => setForm({ ...form, categories: [v as ProductCategory] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {productCategoryOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Quantidade no estoque</Label>
              <Input
                placeholder="ex: 24"
                value={form.stock === 0 ? "" : String(form.stock)}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-slate-700">Descrição</Label>
            <textarea
              className="min-h-24 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Descreva o produto..."
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Imagem */}
          <div className="grid gap-1.5">
            <Label className="text-sm font-semibold text-slate-700">Imagem</Label>
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="" className="size-10 rounded-md object-cover" />
                )}
                <span className="text-sm font-medium text-indigo-600">
                  {imageName || "Nenhuma imagem selecionada"}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-2 rounded-full px-4 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-4" />
                Substituir imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            {onDelete ? (
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full border-[#F43F5E] px-6 text-[#F43F5E] hover:bg-rose-50 hover:text-[#F43F5E]"
                onClick={onDelete}
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
                className="h-10 gap-2 rounded-full px-6 bg-[#1E293B] hover:bg-[#1E293B]/90 text-white"
                type="submit"
              >
                <Check className="size-4" />
                {isEditing ? "Salvar alterações" : "Adicionar produto"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
