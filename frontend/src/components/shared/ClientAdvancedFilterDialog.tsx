import { useState, useRef, useEffect } from "react"
import { Check, ChevronDown, Filter, X } from "lucide-react"

import type { ClienteStatus, RatingLabel } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const LOCATION_OPTIONS = ["AC", "AL", "AM", "BA", "CE", "GO", "MA", "MG", "MT", "PA", "PB", "PE", "PR", "RJ", "RN", "RS", "SC", "SE", "SP", "TO"]
const RATING_OPTIONS: RatingLabel[] = ["Excelente", "Ótimo", "Bom", "Crítico"]
const TOTAL_MAX = 100_000

type RatingStyle = { outerBg: string; outerBorder: string; innerBg: string; textColor: string; nota: string }
const RATING_CHIP: Record<RatingLabel, RatingStyle> = {
  "Excelente": { outerBg: "bg-[#22C55E]/15", outerBorder: "border-[#22C55E]/40", innerBg: "bg-[#22C55E]", textColor: "text-[#22C55E]", nota: "4.9" },
  "Ótimo":     { outerBg: "bg-[#C7D2FE]/40",  outerBorder: "border-[#C7D2FE]",   innerBg: "bg-[#6366F1]", textColor: "text-[#6366F1]", nota: "4.5" },
  "Bom":       { outerBg: "bg-[#FDE68A]/40",  outerBorder: "border-[#FDE68A]",   innerBg: "bg-[#F59E0B]", textColor: "text-[#F59E0B]", nota: "3.0" },
  "Crítico":   { outerBg: "bg-[#FECDD3]/40",  outerBorder: "border-[#FECDD3]",   innerBg: "bg-[#F43F5E]", textColor: "text-[#F43F5E]", nota: "1.5" },
}

const THUMB = [
  "absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent pointer-events-none",
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer",
  "[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:cursor-pointer",
].join(" ")

export type ClientAdvancedFilters = {
  name: string
  locations: string[]
  avaliacoes: RatingLabel[]
  minTotal: number
  maxTotal: number
  statuses: ClienteStatus[]
}

export const emptyClientAdvancedFilters: ClientAdvancedFilters = {
  name: "",
  locations: [],
  avaliacoes: [],
  minTotal: 0,
  maxTotal: TOTAL_MAX,
  statuses: [],
}

function MultiSelect({
  label, options, selected, onChange, placeholder, renderTag, renderOption,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder: string
  renderTag: (opt: string, onRemove: () => void) => React.ReactNode
  renderOption?: (opt: string) => React.ReactNode
}) {
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 hover:border-slate-300 focus:outline-none"
        >
          <span>{placeholder}</span>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
          <span className="shrink-0 text-sm text-slate-400">R$</span>
          <input
            type="number" min={0} max={max}
            value={min === 0 ? "" : min}
            placeholder="Min"
            onChange={(e) => onChange(Math.min(Number(e.target.value) || 0, max - 1000), max)}
            className="w-full text-sm text-slate-700 outline-none"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
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
  const [draft, setDraft] = useState<ClientAdvancedFilters>(filters)

  function toggleStatus(s: ClienteStatus) {
    const next = draft.statuses.includes(s)
      ? draft.statuses.filter((x) => x !== s)
      : [...draft.statuses, s]
    setDraft((d) => ({ ...d, statuses: next }))
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[800px] rounded-lg flex flex-col px-6 py-4 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 pb-4 border-b border-slate-100">
          <DialogTitle className="flex items-center gap-2 text-[#4F46E5] text-base font-medium">
            <Filter className="size-4" />
            Filtros avançados
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-5">
          {/* Nome ou código */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Nome ou código do cliente
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft((s) => ({ ...s, name: e.target.value }))}
              placeholder="Insira o nome ou código do cliente"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div className="border-t border-slate-100" />

          {/* Localização + Avaliação */}
          <div className="flex gap-6">
            <MultiSelect
              label="Localização"
              options={LOCATION_OPTIONS}
              selected={draft.locations}
              onChange={(v) => setDraft((s) => ({ ...s, locations: v }))}
              placeholder="Selecione uma localização"
              renderTag={(opt, onRemove) => (
                <span key={opt} className="flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600">
                  {opt}
                  <button type="button" onClick={onRemove} className="opacity-60 hover:opacity-100"><X className="size-3" /></button>
                </span>
              )}
            />
            <MultiSelect
              label="Avaliação"
              options={RATING_OPTIONS}
              selected={draft.avaliacoes}
              onChange={(v) => setDraft((s) => ({ ...s, avaliacoes: v as RatingLabel[] }))}
              placeholder="Selecione a categoria"
              renderTag={(opt, onRemove) => {
                const c = RATING_CHIP[opt as RatingLabel]
                return (
                  <span key={opt} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${c.outerBg} ${c.outerBorder}`}>
                    <span className={`inline-flex h-4 items-center rounded px-1 text-[11px] font-bold leading-none text-white ${c.innerBg}`}>{c.nota}</span>
                    <span className={`text-xs font-medium ${c.textColor}`}>{opt}</span>
                    <button type="button" onClick={onRemove} className={`ml-0.5 hover:opacity-70 ${c.textColor}`}><X className="size-3" /></button>
                  </span>
                )
              }}
            />
          </div>

          <div className="border-t border-slate-100" />

          {/* Faixa de preço + Status */}
          <div className="flex gap-6">
            <div className="flex-1">
              <label className="mb-3 block text-sm font-semibold text-slate-700">Faixa de preço</label>
              <TotalRange
                min={draft.minTotal}
                max={draft.maxTotal}
                onChange={(minTotal, maxTotal) => setDraft((s) => ({ ...s, minTotal, maxTotal }))}
              />
            </div>

            <div className="flex-1">
              <label className="mb-3 block text-sm font-semibold text-slate-700">Status</label>
              <div className="flex gap-6">
                {(["Novo", "Recorrente"] as ClienteStatus[]).map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={draft.statuses.includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="size-4 rounded border-slate-300 text-[#4F46E5] accent-[#4F46E5]"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-full px-6"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" /> Cancelar
          </Button>
          <Button
            className="h-10 gap-2 rounded-full bg-[#0F172A] px-6 text-white hover:bg-[#0F172A]/90"
            onClick={() => onApply(draft)}
            type="button"
          >
            <Check className="size-4" /> Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
