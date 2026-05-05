import { ArrowUpDown } from "lucide-react"

export function TableHead({
  children,
  className = "",
  sortable = false,
}: {
  children?: React.ReactNode
  className?: string
  sortable?: boolean
}) {
  return (
    <th className={`font-semibold ${className}`}>
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && <ArrowUpDown className="size-3 text-slate-400" />}
      </span>
    </th>
  )
}

export function EmptyTableState({ message }: { message: string }) {
  return (
    <div className="min-w-[900px] border-t border-slate-100 px-5 py-8 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  )
}

export function TablePagination({ filteredCount, totalCount }: { filteredCount: number; totalCount: number }) {
  return (
    <div className="flex min-w-[900px] flex-col gap-3 px-5 py-4 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-5">
        <button className="font-medium transition hover:text-indigo-600" type="button">
          Anterior
        </button>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          1
        </button>
        <button className="grid size-8 place-items-center rounded-md border border-slate-200 bg-white font-medium shadow-sm" type="button">
          2
        </button>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          3
        </button>
        <span>...</span>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          10
        </button>
        <button className="font-medium transition hover:text-indigo-600" type="button">
          Próximo
        </button>
      </div>
      <p className="text-slate-600">
        Mostrando {filteredCount} de {totalCount} resultados
      </p>
    </div>
  )
}
