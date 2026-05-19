import { useState } from "react"
import { Check, ImageIcon, SquarePen, Trash2, Upload, X } from "lucide-react"

import type { ClientFormValues, ClientStatus } from "@/types"
import { clientStatusOptions, emptyClientForm } from "@/mocks/clients"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LOCATION_OPTIONS = [
  "Jaguaribara, CE",
  "Rio de Janeiro, RJ",
  "Cuiabá, MT",
  "Rio Branco, AC",
  "Salvador, BA",
  "Blumenau, SC",
]

const inputCls =
  "w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  )
}

export function ClientFormModal({
  initialValues = emptyClientForm,
  onClose,
  onDelete,
  onSubmit,
  title,
}: {
  initialValues?: ClientFormValues
  onClose: () => void
  onDelete?: () => void
  onSubmit: (values: ClientFormValues) => void
  title: string
}) {
  const [form, setForm] = useState<ClientFormValues>(initialValues)
  const isEditing = !!onDelete
  const email = `${form.name.toLowerCase().replace(/\s+/g, ".") || "cliente"}@hotmail.com`

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 h-131.25 rounded-lg flex flex-col px-6 py-4 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-[#4F46E5] text-[18px] font-medium leading-6.75 tracking-normal">
            <SquarePen className="size-4" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-1 flex-col overflow-hidden"
          onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
        >
          <div className="flex-1 overflow-y-auto flex flex-col gap-5 py-5 pl-0.5 pr-1">
            {/* Imagem */}
            <section className="grid gap-2">
              <label className="text-sm font-medium text-slate-700">Imagem</label>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center gap-3 text-slate-400">
                  <ImageIcon className="size-6 shrink-0 text-[#525252]" />
                  <span className="text-sm text-slate-500">Imagem do cliente</span>
                </div>
                <Button variant="outline" size="sm" type="button" className="shrink-0 gap-1.5">
                  <Upload className="size-3.5" />
                  Enviar imagem
                </Button>
              </div>
            </section>

            <div className="border-t border-slate-100" />

            {/* Nome + E-mail */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do cliente">
                <input
                  className={inputCls}
                  placeholder="Insira o nome do cliente"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </Field>
              <Field label="E-mail">
                <input
                  className={inputCls + " cursor-default bg-slate-50 text-slate-400"}
                  readOnly
                  value={email}
                />
              </Field>
            </div>

            <div className="border-t border-slate-100" />

            {/* Localização + Status */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Localização">
                <Select
                  value={form.location}
                  onValueChange={(v) => setForm((f) => ({ ...f, location: v ?? f.location }))}
                >
                  <SelectTrigger className="w-full border-slate-200 text-sm">
                    <SelectValue placeholder="Selecione a localização" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as ClientStatus }))}
                >
                  <SelectTrigger className="w-full border-slate-200 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {clientStatusOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {isEditing && (
              <>
                <div className="border-t border-slate-100" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Último pedido">
                    <input
                      className={inputCls}
                      placeholder="dd/mm/aaaa"
                      value={form.lastOrder}
                      onChange={(e) => setForm((f) => ({ ...f, lastOrder: e.target.value }))}
                    />
                  </Field>
                  <Field label="Qtd. de pedidos">
                    <input
                      type="number"
                      className={inputCls}
                      placeholder="1"
                      min={0}
                      value={form.orderCount === 0 ? "" : form.orderCount}
                      onChange={(e) => setForm((f) => ({ ...f, orderCount: Number(e.target.value) || 0 }))}
                    />
                  </Field>
                  <Field label="Total">
                    <input
                      className={inputCls}
                      placeholder="R$ 1.500,00"
                      value={form.total}
                      onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
                    />
                  </Field>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between border-t border-slate-100 pt-4">
            {onDelete ? (
              <Button
                variant="outline"
                className="h-10 gap-1.5 rounded-full border-[#F43F5E] px-5 text-[#F43F5E] hover:bg-rose-50 hover:text-[#F43F5E]"
                onClick={onDelete}
                type="button"
              >
                <Trash2 className="size-3.5" />
                Excluir
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-10 gap-1.5 rounded-full px-5"
                onClick={onClose}
                type="button"
              >
                <X className="size-3.5" /> Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 gap-1.5 rounded-full bg-[#0F172A] px-5 text-white hover:bg-[#0F172A]/90"
              >
                <Check className="size-3.5" /> Confirmar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
