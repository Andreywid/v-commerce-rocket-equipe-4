import { useState } from "react"
import { Calendar, Check, Filter, X } from "lucide-react"

import type { RatingLabel, SupportStatus, SupportType } from "@/types"
import { ratingLabelOptions, supportStatusOptions, supportTypeOptions } from "@/mocks/tickets"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type SupportFilters = {
  date: string
  types: SupportType[]
  statuses: SupportStatus[]
  ratings: RatingLabel[]
}

export const emptySupportFilters: SupportFilters = {
  date: "",
  types: [],
  statuses: [],
  ratings: [],
}

const TYPE_CHIP: Record<SupportType, { bg: string; text: string; border: string }> = {
  Pagamento: { bg: "#EEF2FF", text: "#6366F1", border: "#C7D2FE" },
  Atraso:    { bg: "#FFFBEB", text: "#F59E0B", border: "#FDE68A" },
  Reembolso: { bg: "#FFF1F2", text: "#F43F5E", border: "#FECDD3" },
}

const STATUS_CHIP: Record<SupportStatus, { bg: string; text: string; border: string }> = {
  Aberto:          { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  "Em andamento":  { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  Resolvido:       { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
  Fechado:         { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
}

const RATING_COLOR: Record<RatingLabel, { outer: string; inner: string }> = {
  Ótimo:     { outer: "bg-indigo-50 text-[#6366F1] border-indigo-200",   inner: "bg-[#6366F1]" },
  Bom:       { outer: "bg-amber-50 text-[#F59E0B] border-amber-200",     inner: "bg-[#F59E0B]" },
  Excelente: { outer: "bg-emerald-50 text-[#22C55E] border-emerald-200", inner: "bg-[#22C55E]" },
  Crítico:   { outer: "bg-rose-50 text-[#F43F5E] border-rose-200",       inner: "bg-[#F43F5E]" },
}

const RATING_SCORE: Record<RatingLabel, string> = {
  Ótimo:     "4.5",
  Bom:       "4.0",
  Excelente: "4.9",
  Crítico:   "2.0",
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

  function toggleRating(rating: RatingLabel) {
    const next = form.ratings.includes(rating)
      ? form.ratings.filter((r) => r !== rating)
      : [...form.ratings, rating]
    setForm({ ...form, ratings: next })
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
                {supportTypeOptions
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
                {supportStatusOptions
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

          {/* Satisfação do cliente */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-800">Satisfação do cliente</Label>
            <Select value="" onValueChange={(v) => { if (v) toggleRating(v as RatingLabel) }}>
              <SelectTrigger className="h-9 rounded-lg">
                <SelectValue placeholder="Selecione o nível de satisfação" />
              </SelectTrigger>
              <SelectContent>
                {ratingLabelOptions
                  .filter((r) => !form.ratings.includes(r))
                  .map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {form.ratings.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.ratings.map((r) => {
                  const { outer, inner } = RATING_COLOR[r]
                  return (
                    <span
                      key={r}
                      className={`inline-flex h-6 items-center gap-1.5 rounded-full border px-1.5 text-xs font-medium ${outer}`}
                    >
                      <span className={`inline-flex h-4 w-6.5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white ${inner}`}>
                        {RATING_SCORE[r]}
                      </span>
                      {r}
                      <button type="button" onClick={() => toggleRating(r)} className="hover:opacity-70">
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
