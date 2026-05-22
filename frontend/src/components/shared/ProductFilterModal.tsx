/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from "react"
import { SlidersHorizontal, X, Check, ChevronDown } from "lucide-react"

import type { ProductCategory } from "@/types"
import { formatCategoryLabel } from "@/helpers/dictionary"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CATEGORIES: ProductCategory[] = ["Eletronicos", "Vestuario", "Casa", "Esportes", "Beleza", "Automotivo", "Brinquedos", "Moveis", "Sem categoria"]

const CATEGORY_TAG_CLASS: Record<ProductCategory, string> = {
  "Eletronicos":   "bg-[#C7D2FE]/30 text-[#6366F1] border-[#C7D2FE]",
  "Vestuario":     "bg-[#FECDD3]/30 text-[#F43F5E] border-[#FECDD3]",
  "Casa":          "bg-[#BBF7D0]/30 text-[#10B981] border-[#BBF7D0]",
  "Esportes":      "bg-[#FDE68A]/30 text-[#F59E0B] border-[#FDE68A]",
  "Beleza":        "bg-[#F5D0FE]/30 text-[#D946EF] border-[#F5D0FE]",
  "Automotivo":    "bg-[#E2E8F0]/30 text-[#64748B] border-[#E2E8F0]",
  "Brinquedos":    "bg-[#FFEDD5]/30 text-[#F97316] border-[#FFEDD5]",
  "Moveis":        "bg-[#CFFAFE]/30 text-[#06B6D4] border-[#CFFAFE]",
  "Sem categoria": "bg-[#CBD5E1]/30 text-[#94A3B8] border-[#CBD5E1]",
}

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

export type ProductFilterState = {
  search: string
  categories: ProductCategory[]
  minPrice: number
  maxPrice: number
}

export const DEFAULT_PRODUCT_FILTER: ProductFilterState = {
  search: "",
  categories: [],
  minPrice: 0,
  maxPrice: 100_000,
}

const PRICE_MAX = 100_000

function CategorySelect({
  selected,
  onChange,
}: {
  selected: ProductCategory[]
  onChange: (v: ProductCategory[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function toggle(cat: ProductCategory) {
    onChange(selected.includes(cat) ? selected.filter((s) => s !== cat) : [...selected, cat])
  }

  return (
    <div ref={ref}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 hover:border-slate-300 focus:outline-none"
        >
          <span>Selecione a categoria</span>
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => toggle(cat)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  {formatCategoryLabel(cat)}
                  {selected.includes(cat) && <Check className="size-3.5 text-[#0F172A]" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((cat) => (
            <span
              key={cat}
              className={cn("flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", CATEGORY_TAG_CLASS[cat])}
            >
              {formatCategoryLabel(cat)}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s !== cat))}
                className="opacity-60 hover:opacity-100"
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

function PriceRange({
  min,
  max,
  onChange,
}: {
  min: number
  max: number
  onChange: (min: number, max: number) => void
}) {
  const minPct = (min / PRICE_MAX) * 100
  const maxPct = (max / PRICE_MAX) * 100

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
          <span className="shrink-0 text-sm text-slate-400">R$ Min</span>
          <input
            type="number"
            min={0}
            max={max}
            value={min === 0 ? "" : min}
            placeholder="0"
            onChange={(e) => onChange(Math.min(Number(e.target.value) || 0, max), max)}
            className="w-full text-sm text-slate-700 outline-none"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
          <span className="shrink-0 text-sm text-slate-400">R$ Máx</span>
          <input
            type="number"
            min={min}
            max={PRICE_MAX}
            value={max === PRICE_MAX ? "" : max}
            placeholder="100.000"
            onChange={(e) => onChange(min, Math.max(Number(e.target.value) || PRICE_MAX, min))}
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
          type="range" min={0} max={PRICE_MAX} step={1000} value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max), max)}
          className={RANGE_THUMB_CLASSES}
        />
        <input
          type="range" min={0} max={PRICE_MAX} step={1000} value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min))}
          className={RANGE_THUMB_CLASSES}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        <span>R$0</span>
        <span>R$100.000</span>
      </div>
    </div>
  )
}

type ProductFilterModalProps = {
  open: boolean
  onClose: () => void
  onSave: (filters: ProductFilterState) => void
  initial?: ProductFilterState
}

export function ProductFilterModal({ open, onClose, onSave, initial }: ProductFilterModalProps) {
  const [state, setState] = useState<ProductFilterState>(initial ?? DEFAULT_PRODUCT_FILTER)

  useEffect(() => {
    if (open) setState(initial ?? DEFAULT_PRODUCT_FILTER)
  }, [open, initial])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex w-full max-w-[800px] flex-col rounded-lg bg-white shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-[#0F172A]" />
            <span className="font-semibold text-[#0F172A]">Filtros avançados</span>
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
        <div className="flex flex-col gap-5 px-6 py-5">

          {/* Search */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome ou código do produto
            </label>
            <input
              type="text"
              value={state.search}
              onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
              placeholder="Insira o nome ou código do produto"
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F172A]/20"
            />
          </div>

          {/* Category multi-select */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Categoria do produto</label>
            <CategorySelect
              selected={state.categories}
              onChange={(v) => setState((s) => ({ ...s, categories: v }))}
            />
          </div>

          {/* Price range */}
          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Faixa de preço</label>
            <PriceRange
              min={state.minPrice}
              max={state.maxPrice}
              onChange={(minPrice, maxPrice) => setState((s) => ({ ...s, minPrice, maxPrice }))}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" className="h-10 gap-2 rounded-full px-6" onClick={onClose} type="button">
            <X className="size-4" /> Cancelar
          </Button>
          <Button
            className="h-10 gap-2 rounded-full bg-[#1E293B] px-6 hover:bg-[#1E293B]/90 text-white"
            onClick={() => { onSave(state); onClose() }}
            type="button"
          >
            <Check className="size-4" /> Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  )
}
