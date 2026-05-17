import { useState } from "react"
import { Check, X } from "lucide-react"

import type { RatingLabel, SupportFormValues, SupportStatus, SupportType } from "@/types"
import { emptySupportForm, supportStatusOptions, supportTypeOptions } from "@/mocks/tickets"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SupportFormModal({
  initialValues = emptySupportForm,
  onClose,
  onSubmit,
  ticketId,
  title,
}: {
  initialValues?: SupportFormValues
  onClose: () => void
  onSubmit: (values: SupportFormValues) => void
  ticketId?: string
  title: string
}) {
  const [form, setForm] = useState<SupportFormValues>(initialValues)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-base font-semibold text-[#4F46E5]">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
        >
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4">
            {/* Ticket ID */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-800">Ticket ID</Label>
              <Input
                className="h-9 rounded-lg bg-slate-50 text-slate-400"
                disabled
                value={ticketId ?? "—"}
              />
            </div>

            {/* Cliente */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-800">Cliente</Label>
              <Input
                className="h-9 rounded-lg"
                placeholder="Nome do cliente"
                required
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
              />
            </div>

            {/* Tipo */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-800">Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as SupportType })}
              >
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportTypeOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-800">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as SupportStatus })}
              >
                <SelectTrigger className="h-9 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportStatusOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              className="h-10 gap-2 rounded-full px-6 bg-[#0F172A] hover:bg-[#0F172A]/90 text-white"
              type="submit"
            >
              <Check className="size-4" />
              Salvar alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
