/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from "react"
import { SlidersHorizontal, X, Check, ChevronDown } from "lucide-react"

import type { ProductCategory, RatingLabel } from "@/types"
import { productCategoryOptions, ratingLabelOptions } from "@/mocks/products"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ProductFilterState = {
  search: string
  categories: ProductCategory[]
  ratings: RatingLabel[]
  minPrice: number
  maxPrice: number
}

export const DEFAULT_PRODUCT_FILTER: ProductFilterState = {
  search: "",
  categories: [],
  ratings: [],
  minPrice: 0,
  maxPrice: 100_000,
}

const PRICE_MAX = 100_000

const CATEGORY_TAG_CLASS: Record<ProductCategory, string> = {
  Perfumaria: "bg-indigo-50 text-indigo-600 border-indigo-200",
  Artes: "bg-sky-50 text-sky-600 border-sky-200",
  Esporte: "bg-emerald-50 text-emerald-600 border-emerald-200",
  Lazer: "bg-amber-50 text-amber-600 border-amber-200",
  Bebês: "bg-pink-50 text-pink-600 border-pink-200",
  "Utilidades domésticas": "bg-orange-50 text-orange-600 border-orange-200",
  "Instrumentos Musicais": "bg-slate-100 text-slate-500 border-slate-300",
  Tecnologia: "bg-cyan-50 text-cyan-600 border-cyan-200",
}

const RATING_TAG_CLASS: Record<RatingLabel, string> = {
  Ótimo: "bg-amber-50 text-amber-500 border-amber-200",
  Bom: "bg-indigo-200 text-indigo-700 border-indigo-300",
  Excelente: "bg-emerald-50 text-emerald-500 border-emerald-200",
  Crítico: "bg-rose-50 text-rose-500 border-rose-200",
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
  "[&::-webkit-slider-thumb]:border-indigo-500",
  "[&::-webkit-slider-thumb]:cursor-pointer",
  "[&::-webkit-slider-thumb]:shadow-sm",
  "[&::-moz-range-thumb]:size-4",
  "[&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:bg-white",
  "[&::-moz-range-thumb]:border-2",
  "[&::-moz-range-thumb]:border-indigo-500",
  "[&::-moz-range-thumb]:cursor-pointer",
].join(" ")

type MultiSelectProps = {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (value: string[]) => void
  placeholder: string
  getTagClass: (option: string) => string
}

function MultiSelect({ label, options, selected, onChange, placeholder, getTagClass }: MultiSelectProps) {
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
              className={cn("flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs", getTagClass(s))}
            >
              {s}
              <button
                type="button"
                onClick={() => onChange(selected.filter((item) => item !== s))}
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
          <span className="shrink-0 text-sm text-slate-400">R$</span>
          <input
            type="number"
            min={0}
            max={max}
            value={min === 0 ? "" : min}
            placeholder="Min"
            onChange={(e) => onChange(Math.min(Number(e.target.value) || 0, max - 1000), max)}
            className="w-full text-sm text-slate-700 outline-none"
          />
        </label>
        <label className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 px-3 py-2.5">
          <span className="shrink-0 text-sm text-slate-400">R$</span>
          <input
            type="number"
            min={min}
            max={PRICE_MAX}
            value={max === PRICE_MAX ? "" : max}
            placeholder="Max"
            onChange={(e) => onChange(min, Math.max(Number(e.target.value) || PRICE_MAX, min + 1000))}
            className="w-full text-sm text-slate-700 outline-none"
          />
        </label>
      </div>
      <div className="relative h-1.5 rounded-full bg-slate-200">
        <div
          className="absolute h-1.5 rounded-full bg-indigo-500"
          style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={1000}
          value={min}
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - 1000), max)}
          className={RANGE_THUMB_CLASSES}
        />
        <input
          type="range"
          min={0}
          max={PRICE_MAX}
          step={1000}
          value={max}
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + 1000))}
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
              Nome ou código do produto
            </label>
            <input
              type="text"
              value={state.search}
              onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
              placeholder="Insira o nome ou código do produto"
              className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <MultiSelect
              label="Categoria"
              options={productCategoryOptions}
              selected={state.categories}
              onChange={(v) => setState((s) => ({ ...s, categories: v as ProductCategory[] }))}
              placeholder="Selecione a categoria"
              getTagClass={(cat) => CATEGORY_TAG_CLASS[cat as ProductCategory]}
            />
            <MultiSelect
              label="Avaliação"
              options={ratingLabelOptions}
              selected={state.ratings}
              onChange={(v) => setState((s) => ({ ...s, ratings: v as RatingLabel[] }))}
              placeholder="Selecione a avaliação"
              getTagClass={(r) => RATING_TAG_CLASS[r as RatingLabel]}
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">Faixa de preço</label>
            <PriceRange
              min={state.minPrice}
              max={state.maxPrice}
              onChange={(minPrice, maxPrice) => setState((s) => ({ ...s, minPrice, maxPrice }))}
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
