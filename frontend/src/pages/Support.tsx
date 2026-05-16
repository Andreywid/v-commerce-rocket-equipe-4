import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import type { FilterValue, SupportFormValues, SupportRow, SupportType } from "@/types"
import { supportTypeOptions } from "@/mocks/tickets"
import { useAppContext } from "@/context/AppContext"
import { getSupportMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { RatingBadge, StatusBadge } from "@/components/shared/StatusBadge"
import { SupportFormModal } from "@/components/shared/SupportFormModal"
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
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditTicket: (index: number) => void
  onPageChange: (page: number) => void
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
              <TableCell className="pl-5 font-semibold text-slate-800">{row.ticket}</TableCell>
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
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  onClick={() => onEditTicket(index)}
                  type="button"
                >
                  Editar
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

function useFilteredTickets(search: string, typeFilter: FilterValue<SupportType>) {
  const { tickets } = useAppContext()
  return useMemo(
    () =>
      tickets
        .map((ticket, index) => ({ ticket, index }))
        .filter(({ ticket }) => {
          const matchesSearch = rowIncludes(ticket, search)
          const matchesType = typeFilter === "Todos" || ticket.type === typeFilter
          return matchesSearch && matchesType
        }),
    [tickets, search, typeFilter],
  )
}

export function SupportPage() {
  const { tickets, addTicket, updateTicket, showNotice } = useAppContext()
  const [ticketSearch, setTicketSearch] = useState("")
  const [ticketTypeFilter, setTicketTypeFilter] = useState<FilterValue<SupportType>>("Todos")
  const [currentPage, setCurrentPage] = useState(1)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null)

  const filteredTickets = useFilteredTickets(ticketSearch, ticketTypeFilter)
  const metrics = getSupportMetrics(tickets)

  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedTickets = filteredTickets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setTicketSearch(value)
    setCurrentPage(1)
  }

  function handleFilterChange(value: string) {
    setTicketTypeFilter(value as FilterValue<SupportType>)
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
          filterLabel="Tipo"
          filterOptions={["Todos", ...supportTypeOptions]}
          filterValue={ticketTypeFilter}
          icon={ClipboardList}
          label="Tickets de suporte"
          onAction={() => setIsTicketModalOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          placeholder="Busque por ticket, cliente, tipo ou avaliação"
          searchValue={ticketSearch}
        />
        <SupportTable
          currentPage={safePage}
          filteredCount={filteredTickets.length}
          onEditTicket={setEditingTicketIndex}
          onPageChange={setCurrentPage}
          pageCount={pageCount}
          rows={paginatedTickets}
          totalCount={tickets.length}
        />
      </DataPanel>

      {isTicketModalOpen && (
        <SupportFormModal onClose={() => setIsTicketModalOpen(false)} onSubmit={handleAddTicket} title="Adicionar ticket" />
      )}
      {editingTicketIndex !== null && (
        <SupportFormModal
          initialValues={tickets[editingTicketIndex]}
          onClose={() => setEditingTicketIndex(null)}
          onSubmit={handleUpdateTicket}
          title="Editar ticket"
        />
      )}
    </PageShell>
  )
}
