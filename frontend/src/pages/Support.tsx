import { useState } from "react"
import { ClipboardList, Pencil } from "lucide-react"

import type { SupportType } from "@/types"
import type { TicketOut } from "@/types/api"
import { supportStatusClasses, supportTypeClasses } from "@/constants/badgeStyles"
import { useAppContext } from "@/context/AppContext"
import { useSupport } from "@/hooks/useSupport"
import { useDebounce } from "@/hooks/useDebounce"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { SupportFilterModal, emptySupportFilters, type SupportFilters } from "@/components/shared/SupportFilterModal"
import { TicketDetailModal } from "@/components/shared/TicketDetailModal"
import { TicketFormModal } from "@/components/shared/TicketFormModal"
import { RatingBadge } from "@/components/shared/RatingBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { Heart, Smile, Users } from "lucide-react"
import type { Metric } from "@/types"

const PAGE_SIZE = 6

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function SupportTable({
  currentPage,
  filteredCount,
  onEditTicket,
  onPageChange,
  onSort,
  onViewTicket,
  pageCount,
  rows,
  sortBy,
  sortOrder,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditTicket: (ticket: TicketOut) => void
  onPageChange: (page: number) => void
  onSort: (key: string) => void
  onViewTicket: (ticket: TicketOut) => void
  pageCount: number
  rows: TicketOut[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-240 w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-32 pl-5">Prazo</TableHead>
            <TableHead sortKey="id_ticket" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-38">Ticket</TableHead>
            <TableHead className="w-38">Cliente</TableHead>
            <TableHead className="w-28">Tipo</TableHead>
            <TableHead sortKey="data_abertura" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-28">Data</TableHead>
            <TableHead sortKey="status_ticket" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-28">Status</TableHead>
            <TableHead className="w-38">Sentimento</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id_ticket} className="h-14.5 border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-5">
                <StatusBadge className={row.sla_estourado ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-indigo-50 text-indigo-600 border-indigo-200"}>
                  {row.sla_estourado ? "Fora do prazo" : "No prazo"}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <button
                  className="block w-full truncate text-left font-semibold text-slate-800 transition hover:text-indigo-600"
                  onClick={() => onViewTicket(row)}
                  title={`#${row.id_ticket}`}
                  type="button"
                >
                  #{row.id_ticket.slice(0, 8)}...
                </button>
              </TableCell>
              <TableCell className="max-w-0"><span className="block truncate">{row.nome_cliente}</span></TableCell>
              <TableCell>
                <StatusBadge className={supportTypeClasses[row.tipo_problema as SupportType]}>
                  {row.tipo_problema}
                </StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{formatDate(row.data_abertura)}</TableCell>
              <TableCell>
                <StatusBadge className={supportStatusClasses[row.status_ticket]}>
                  {row.status_ticket}
                </StatusBadge>
              </TableCell>
              <TableCell>
                {row.nota_avaliacao != null ? <RatingBadge nota={row.nota_avaliacao} /> : <span className="text-slate-400">—</span>}
              </TableCell>
              <TableCell>
                <button
                  className="grid place-items-center rounded-md p-1 transition hover:bg-slate-100"
                  onClick={() => onEditTicket(row)}
                  type="button"
                >
                  <Pencil className="size-4 text-[#6366F1]" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum ticket encontrado." />}
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

export function SupportPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<SupportFilters>(emptySupportFilters)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [viewingTicket, setViewingTicket] = useState<TicketOut | null>(null)
  const [editingTicket, setEditingTicket] = useState<TicketOut | null>(null)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const debouncedSearch = useDebounce(search, 400)
  const { data, isPending } = useSupport(
    {
      tipos: advancedFilters.types.length > 0 ? advancedFilters.types : undefined,
      statuses: advancedFilters.statuses.length > 0 ? advancedFilters.statuses : undefined,
      satisfacoes: advancedFilters.satisfacoes.length > 0 ? advancedFilters.satisfacoes : undefined,
      data_abertura: advancedFilters.date || undefined,
      nome: debouncedSearch || undefined,
      sort_by: sortBy,
      order: sortBy ? sortOrder : undefined,
    },
    currentPage,
    PAGE_SIZE,
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filteredItems = items

  const resolvidos = items.filter((t) => t.status_ticket === "Resolvido").length
  const abertos = items.filter((t) => t.status_ticket === "Aberto").length

  const metrics: Metric[] = [
    { label: "Tickets resolvidos", value: String(resolvidos),   helper: "Nesta página",       tone: "emerald", icon: Users },
    { label: "Total de tickets",   value: total.toLocaleString("pt-BR"), helper: "Resultado dos filtros", tone: "emerald", icon: Smile },
    { label: "Tickets em aberto",  value: String(abertos),      helper: "Nesta página",       tone: "rose",    icon: Users },
    { label: "Total (página)",     value: String(items.length), helper: "Tickets exibidos",   tone: "violet",  icon: Heart },
  ]

  const isAdvancedFilterActive = !!(
    advancedFilters.date ||
    advancedFilters.types.length > 0 ||
    advancedFilters.statuses.length > 0 ||
    advancedFilters.satisfacoes.length > 0
  )

  function handleSort(key: string) {
    if (sortBy === key) {
      if (sortOrder === "asc") { setSortOrder("desc") }
      else { setSortBy(undefined) }
    } else {
      setSortBy(key)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleApplyFilters(filters: SupportFilters) {
    setAdvancedFilters(filters)
    setCurrentPage(1)
    if (filters.types.length > 0 || filters.statuses.length > 0 || filters.satisfacoes.length > 0) showNotice("Filtros aplicados")
  }

  return (
    <PageShell title="Suporte">
      <MetricGrid metrics={metrics} />

      <DataPanel className="h-[556px] overflow-hidden">
        <TableToolbar
          actionLabel="Registrar novo ticket"
          advancedFilterActive={isAdvancedFilterActive}
          icon={ClipboardList}
          label="Tickets de suporte"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setIsFilterModalOpen(true)}
          onSearchChange={handleSearchChange}
          placeholder="Busque por ticket, cliente ou tipo"
          searchValue={search}
        />
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <SupportTable
            currentPage={currentPage}
            filteredCount={total}
            onEditTicket={setEditingTicket}
            onPageChange={setCurrentPage}
            onSort={handleSort}
            onViewTicket={setViewingTicket}
            pageCount={pageCount}
            rows={filteredItems}
            sortBy={sortBy}
            sortOrder={sortOrder}
            totalCount={total}
          />
        )}
      </DataPanel>

      {isFilterModalOpen && (
        <SupportFilterModal
          filters={advancedFilters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
        />
      )}
      {isAddModalOpen && (
        <TicketFormModal
          mode="add"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={() => { setIsAddModalOpen(false); showNotice("Ticket registrado") }}
        />
      )}
      {editingTicket && (
        <TicketFormModal
          mode="edit"
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onDelete={() => { setEditingTicket(null); showNotice("Ticket excluído") }}
          onSubmit={() => { setEditingTicket(null); showNotice("Ticket atualizado") }}
        />
      )}
    </PageShell>
  )
}
