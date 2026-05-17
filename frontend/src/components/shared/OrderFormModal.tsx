import { useState } from "react"
import { Check, Trash2, X } from "lucide-react"

import type { OrderFormValues, OrderStatus } from "@/types"
import { emptyOrderForm, orderStatusOptions } from "@/mocks/orders"
import { useAppContext } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const quantityOptions = ["1x", "2x", "3x", "4x", "5x", "6x", "7x", "8x", "9x", "10x"]

export function OrderFormModal({
  initialValues,
  onClose,
  onDelete,
  onSubmit,
  orderId,
  title = "Adicionar novo pedido",
}: {
  initialValues?: OrderFormValues
  onClose: () => void
  onDelete?: () => void
  onSubmit: (values: OrderFormValues) => void
  orderId?: string
  title?: string
}) {
  const { products } = useAppContext()
  const [form, setForm] = useState<OrderFormValues>(initialValues ?? emptyOrderForm)

  const productNames = products.map((p) => p.name)
  const isEditing = !!orderId

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-[18px] font-medium leading-6.75 tracking-normal text-[#4F46E5]">
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Número do pedido</Label>
              <Input
                className={isEditing ? "bg-slate-50 text-slate-400" : ""}
                disabled={isEditing}
                placeholder="Insira a numeração do pedido"
                value={isEditing ? orderId : form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Data do pedido</Label>
              <Input
                placeholder="ex: 29/03/2026"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Status do pedido</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: (v ?? "Processando") as OrderStatus })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatusOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Produto adquirido</Label>
              <Select
                value={form.product}
                onValueChange={(v) => setForm({ ...form, product: v ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {productNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Quantidade</Label>
              <Select
                value={form.quantity}
                onValueChange={(v) => setForm({ ...form, quantity: v ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a quantidade" />
                </SelectTrigger>
                <SelectContent>
                  {quantityOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

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
                Confirmar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
