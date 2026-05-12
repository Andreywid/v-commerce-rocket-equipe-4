import { useState, useRef, useEffect } from "react"
import { SlidersHorizontal, X, Check, Calendar, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const YEARS = ["2023", "2024", "2025", "2026"]

export type FilterState = {
  comparisonDate: string
  months: string[]
  years: string[]
}

const DEFAULT_FILTER: FilterState = { comparisonDate: "", months: [], years: [] }

type MultiSelectProps = {
  label: string
  options: string[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder: string
}

function MultiSelect({ label, options, selected, onChange, placeholder }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function toggle(option: string) {
    onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option])
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
          <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => toggle(opt)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {opt}
                  {selected.includes(opt) && <Check className="size-3.5 text-indigo-600" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(selected.filter((item) => item !== s))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type FilterModalProps = {
  open: boolean
  onClose: () => void
  onSave: (filters: FilterState) => void
  initial?: FilterState
}

export function FilterModal({ open, onClose, onSave, initial }: FilterModalProps) {
  const [state, setState] = useState<FilterState>(initial ?? DEFAULT_FILTER)

  useEffect(() => {
    if (open) setState(initial ?? DEFAULT_FILTER)
  }, [open, initial])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-200 flex-col rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-indigo-600" />
            <span className="font-semibold text-indigo-600">Filtro avançado</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data de comparação
            </label>
            <div className="relative w-full sm:w-56">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={state.comparisonDate}
                onChange={(e) => setState((s) => ({ ...s, comparisonDate: e.target.value }))}
                className="w-full rounded-md border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <MultiSelect
              label="Mês"
              options={MONTHS}
              selected={state.months}
              onChange={(months) => setState((s) => ({ ...s, months }))}
              placeholder="Selecione o mês para comparar"
            />
            <MultiSelect
              label="Ano"
              options={YEARS}
              selected={state.years}
              onChange={(years) => setState((s) => ({ ...s, years }))}
              placeholder="Selecione o ano para comparar"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full px-5" onClick={onClose}>
            <X className="size-3.5" /> Cancelar
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 rounded-full bg-slate-900 px-5 hover:bg-slate-800"
            onClick={() => { onSave(state); onClose() }}
          >
            <Check className="size-3.5" /> Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  )
}
