import type { ReactNode } from "react"
import {
    EmptyTableState,
    TableBody,
    TableHead,
    TableHeader,
    TablePagination,
    TableRow
} from "./Table"

export type SortDirection = "asc" | "desc" | null
export type SortConfig<T> = { key: keyof T; direction: SortDirection } | null

export type Columns<T> = {
    label: string | ReactNode
    className?: string
    sortable?: boolean
    accessorKey?: keyof T
}

interface DataTableProps<T> {
    columns: Columns<T>[]
    data: T[]
    renderRow: (item: T, index: number) => ReactNode
    emptyMessage?: string
    currentPage: number
    filteredCount: number
    onPageChange: (page: number) => void
    pageCount: number
    totalCount: number
    onSort?: (key: keyof T) => void
    sortConfig?: SortConfig<T>
}

export function DataTable<T>({
    columns,
    data,
    renderRow,
    emptyMessage = "Nenhum registro encontrado.",
    currentPage,
    filteredCount,
    onPageChange,
    pageCount,
    totalCount,
    onSort,
    sortConfig,
  }: DataTableProps<T>) {
    return (
        <div className="overflow-x-auto">
        <table className="min-w-[900px] w-full table-fixed text-left">
          <TableHeader>
            <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
              {columns.map((col, index) => {
                const isActive = sortConfig?.key === col.accessorKey;
                return (
                  <TableHead 
                    key={index} 
                    className={col.className} 
                    sortable={col.sortable}
                    onClick={() => col.sortable && col.accessorKey && onSort?.(col.accessorKey)}
                    isActive={isActive}
                    direction={isActive ? sortConfig?.direction : null}
                  >
                    {col.label}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => renderRow(item, index))}
          </TableBody>
        </table>
        
        {data.length === 0 && <EmptyTableState message={emptyMessage} />}
        
        <TablePagination
          currentPage={currentPage}
          filteredCount={filteredCount}
          onPageChange={onPageChange}
          pageCount={pageCount}
          totalCount={totalCount}
        />
      </div>
    )
}