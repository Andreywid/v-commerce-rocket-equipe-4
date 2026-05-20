import { useState, useEffect } from "react"
import { SlidersHorizontal, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

export function formatMesAnoLabel(mesAno: string): string {
  const [ano, mes] = mesAno.split("-")
  return `${MONTH_NAMES[parseInt(mes) - 1]} de ${ano}`
}

export type FilterState = {
  mesAno: string   // "YYYY-MM" ou "" (auto = mais recente)
  pairKey: string  // "YYYY-YYYY" ex: "2025-2024", ou "" (auto)
}

export const DEFAULT_FILTER: FilterState = { mesAno: "", pairKey: "" }

export function hasAnyFilter(f: FilterState): boolean {
  return f.mesAno !== "" || f.pairKey !== ""
}

type FilterModalProps = {
  open: boolean
  onClose: () => void
  onSave: (filters: FilterState) => void
  initial?: FilterState
  availableMeses: string[]  // ["2026-05", "2026-04", ...] desc
  availablePairs: string[]  // ["2026-2025", "2025-2024", "2024-2023"] — só pares com dados
}

export function FilterModal({
  open,
  onClose,
  onSave,
  initial,
  availableMeses,
  availablePairs,
}: FilterModalProps) {
  const [state, setState] = useState<FilterState>(initial ?? DEFAULT_FILTER)

  useEffect(() => {
    if (open) setState(initial ?? DEFAULT_FILTER)
  }, [open, initial])

  if (!open) return null

  function handleSave() {
    onSave(state)
    onClose()
  }

  function handleReset() {
    onSave(DEFAULT_FILTER)
    onClose()
  }

  function formatPairLabel(pair: string): string {
    const [atual, anterior] = pair.split("-")
    return `${atual} vs ${anterior}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-indigo-600" />
            <span className="font-semibold text-indigo-600">Filtros avançados</span>
          </div>
          <button type="button" onClick={onClose}
            className="grid size-7 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-6 py-5">

          {/* Mês de referência dos KPIs */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Mês de referência
            </label>
            <p className="mb-2 text-xs text-slate-400">Controla os KPI cards e os insights abaixo do gráfico.</p>
            <select
              value={state.mesAno}
              onChange={(e) => setState((s) => ({ ...s, mesAno: e.target.value }))}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Mais recente (padrão)</option>
              {availableMeses.map((m) => (
                <option key={m} value={m}>{formatMesAnoLabel(m)}</option>
              ))}
            </select>
          </div>

          {/* Par de anos do gráfico */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Comparativo do gráfico
            </label>
            <p className="mb-2 text-xs text-slate-400">Apenas anos com dados disponíveis são exibidos.</p>
            <select
              value={state.pairKey}
              onChange={(e) => setState((s) => ({ ...s, pairKey: e.target.value }))}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Automático (mais recente)</option>
              {availablePairs.map((p) => (
                <option key={p} value={p}>{formatPairLabel(p)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" size="sm" className="h-9 rounded-full px-5 text-slate-500" onClick={handleReset}>
            Limpar filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1.5 rounded-full px-5" onClick={onClose}>
              <X className="size-3.5" /> Cancelar
            </Button>
            <Button size="sm" className="h-9 gap-1.5 rounded-full bg-slate-900 px-5 hover:bg-slate-800" onClick={handleSave}>
              <Check className="size-3.5" /> Aplicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Re-export para compatibilidade
export const MONTHS = MONTH_NAMES
