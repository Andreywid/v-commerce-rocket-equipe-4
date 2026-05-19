import { useMemo, useState } from "react"
import { ClipboardList, Pencil } from "lucide-react"

import type { SupportFormValues, SupportRow, SupportType } from "@/types"
import { useAppContext } from "@/context/AppContext"
import { getSupportMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { RatingBadge, StatusBadge } from "@/components/shared/StatusBadge"
import { SupportFormModal } from "@/components/shared/SupportFormModal"
import { SupportFilterModal, emptySupportFilters, type SupportFilters } from "@/components/shared/SupportFilterModal"
import { TicketDetailModal } from "@/components/shared/TicketDetailModal"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

const supportTypeClasses: Record<SupportType, string> = {
  Pagamento: "bg-indigo-50 text-indigo-500 border-indigo-200",
  Atraso:    "bg-amber-50 text-amber-500 border-amber-200",
  Reembolso: "bg-rose-50 text-rose-500 border-rose-200",
}


type FilteredTicket = { ticket: SupportRow; index: number }

function SupportTable({
  currentPage,
  filteredCount,
  onEditTicket,
  onPageChange,
  onViewTicket,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditTicket: (index: number) => void
  onPageChange: (page: number) => void
  onViewTicket: (index: number) => void
  pageCount: number
  rows: FilteredTicket[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-225 w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead sortable className="w-42.5 pl-5">Ticket</TableHead>
            <TableHead className="w-40">Cliente</TableHead>
            <TableHead className="w-32.5">Tipo</TableHead>
            <TableHead sortable className="w-42.5">Data de criação</TableHead>
            <TableHead className="w-37.5">Data de resolução</TableHead>
            <TableHead sortable className="w-35">Avaliação</TableHead>
            <TableHead className="w-22.5" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ ticket: row, index }) => (
            <TableRow
              key={`${row.ticket}-${index}`}
              className="h-14.5 border-slate-100 text-sm text-slate-700"
            >
              <TableCell className="pl-5">
                <button
                  className="font-semibold text-slate-800 transition hover:text-indigo-600"
                  onClick={() => onViewTicket(index)}
                  type="button"
                >
                  {row.ticket}
                </button>
              </TableCell>
              <TableCell>{row.customer}</TableCell>
              <TableCell>
                <StatusBadge className={supportTypeClasses[row.type]}>{row.type}</StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{row.createdAt}</TableCell>
              <TableCell>{row.resolvedIn}</TableCell>
              <TableCell>
                <RatingBadge rating={row.rating} label={row.ratingLabel} />
              </TableCell>
              <TableCell>
                <button
                  className="grid place-items-center rounded-md p-1 transition hover:bg-indigo-50"
                  onClick={() => onEditTicket(index)}
                  type="button"
                >
                  <Pencil className="size-4 text-[#4F46E5]" />
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

function useFilteredTickets(search: string, filters: SupportFilters) {
  const { tickets } = useAppContext()
  return useMemo(
    () =>
      tickets
        .map((ticket, index) => ({ ticket, index }))
        .filter(({ ticket }) => {
          const matchesSearch = rowIncludes(ticket, search)
          const matchesDate = !filters.date || ticket.createdAt.includes(filters.date)
          const matchesType = filters.types.length === 0 || filters.types.includes(ticket.type)
          const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(ticket.status)
          const matchesRating = filters.ratings.length === 0 || filters.ratings.includes(ticket.ratingLabel)
          return matchesSearch && matchesDate && matchesType && matchesStatus && matchesRating
        }),
    [tickets, search, filters],
  )
}

export function SupportPage() {
  const { tickets, addTicket, updateTicket, clients, showNotice } = useAppContext()
  const [ticketSearch, setTicketSearch] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<SupportFilters>(emptySupportFilters)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null)
  const [viewingTicketIndex, setViewingTicketIndex] = useState<number | null>(null)

  const filteredTickets = useFilteredTickets(ticketSearch, advancedFilters)
  const metrics = getSupportMetrics(tickets)

  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const isAdvancedFilterActive = !!(
    advancedFilters.date ||
    advancedFilters.types.length > 0 ||
    advancedFilters.statuses.length > 0 ||
    advancedFilters.ratings.length > 0
  )

  function handleSearchChange(value: string) {
    setTicketSearch(value)
    setCurrentPage(1)
  }

  function handleApplyFilters(filters: SupportFilters) {
    setAdvancedFilters(filters)
    setCurrentPage(1)
  }

  function handleAddTicket(values: SupportFormValues) {
    addTicket(values)
    setIsTicketModalOpen(false)
    showNotice("Ticket adicionado")
  }

  function handleUpdateTicket(values: SupportFormValues) {
    if (editingTicketIndex === null) return
    updateTicket(editingTicketIndex, values)
    setEditingTicketIndex(null)
    showNotice("Ticket atualizado")
  }

  return (
    <PageShell title="Suporte">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar ticket"
          advancedFilterActive={isAdvancedFilterActive}
          icon={ClipboardList}
          label="Tickets de suporte"
          onAction={() => setIsTicketModalOpen(true)}
          onAdvancedFilter={() => setIsFilterModalOpen(true)}
          onSearchChange={handleSearchChange}
          placeholder="Busque por ticket, cliente, tipo ou avaliação"
          searchValue={ticketSearch}
        />
        <SupportTable
          currentPage={safePage}
          filteredCount={filteredTickets.length}
          onEditTicket={setEditingTicketIndex}
          onPageChange={setCurrentPage}
          onViewTicket={setViewingTicketIndex}
          pageCount={pageCount}
          rows={paginatedTickets}
          totalCount={tickets.length}
        />
      </DataPanel>

      {isFilterModalOpen && (
        <SupportFilterModal
          filters={advancedFilters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
      {isTicketModalOpen && (
        <SupportFormModal onClose={() => setIsTicketModalOpen(false)} onSubmit={handleAddTicket} title="Adicionar ticket" />
      )}
      {editingTicketIndex !== null && (
        <SupportFormModal
          initialValues={tickets[editingTicketIndex]}
          onClose={() => setEditingTicketIndex(null)}
          onSubmit={handleUpdateTicket}
          ticketId={tickets[editingTicketIndex].ticket}
          title="Editar ticket"
        />
      )}
      {viewingTicketIndex !== null && (
        <TicketDetailModal
          clients={clients}
          onClose={() => setViewingTicketIndex(null)}
          ticket={tickets[viewingTicketIndex]}
          tickets={tickets}
        />
      )}
    </PageShell>
  )
}
