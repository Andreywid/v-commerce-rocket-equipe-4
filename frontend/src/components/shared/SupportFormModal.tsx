import { useState } from "react"

import type { RatingLabel, SupportFormValues, SupportType } from "@/types"
import { emptySupportForm, ratingLabelOptions, supportTypeOptions } from "@/mocks/tickets"
import { FormInput, FormSelect, ModalActions, ModalFrame } from "@/components/shared/FormPrimitives"

export function SupportFormModal({
  initialValues = emptySupportForm,
  onClose,
  onSubmit,
  title,
}: {
  initialValues?: SupportFormValues
  onClose: () => void
  onSubmit: (values: SupportFormValues) => void
  title: string
}) {
  const [form, setForm] = useState<SupportFormValues>(initialValues)

  return (
    <ModalFrame title={title} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <FormInput label="Cliente" onChange={(value) => setForm({ ...form, customer: value })} value={form.customer} />
        <FormSelect
          label="Tipo"
          onChange={(value) => setForm({ ...form, type: value as SupportType })}
          options={supportTypeOptions}
          value={form.type}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Data de criação" onChange={(value) => setForm({ ...form, createdAt: value })} value={form.createdAt} />
          <FormInput
            label="Data de resolução"
            onChange={(value) => setForm({ ...form, resolvedIn: value })}
            required={false}
            value={form.resolvedIn}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput label="Avaliação" onChange={(value) => setForm({ ...form, rating: value })} placeholder="4.5" value={form.rating} />
          <FormSelect
            label="Classificação"
            onChange={(value) => setForm({ ...form, ratingLabel: value as RatingLabel })}
            options={ratingLabelOptions}
            value={form.ratingLabel}
          />
        </div>
        <ModalActions onClose={onClose} submitLabel={title === "Editar ticket" ? "Salvar alterações" : "Adicionar ticket"} />
      </form>
    </ModalFrame>
  )
}
