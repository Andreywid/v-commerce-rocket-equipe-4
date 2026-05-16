import { useState, useRef, useEffect, useMemo } from "react"
import { Filter, X, Check, ChevronDown } from "lucide-react"

import type { ClientStatus, RatingLabel } from "@/types"
import { clientStatusOptions } from "@/mocks/clients"
import { ratingLabelOptions } from "@/mocks/tickets"
import { useAppContext } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export type ClientAdvancedFilters = {
  name: string
  locations: string[]
  ratings: RatingLabel[]
  minTotal: number
  maxTotal: number
  statuses: ClientStatus[]
}

export const emptyClientAdvancedFilters: ClientAdvancedFilters = {
  name: "",
  locations: [],
  ratings: [],
  minTotal: 0,
  maxTotal: 100_000,
  statuses: [],
}

const TOTAL_MAX = 100_000

const RATING_CONFIG: Record<RatingLabel, { score: string; color: string; bg: string; border: string; text: string }> = {
  Ótimo:     { score: "4.5", color: "#6366F1", bg: "bg-indigo-50",  border: "border-indigo-200",  text: "text-[#6366F1]" },
  Excelente: { score: "4.9", color: "#22C55E", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-[#22C55E]" },
  Bom:       { score: "3.5", color: "#F59E0B", bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-500" },
  Crítico:   { score: "2.0", color: "#EF4444", bg: "bg-red-50",     border: "border-red-200",     text: "text-red-500"   },
}

const THUMB = [
  "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent pointer-events-none",
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer",
  "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:cursor-pointer",
].join(" ")

type MultiSelectProps = {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder: string
  renderTag: (opt: string, onRemove: () => void) => React.ReactNode
  renderOption?: (opt: string) => React.ReactNode
}

function MultiSelect({ label, options, selected, onChange, placeholder, renderTag, renderOption }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt])
  }

  return (
    <div className="flex-1" ref={ref}>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 hover:border-slate-300 focus:outline-none"
        >
          <span>{placeholder}</span>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => toggle(opt)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {renderOption ? renderOption(opt) : opt}
                  {selected.includes(opt) && <Check className="size-3.5 text-[#4F46E5]" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((s) => renderTag(s, () => onChange(selected.filter((x) => x !== s))))}
        </div>
      )}
    </div>
  )
}

function TotalRange({ min, max, onChange }: { min: number; max: number; onChange: (min: number, max: number) => void }) {
  const minPct = (min / TOTAL_MAX) * 100
  const maxPct = (max / TOTAL_MAX) * 100

  return (
    <div>
      <div className="mb-3 flex gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
          <span className="shrink-0 text-sm text-slate-400">R$</span>
          <input
            type="number" min={0} max={max}
            value={min === 0 ? "" : min}
            placeholder="Min"
            onChange={(e) => onChange(Math.min(Number(e.target.value) || 0, max - 1000), max)}
            className="w-full text-sm text-slate-700 outline-none"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
          <span className="shrink-0 text-sm text-slate-400">R$</span>
          <input
            type="number" min={min} max={TOTAL_MAX}
            value={max === TOTAL_MAX ? "" : max}
            placeholder="Máx"
            onChange={(e) => onChange(min, Math.max(Number(e.target.value) || TOTAL_MAX, min + 1000))}
            className="w-full text-sm text-slate-700 outline-none"
          />
        </label>
      </div>
      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div
          className="absolute h-1.5 rounded-full bg-slate-900"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input type="range" min={0} max={TOTAL_MAX} step={1000} value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - 1000), max)}
          className={THUMB} />
        <input type="range" min={0} max={TOTAL_MAX} step={1000} value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + 1000))}
          className={THUMB} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>R$0</span>
        <span>R$100.000</span>
      </div>
    </div>
  )
}

export function ClientAdvancedFilterDialog({
  filters,
  onApply,
  onClose,
}: {
  filters: ClientAdvancedFilters
  onApply: (filters: ClientAdvancedFilters) => void
  onClose: () => void
}) {
  const { clients } = useAppContext()
  const [draft, setDraft] = useState<ClientAdvancedFilters>(filters)

  const locationOptions = useMemo(
    () => [...new Set(clients.map((c) => c.location))].sort(),
    [clients],
  )

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-200 h-146.75 rounded-lg flex flex-col px-6 py-4 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-[#4F46E5] text-[18px] font-medium leading-6.75 tracking-normal">
            <Filter className="size-4" />
            Filtro avançado
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-5 py-5 pl-0.5 pr-1">
          {/* Nome ou código */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome ou código do cliente
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
              placeholder="Insira o nome ou código do cliente"
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="border-t border-slate-100" />

          {/* Localização + Avaliação */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <MultiSelect
              label="Localização"
              options={locationOptions}
              selected={draft.locations}
              onChange={(v) => setDraft((s) => ({ ...s, locations: v }))}
              placeholder="Selecione uma localização"
              renderTag={(opt, onRemove) => (
                <span key={opt} className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600">
                  {opt}
                  <button type="button" onClick={onRemove} className="opacity-60 hover:opacity-100">
                    <X className="size-3" />
                  </button>
                </span>
              )}
            />
            <MultiSelect
              label="Avaliação"
              options={ratingLabelOptions}
              selected={draft.ratings}
              onChange={(v) => setDraft((s) => ({ ...s, ratings: v as RatingLabel[] }))}
              placeholder="Selecione a categoria"
              renderOption={(opt) => {
                const cfg = RATING_CONFIG[opt as RatingLabel]
                return (
                  <span className="flex items-center gap-2">
                    <span
                      className="flex h-4 w-6.5 shrink-0 items-center justify-center rounded px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {cfg.score}
                    </span>
                    {opt}
                  </span>
                )
              }}
              renderTag={(opt, onRemove) => {
                const cfg = RATING_CONFIG[opt as RatingLabel]
                return (
                  <span key={opt} className={cn("flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs", cfg.bg, cfg.border, cfg.text)}>
                    <span
                      className="flex h-4 w-6.5 shrink-0 items-center justify-center rounded px-1 text-[10px] font-bold text-white"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {cfg.score}
                    </span>
                    {opt}
                    <button type="button" onClick={onRemove} className="opacity-60 hover:opacity-100">
                      <X className="size-3" />
                    </button>
                  </span>
                )
              }}
            />
          </div>

          <div className="border-t border-slate-100" />

          {/* Faixa de preço + Status */}
          <div className="flex flex-col gap-6 sm:flex-row">
            <div className="flex-1">
              <label className="mb-3 block text-sm font-medium text-slate-700">Faixa de preço</label>
              <TotalRange
                min={draft.minTotal}
                max={draft.maxTotal}
                onChange={(minTotal, maxTotal) => setDraft((s) => ({ ...s, minTotal, maxTotal }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-3 block text-sm font-medium text-slate-700">Status</label>
              <div className="flex items-center gap-6">
                {clientStatusOptions.map((status) => (
                  <label key={status} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={draft.statuses.includes(status)}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          statuses: e.target.checked
                            ? [...d.statuses, status]
                            : d.statuses.filter((x) => x !== status),
                        }))
                      }
                      className="size-4 rounded border-slate-300 accent-indigo-600"
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            className="h-10 gap-1.5 rounded-full px-5"
            onClick={onClose}
            type="button"
          >
            <X className="size-3.5" /> Cancelar
          </Button>
          <Button
            className="h-10 gap-1.5 rounded-full bg-slate-900 px-5 text-white hover:bg-slate-800"
            onClick={() => onApply(draft)}
            type="button"
          >
            <Check className="size-3.5" /> Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
