import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead as ShadcnTableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TableHead({
  children,
  className = "",
  sortKey,
  currentSortKey,
  currentSortOrder,
  onSort,
}: {
  children?: React.ReactNode
  className?: string
  sortKey?: string
  currentSortKey?: string
  currentSortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
}) {
  const isSorted = sortKey !== undefined && sortKey === currentSortKey

  return (
    <ShadcnTableHead
      className={`font-semibold ${className}`}
      onClick={sortKey ? () => onSort?.(sortKey) : undefined}
    >
      <span className={cn("inline-flex items-center gap-1", sortKey && "cursor-pointer select-none")}>
        {children}
        {sortKey && (
          isSorted ? (
            currentSortOrder === "asc"
              ? <ArrowUp className="size-3 text-indigo-500" />
              : <ArrowDown className="size-3 text-indigo-500" />
          ) : (
            <ArrowUpDown className="size-3 text-slate-400" />
          )
        )}
      </span>
    </ShadcnTableHead>
  )
}

export function EmptyTableState({ message }: { message: string }) {
  return (
    <div className="min-w-[900px] border-t border-slate-100 px-5 py-8 text-center text-sm font-medium text-slate-500">
      {message}
    </div>
  )
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "…")[] = [1]
  if (current > 3) pages.push("…")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("…")
  pages.push(total)
  return pages
}

const PAGE_SIZE_OPTIONS = [6, 10, 20, 50]

export function TablePagination({
  currentPage,
  filteredCount,
  onPageChange,
  onPageSizeChange,
  pageCount,
  pageSize,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  pageCount: number
  pageSize: number
  totalCount: number
}) {
  const pages = getPageNumbers(currentPage, pageCount)
  return (
    <div className="flex min-w-[900px] items-center justify-between px-5 py-4 text-sm text-slate-700">
      <div className="flex items-center gap-2 text-slate-500">
        <span>Linhas por página</span>
        <select
          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          value={pageSize}
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="font-medium transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          Anterior
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`ellipsis-${i}`} className="select-none text-slate-400">…</span>
          ) : (
            <button
              key={p}
              className={cn(
                "min-w-[2rem] font-medium transition",
                p === currentPage
                  ? "grid size-8 place-items-center rounded-md border border-slate-200 bg-white shadow-sm"
                  : "hover:text-indigo-600",
              )}
              onClick={() => onPageChange(p as number)}
              type="button"
            >
              {p}
            </button>
          ),
        )}
        <button
          className="font-medium transition hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={currentPage >= pageCount || pageCount === 0}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          Próximo
        </button>
      </div>

      <p className="text-slate-600">
        Mostrando {filteredCount} de {totalCount} resultados
      </p>
    </div>
  )
}

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHeader, TableRow }
