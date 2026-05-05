import { useState } from "react"
import { Plus, Search, SlidersHorizontal, type LucideIcon } from "lucide-react"

export function TableToolbar({
  actionLabel,
  filterLabel,
  filterOptions,
  filterValue,
  icon: Icon,
  label,
  onAction,
  onFilterChange,
  onSearchChange,
  placeholder,
  searchValue,
}: {
  actionLabel: string
  filterLabel: string
  filterOptions: string[]
  filterValue: string
  icon: LucideIcon
  label: string
  onAction: () => void
  onFilterChange: (value: string) => void
  onSearchChange: (value: string) => void
  placeholder: string
  searchValue: string
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-indigo-100 text-indigo-600">
            <Icon className="size-4" />
          </span>
          <p className="text-sm font-semibold text-indigo-600">{label}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="h-9 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 sm:w-[310px]"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={placeholder}
              type="search"
              value={searchValue}
            />
          </label>

          <button
            className={[
              "flex h-9 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
              filterValue === "Todos"
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "border-indigo-200 bg-indigo-50 text-indigo-600",
            ].join(" ")}
            onClick={() => setIsFilterOpen((current) => !current)}
            type="button"
          >
            <SlidersHorizontal className="size-4" />
            Filtro
          </button>

          <button
            className="flex h-9 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={onAction}
            type="button"
          >
            <Plus className="size-4" />
            {actionLabel}
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="text-xs font-semibold text-slate-500" htmlFor={`${label}-filter`}>
            {filterLabel}
          </label>
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            id={`${label}-filter`}
            onChange={(event) => onFilterChange(event.target.value)}
            value={filterValue}
          >
            {filterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {filterValue !== "Todos" && (
            <button
              className="h-9 rounded-md px-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
              onClick={() => onFilterChange("Todos")}
              type="button"
            >
              Limpar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
