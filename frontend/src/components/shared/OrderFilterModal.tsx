import { useState } from "react"
import { Check, Filter, X } from "lucide-react"

import type { OrderPrazo, OrderStatus } from "@/types"
import { orderStatusOptions } from "@/mocks/orders"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type OrderFilters = {
  date: string
  statuses: OrderStatus[]
  priceMin: number
  priceMax: number
  prazo: OrderPrazo[]
}

export const emptyOrderFilters: OrderFilters = {
  date: "",
  statuses: [],
  priceMin: 0,
  priceMax: 100000,
  prazo: [],
}

const STATUS_CHIP: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Processando:   { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  Entregue:      { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
  Cancelado:     { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  "Em trânsito": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
}

const PRICE_MAX = 100000

function DualRangeSlider({
  value,
  onChange,
}: {
  value: [number, number]
  onChange: (v: [number, number]) => void
}) {
  const [lo, hi] = value
  const loPercent = (lo / PRICE_MAX) * 100
  const hiPercent = (hi / PRICE_MAX) * 100

  return (
    <div className="relative flex h-5 items-center">
      <div className="absolute h-1.5 w-full rounded-full bg-slate-200" />
      <div
        className="absolute h-1.5 rounded-full bg-[#0F172A]"
        style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
      />
      <input
        type="range"
        min={0}
        max={PRICE_MAX}
        step={1000}
        value={lo}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi - 1000), hi])}
        className="range-thumb absolute w-full appearance-none bg-transparent"
        style={{ zIndex: lo >= hi - 1000 ? 5 : 3 }}
      />
      <input
        type="range"
        min={0}
        max={PRICE_MAX}
        step={1000}
        value={hi}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + 1000)])}
        className="range-thumb absolute w-full appearance-none bg-transparent"
        style={{ zIndex: 4 }}
      />
    </div>
  )
}

export function OrderFilterModal({
  filters,
  onApply,
  onClose,
}: {
  filters: OrderFilters
  onApply: (filters: OrderFilters) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<OrderFilters>(filters)

  function toggleStatus(status: OrderStatus) {
    const next = form.statuses.includes(status)
      ? form.statuses.filter((s) => s !== status)
      : [...form.statuses, status]
    setForm({ ...form, statuses: next })
  }

  function togglePrazo(prazo: OrderPrazo) {
    const next = form.prazo.includes(prazo)
      ? form.prazo.filter((p) => p !== prazo)
      : [...form.prazo, prazo]
    setForm({ ...form, prazo: next })
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

        <div className="grid gap-0">
          {/* Data do pedido */}
          <div className="grid gap-2 pt-4 pb-3">
            <Label className="text-sm font-semibold text-slate-800">Data do pedido</Label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-9 w-86 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <hr className="border-slate-100" />

          {/* Status do pedido */}
          <div className="grid gap-2 py-3">
            <Label className="text-sm font-semibold text-slate-800">Status do pedido</Label>
            <Select
              value=""
              onValueChange={(v) => { if (v) toggleStatus(v as OrderStatus) }}
            >
              <SelectTrigger className="h-9 rounded-lg sm:w-80">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {orderStatusOptions
                  .filter((s) => !form.statuses.includes(s))
                  .map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
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
                      <button
                        type="button"
                        onClick={() => toggleStatus(s)}
                        className="ml-0.5 rounded-full hover:opacity-70"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Faixa de preço + Prazo */}
          <div className="grid gap-4 pt-3 sm:grid-cols-2">
            {/* Faixa de preço */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-slate-800">Faixa de preço</Label>
              <div className="flex gap-3">
                <Input
                  className="h-9 rounded-lg"
                  placeholder="R$ Min"
                  type="number"
                  min={0}
                  max={form.priceMax - 1000}
                  value={form.priceMin === 0 ? "" : form.priceMin}
                  onChange={(e) => {
                    const v = Math.min(Number(e.target.value) || 0, form.priceMax - 1000)
                    setForm({ ...form, priceMin: v })
                  }}
                />
                <Input
                  className="h-9 rounded-lg"
                  placeholder="R$ Máx"
                  type="number"
                  min={form.priceMin + 1000}
                  max={PRICE_MAX}
                  value={form.priceMax === PRICE_MAX ? "" : form.priceMax}
                  onChange={(e) => {
                    const v = Math.max(Number(e.target.value) || PRICE_MAX, form.priceMin + 1000)
                    setForm({ ...form, priceMax: Math.min(v, PRICE_MAX) })
                  }}
                />
              </div>
              <DualRangeSlider
                value={[form.priceMin, form.priceMax]}
                onChange={([lo, hi]) => setForm({ ...form, priceMin: lo, priceMax: hi })}
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>R$0</span>
                <span>R$100.000</span>
              </div>
            </div>

            {/* Prazo */}
            <div className="grid gap-2">
              <Label className="text-sm font-semibold text-slate-800">Prazo</Label>
              <div className="flex flex-col gap-2">
                {(["No prazo", "Fora do prazo"] as OrderPrazo[]).map((p) => (
                  <label key={p} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.prazo.includes(p)}
                      onChange={() => togglePrazo(p)}
                      className="size-4 cursor-pointer rounded border-slate-300 accent-[#0F172A]"
                    />
                    <span className="text-sm text-slate-600">
                      {p === "No prazo" ? "Dentro do prazo" : "Fora do prazo"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
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
              onClick={() => onApply(form)}
              type="button"
            >
              <Check className="size-4" />
              Salvar alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
