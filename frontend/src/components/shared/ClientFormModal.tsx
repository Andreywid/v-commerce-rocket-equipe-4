import { useState } from "react"
import { Calendar, Trash2, Upload } from "lucide-react"

import type { ClientFormValues, ClientStatus } from "@/types"
import { clientStatusOptions, emptyClientForm } from "@/mocks/clients"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormInput, FormSelect, ModalActions, ModalFrame } from "@/components/shared/FormPrimitives"

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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
  const isEditing = title === "Editar cliente"

  if (isEditing) {
    const email = `${form.name.toLowerCase().replace(/\s+/g, ".") || "cliente"}@hotmail.com`

    return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle className="text-indigo-600">{title}</DialogTitle>
          </DialogHeader>

          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit(form)
            }}
          >
            <section className="grid gap-2">
              <Label className="text-xs font-semibold text-slate-700">Imagem</Label>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                    {getInitials(form.name)}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-600">
                    IMG9282_26.jpg
                  </span>
                </div>
                <Button variant="outline" size="sm" type="button">
                  <Upload className="size-4" />
                  Substituir imagem
                </Button>
              </div>
            </section>

            <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <FormInput label="Nome do cliente" onChange={(value) => setForm({ ...form, name: value })} value={form.name} />
              <div className="grid gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">E-mail</Label>
                <Input readOnly value={email} />
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
              <FormSelect
                label="Localização"
                onChange={(value) => setForm({ ...form, location: value })}
                options={["Jaguaribara, CE", "Rio de Janeiro, RJ", "Cuiabá, MT", "Rio Branco, AC", "Salvador, BA", "Blumenau, SC"]}
                value={form.location}
              />
              <div className="grid gap-1.5">
                <Label className="text-sm font-semibold text-slate-700">Último pedido</Label>
                <div className="relative">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="pl-9"
                    onChange={(event) => setForm({ ...form, lastOrder: event.target.value })}
                    value={form.lastOrder}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormSelect
                label="Status"
                onChange={(value) => setForm({ ...form, status: value as ClientStatus })}
                options={clientStatusOptions}
                value={form.status}
              />
              <FormInput
                label="Qtd. de pedidos"
                onChange={(value) => setForm({ ...form, orderCount: Number(value) })}
                placeholder="1"
                value={String(form.orderCount)}
              />
              <FormInput
                label="Total"
                onChange={(value) => setForm({ ...form, total: value })}
                placeholder="R$ 1.500,00"
                value={form.total}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" className="border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-600" type="button">
                <Trash2 className="size-4" />
                Excluir
              </Button>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={onClose} type="button">
                  Cancelar
                </Button>
                <Button type="submit">Salvar alterações</Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

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
