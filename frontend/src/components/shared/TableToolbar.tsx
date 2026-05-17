import { useState } from "react"
import { Download, Plus, Search, SlidersHorizontal, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TableToolbar({
  actionLabel,
  filterLabel,
  filterOptions,
  filterValue,
  icon: Icon,
  label,
  onAction,
  onAdvancedFilter,
  advancedFilterActive,
  onExport,
  onFilterChange,
  onSearchChange,
  placeholder,
  searchValue,
}: {
  actionLabel?: string
  filterLabel?: string
  filterOptions?: string[]
  filterValue?: string
  icon: LucideIcon
  label: string
  onAction?: () => void
  onAdvancedFilter?: () => void
  advancedFilterActive?: boolean
  onExport?: () => void
  onFilterChange?: (value: string) => void
  onSearchChange: (value: string) => void
  placeholder: string
  searchValue: string
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <Icon className="size-4" />
          </span>
          <p className="text-sm font-semibold text-indigo-600">{label}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 rounded-full pl-10 pr-4 sm:w-[310px]"
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={placeholder}
              type="search"
              value={searchValue}
            />
          </div>

          <Button
            variant="outline"
            className={[
              "h-9 rounded-full px-4",
              (onAdvancedFilter ? advancedFilterActive : filterValue !== "Todos")
                ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
                : "",
            ].join(" ")}
            onClick={() => {
              if (onAdvancedFilter) {
                onAdvancedFilter()
                return
              }
              setIsFilterOpen((c) => !c)
            }}
            type="button"
          >
            <SlidersHorizontal className="size-4" />
            Filtro
          </Button>

          {onExport && (
            <Button
              variant="outline"
              className="h-10 min-h-10 gap-2 rounded-full px-5 border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={onExport}
              type="button"
            >
              <Download className="size-4" />
              Exportar lista (.csv)
            </Button>
          )}

          {actionLabel && onAction && (
            <Button
              className="h-10 min-h-10 w-[217px] gap-2 rounded-full px-6 bg-[#0F172A] hover:bg-[#0F172A]/90 text-white"
              onClick={onAction}
              type="button"
            >
              <Plus className="size-4" />
              {actionLabel}
            </Button>
          )}
        </div>
      </div>

      {!onAdvancedFilter && isFilterOpen && filterLabel && filterOptions && filterValue && onFilterChange && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="text-xs font-semibold text-slate-500" htmlFor={`${label}-filter`}>
            {filterLabel}
          </label>
          <Select value={filterValue} onValueChange={(v) => onFilterChange(v ?? filterValue)}>
            <SelectTrigger className="h-9" id={`${label}-filter`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterValue !== "Todos" && (
            <Button
              variant="ghost"
              className="h-9 px-3 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
              onClick={() => onFilterChange("Todos")}
              type="button"
            >
              Limpar
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
