import { useState } from "react"
import { Check, SlidersHorizontal, X } from "lucide-react"

import type { OrderStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ORDER_STATUS_OPTIONS: OrderStatus[] = ["Aprovado", "Processando", "Recusado", "Reembolsado"]

export type OrderFilters = {
  date: string
  statuses: OrderStatus[]
  priceMin: number
  priceMax: number
}

export const emptyOrderFilters: OrderFilters = {
  date: "",
  statuses: [],
  priceMin: 0,
  priceMax: 100000,
}

const STATUS_CHIP: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Aprovado:    { bg: "#DCFCE7", text: "#15803D", border: "#86EFAC" },
  Processando: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  Recusado:    { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  Reembolsado: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
}

const PRICE_MAX = 100000

const RANGE_THUMB_CLASSES = [
  "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent",
  "pointer-events-none",
  "[&::-webkit-slider-thumb]:pointer-events-auto",
  "[&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:size-4",
  "[&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:bg-white",
  "[&::-webkit-slider-thumb]:border-2",
  "[&::-webkit-slider-thumb]:border-[#0F172A]",
  "[&::-webkit-slider-thumb]:cursor-pointer",
  "[&::-webkit-slider-thumb]:shadow-sm",
  "[&::-moz-range-thumb]:size-4",
  "[&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:bg-white",
  "[&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-[#0F172A]",
  "[&::-moz-range-thumb]:cursor-pointer",
].join(" ")

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

  const minPct = (form.priceMin / PRICE_MAX) * 100
  const maxPct = (form.priceMax / PRICE_MAX) * 100

  function toggleStatus(status: OrderStatus) {
    const next = form.statuses.includes(status)
      ? form.statuses.filter((s) => s !== status)
      : [...form.statuses, status]
    setForm({ ...form, statuses: next })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-[800px] flex-col rounded-lg bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#4F46E5]" />
            <span className="font-semibold text-[#4F46E5]">Filtros avançados</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-0 px-6 py-5">

          {/* Data do pedido */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Data do pedido</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-9 w-60 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            />
          </div>

          <hr className="border-slate-100 mb-4" />

          {/* Status do pedido */}
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">Status do pedido</label>
            <Select
              value=""
              onValueChange={(v) => { if (v) toggleStatus(v as OrderStatus) }}
            >
              <SelectTrigger className="h-9 rounded-md sm:w-80">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_OPTIONS
                  .filter((s) => !form.statuses.includes(s))
                  .map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {form.statuses.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
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
                        className="ml-0.5 opacity-60 hover:opacity-100"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <hr className="border-slate-100 mb-4" />

          {/* Faixa de preço */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Faixa de preço</label>
            <div className="mb-4 flex gap-3">
              <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
                <span className="shrink-0 text-sm text-slate-400">R$ Min</span>
                <input
                  type="number"
                  min={0}
                  max={form.priceMax - 1000}
                  value={form.priceMin === 0 ? "" : form.priceMin}
                  placeholder="0"
                  onChange={(e) => setForm({ ...form, priceMin: Math.min(Number(e.target.value) || 0, form.priceMax - 1000) })}
                  className="w-full text-sm text-slate-700 outline-none"
                />
              </label>
              <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
                <span className="shrink-0 text-sm text-slate-400">R$ Máx</span>
                <input
                  type="number"
                  min={form.priceMin + 1000}
                  max={PRICE_MAX}
                  value={form.priceMax === PRICE_MAX ? "" : form.priceMax}
                  placeholder="100.000"
                  onChange={(e) => setForm({ ...form, priceMax: Math.max(Number(e.target.value) || PRICE_MAX, form.priceMin + 1000) })}
                  className="w-full text-sm text-slate-700 outline-none"
                />
              </label>
            </div>
            <div className="relative h-1.5 rounded-full bg-slate-200">
              <div
                className="absolute h-1.5 rounded-full bg-[#0F172A]"
                style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
              />
              <input
                type="range" min={0} max={PRICE_MAX} step={1000} value={form.priceMin}
                onChange={(e) => setForm({ ...form, priceMin: Math.min(Number(e.target.value), form.priceMax - 1000) })}
                className={RANGE_THUMB_CLASSES}
              />
              <input
                type="range" min={0} max={PRICE_MAX} step={1000} value={form.priceMax}
                onChange={(e) => setForm({ ...form, priceMax: Math.max(Number(e.target.value), form.priceMin + 1000) })}
                className={RANGE_THUMB_CLASSES}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-400">
              <span>R$0</span>
              <span>R$100.000</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" className="h-10 gap-2 rounded-full px-6" onClick={onClose} type="button">
            <X className="size-4" /> Cancelar
          </Button>
          <Button
            className="h-10 gap-2 rounded-full bg-[#1E293B] px-6 hover:bg-[#1E293B]/90 text-white"
            onClick={() => onApply(form)}
            type="button"
          >
            <Check className="size-4" /> Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  )
}
