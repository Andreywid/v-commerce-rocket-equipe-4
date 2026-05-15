import { useState } from "react"

import type { ClientFormValues, ClientStatus } from "@/types"
import { clientStatusOptions, emptyClientForm } from "@/mocks/clients"
import { FormInput, FormSelect, ModalActions, ModalFrame } from "@/components/shared/FormPrimitives"

export function ClientFormModal({
  initialValues = emptyClientForm,
  onClose,
  onSubmit,
  title,
}: {
  initialValues?: ClientFormValues
  onClose: () => void
  onSubmit: (values: ClientFormValues) => void
  title: string
}) {
  const [form, setForm] = useState<ClientFormValues>(initialValues)

  return (
    <ModalFrame title={title} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <FormInput label="Nome" onChange={(value) => setForm({ ...form, name: value })} value={form.name} />
        <FormInput
          label="Localização"
          onChange={(value) => setForm({ ...form, location: value })}
          placeholder="Cidade, UF"
          value={form.location}
        />
        <FormSelect
          label="Status"
          onChange={(value) => setForm({ ...form, status: value as ClientStatus })}
          options={clientStatusOptions}
          value={form.status}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Último pedido"
            onChange={(value) => setForm({ ...form, lastOrder: value })}
            placeholder="dd/mm/aaaa"
            value={form.lastOrder}
          />
          <FormInput
            label="Qtd. de pedidos"
            onChange={(value) => setForm({ ...form, orderCount: Number(value) })}
            placeholder="1"
            value={String(form.orderCount)}
          />
        </div>
        <FormInput
          label="Total"
          onChange={(value) => setForm({ ...form, total: value })}
          placeholder="R$ 1.500,00"
          value={form.total}
        />
        <ModalActions onClose={onClose} submitLabel={title === "Editar cliente" ? "Salvar alterações" : "Adicionar cliente"} />
      </form>
    </ModalFrame>
  )
}
