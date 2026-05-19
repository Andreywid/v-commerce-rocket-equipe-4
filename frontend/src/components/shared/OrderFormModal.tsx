import { useState } from "react"
import { Check, ClipboardList, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import type { OrderCreate, OrderUpdate } from "@/types/api"
import { useProducts } from "@/hooks/useProducts"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ORDER_STATUSES = ["Processando", "Aprovado", "Recusado", "Reembolsado"] as const
const QUANTITIES = Array.from({ length: 20 }, (_, i) => i + 1)

type AddMode = {
  mode: "add"
  onSubmit: (values: OrderCreate) => void
}

type EditMode = {
  mode: "edit"
  orderId: string
  initialValues: OrderUpdate & { id_produto: string; data_pedido: string; status: OrderCreate["status"]; quantidade: number }
  onSubmit: (values: OrderUpdate) => void
  onDelete: () => void
}

type Props = (AddMode | EditMode) & {
  isSubmitting?: boolean
  onClose: () => void
}

export function OrderFormModal(props: Props) {
  const { isSubmitting = false, onClose } = props
  const isEditing = props.mode === "edit"

  const [idPedido] = useState(() => isEditing ? props.orderId : crypto.randomUUID())
  const [form, setForm] = useState<{ id_produto: string; data_pedido: string; status: OrderCreate["status"]; quantidade: number }>({
    id_produto: isEditing ? props.initialValues.id_produto : "",
    data_pedido: isEditing ? props.initialValues.data_pedido : "",
    status: isEditing ? props.initialValues.status : "Processando",
    quantidade: isEditing ? props.initialValues.quantidade : 1,
  })

  const { data: productsData } = useProducts({}, 1, 100)
  const products = productsData?.items ?? []

  function handleSubmit() {
    if (!form.id_produto) {
      toast.error("Selecione um produto para o pedido")
      return
    }
    if (!form.data_pedido) {
      toast.error("Informe a data do pedido")
      return
    }
    if (isEditing) {
      props.onSubmit({ ...form })
    } else {
      props.onSubmit({ id_pedido: idPedido, ...form })
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[800px] rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-medium text-[#4F46E5]">
            <ClipboardList className="size-4" />
            {isEditing ? "Editar pedido" : "Adicionar novo pedido"}
          </DialogTitle>
        </DialogHeader>

        <form className="grid gap-4 pt-4" onSubmit={(e) => e.preventDefault()}>
          {/* Row 1: Número | Data | Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Número do pedido</Label>
              <Input
                className="bg-slate-50 text-slate-500 text-xs"
                disabled
                value={idPedido}
                readOnly
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Data do pedido</Label>
              <Input
                type="date"
                value={form.data_pedido}
                onChange={(e) => setForm({ ...form, data_pedido: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Status do pedido</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as OrderCreate["status"] })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Produto | Quantidade */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Produto adquirido</Label>
              <Select
                value={form.id_produto ?? ""}
                onValueChange={(v) => setForm({ ...form, id_produto: v ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id_produto} value={p.id_produto}>
                      {p.nome_produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Quantidade</Label>
              <Select
                value={String(form.quantidade)}
                onValueChange={(v) => setForm({ ...form, quantidade: Number(v) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a quantidade" />
                </SelectTrigger>
                <SelectContent>
                  {QUANTITIES.map((q) => (
                    <SelectItem key={q} value={String(q)}>{q}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            {isEditing ? (
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full border-[#F43F5E] px-6 text-[#F43F5E] hover:bg-rose-50 hover:text-[#F43F5E]"
                onClick={props.onDelete}
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
                Confirmar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
