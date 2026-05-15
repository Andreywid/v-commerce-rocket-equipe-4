import { useState } from "react"

import type { ProductCategory, ProductFormValues, RatingLabel } from "@/types"
import { emptyProductForm, productCategoryOptions, ratingLabelOptions } from "@/mocks/products"
import { FormInput, FormSelect, ModalActions, ModalFrame } from "@/components/shared/FormPrimitives"

export function ProductFormModal({
  initialValues = emptyProductForm,
  onClose,
  onSubmit,
  title,
}: {
  initialValues?: ProductFormValues
  onClose: () => void
  onSubmit: (values: ProductFormValues) => void
  title: string
}) {
  const [form, setForm] = useState<ProductFormValues>(initialValues)

  return (
    <ModalFrame title={title} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit(form)
        }}
      >
        <FormInput label="Nome do produto" onChange={(value) => setForm({ ...form, name: value })} value={form.name} />
        <FormSelect
          label="Categoria"
          onChange={(value) => setForm({ ...form, categories: [value as ProductCategory] })}
          options={productCategoryOptions}
          value={form.categories[0]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Preço"
            onChange={(value) => setForm({ ...form, price: value })}
            placeholder="R$ 199,90"
            value={form.price}
          />
          <FormInput
            label="Estoque"
            onChange={(value) => setForm({ ...form, stock: Number(value) })}
            placeholder="24"
            value={String(form.stock)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormInput
            label="Avaliação"
            onChange={(value) => setForm({ ...form, rating: value })}
            placeholder="4.5"
            value={form.rating}
          />
          <FormSelect
            label="Classificação"
            onChange={(value) => setForm({ ...form, ratingLabel: value as RatingLabel })}
            options={ratingLabelOptions}
            value={form.ratingLabel}
          />
        </div>
        <FormInput
          label="Vendidos"
          onChange={(value) => setForm({ ...form, sold: Number(value) })}
          placeholder="100"
          value={String(form.sold)}
        />
        <ModalActions onClose={onClose} submitLabel={title === "Editar produto" ? "Salvar alterações" : "Adicionar produto"} />
      </form>
    </ModalFrame>
  )
}
