import { useState } from "react"
import { Calendar, Check, Filter, X } from "lucide-react"

import type { SupportStatus, SupportType } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const SUPPORT_TYPE_OPTIONS: SupportType[] = ["Entrega", "Reembolso", "Produto", "Pagamento"]
const SUPPORT_STATUS_OPTIONS: SupportStatus[] = ["Aberto", "Resolvido"]

export type SupportFilters = {
  date: string
  types: SupportType[]
  statuses: SupportStatus[]
}

export const emptySupportFilters: SupportFilters = {
  date: "",
  types: [],
  statuses: [],
}

const TYPE_CHIP: Record<SupportType, { bg: string; text: string; border: string }> = {
  Pagamento: { bg: "#EEF2FF", text: "#6366F1", border: "#C7D2FE" },
  Entrega:   { bg: "#ECFDF5", text: "#059669", border: "#A7F3D0" },
  Reembolso: { bg: "#FFF1F2", text: "#F43F5E", border: "#FECDD3" },
  Produto:   { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
}

const STATUS_CHIP: Record<SupportStatus, { bg: string; text: string; border: string }> = {
  Aberto:    { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  Resolvido: { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
}

export function SupportFilterModal({
  filters,
  onApply,
  onClose,
}: {
  filters: SupportFilters
  onApply: (filters: SupportFilters) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<SupportFilters>(filters)

  function toggleType(type: SupportType) {
    const next = form.types.includes(type)
      ? form.types.filter((t) => t !== type)
      : [...form.types, type]
    setForm({ ...form, types: next })
  }

  function toggleStatus(status: SupportStatus) {
    const next = form.statuses.includes(status)
      ? form.statuses.filter((s) => s !== status)
      : [...form.statuses, status]
    setForm({ ...form, statuses: next })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[#4F46E5]">
            <Filter className="size-4" />
            Filtro avançado
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-4">
          {/* Data do ticket */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-800">Data do ticket</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="h-9 rounded-lg pl-9"
                placeholder="DD/MM/AAAA"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          {/* Tipo do ticket */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-800">Tipo do ticket</Label>
            <Select value="" onValueChange={(v) => { if (v) toggleType(v as SupportType) }}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="Selecione o tipo do ticket" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_TYPE_OPTIONS
                  .filter((t) => !form.types.includes(t))
                  .map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.types.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.types.map((t) => {
                  const c = TYPE_CHIP[t]
                  return (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                    >
                      {t}
                      <button type="button" onClick={() => toggleType(t)} className="ml-0.5 rounded-full hover:opacity-70">
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="col-span-2 border-t border-slate-100" />

          {/* Status do ticket */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-800">Status do ticket</Label>
            <Select value="" onValueChange={(v) => { if (v) toggleStatus(v as SupportStatus) }}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORT_STATUS_OPTIONS
                  .filter((s) => !form.statuses.includes(s))
                  .map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.statuses.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.statuses.map((s) => {
                  const c = STATUS_CHIP[s]
                  return (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
                    >
                      {s}
                      <button type="button" onClick={() => toggleStatus(s)} className="ml-0.5 rounded-full hover:opacity-70">
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
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
            onClick={() => { onApply(form); onClose() }}
            type="button"
          >
            <Check className="size-4" />
            Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
