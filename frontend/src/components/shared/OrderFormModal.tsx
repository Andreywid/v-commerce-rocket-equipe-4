import { useState } from "react"

import type { OrderFormValues, OrderStatus } from "@/types"
import { emptyOrderForm, orderStatusOptions } from "@/mocks/orders"
import { FormInput, FormSelect, ModalActions, ModalFrame } from "@/components/shared/FormPrimitives"

export function OrderFormModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (values: OrderFormValues) => void
}) {
  const [form, setForm] = useState<OrderFormValues>(emptyOrderForm)

  return (
    <ModalFrame title="Criar novo pedido" onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <FormInput label="Produto" onChange={(value) => setForm({ ...form, product: value })} value={form.product} />
        <FormInput label="Cliente" onChange={(value) => setForm({ ...form, customer: value })} value={form.customer} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Valor" onChange={(value) => setForm({ ...form, value })} placeholder="R$ 199,90" value={form.value} />
          <FormInput label="Estoque" onChange={(value) => setForm({ ...form, stock: value })} placeholder="24" value={form.stock} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Data" onChange={(value) => setForm({ ...form, date: value })} placeholder="05/05/2026" value={form.date} />
          <FormInput label="Quantidade" onChange={(value) => setForm({ ...form, quantity: value })} placeholder="1x" value={form.quantity} />
        </div>
        <FormSelect
          label="Status"
          onChange={(value) => setForm({ ...form, status: value as OrderStatus })}
          options={orderStatusOptions}
          value={form.status}
        />
        <ModalActions onClose={onClose} submitLabel="Adicionar pedido" />
      </form>
    </ModalFrame>
  )
}
