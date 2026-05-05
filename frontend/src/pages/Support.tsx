import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import type { FilterValue, RatingLabel, SupportFormValues, SupportRow, SupportType } from "@/types"
import { supportTypeOptions } from "@/mocks/tickets"
import { useAppContext } from "@/context/AppContext"
import { getSupportMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { SupportFormModal } from "@/components/shared/SupportFormModal"
import { EmptyTableState, TableHead, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const supportTypeClasses: Record<SupportType, string> = {
  Pagamento: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Atraso: "bg-amber-50 text-amber-500 ring-amber-200",
  Reembolso: "bg-rose-50 text-rose-500 ring-rose-200",
}

const ratingClasses: Record<RatingLabel, string> = {
  Ótimo: "bg-amber-50 text-amber-500 ring-amber-200",
  Bom: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Excelente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Crítico: "bg-rose-50 text-rose-500 ring-rose-200",
}

type FilteredTicket = { ticket: SupportRow; index: number }

function SupportTable({
  onEditTicket,
  rows,
  totalCount,
}: {
  onEditTicket: (index: number) => void
  rows: FilteredTicket[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] table-fixed text-left">
        <thead>
          <tr className="h-12 border-b border-slate-200 text-sm text-slate-950">
            <TableHead sortable className="w-[170px] pl-5">Ticket</TableHead>
            <TableHead className="w-[160px]">Cliente</TableHead>
            <TableHead className="w-[130px]">Tipo</TableHead>
            <TableHead sortable className="w-[170px]">Data de criação</TableHead>
            <TableHead className="w-[150px]">Data de resolução</TableHead>
            <TableHead sortable className="w-[140px]">Avaliação</TableHead>
            <TableHead className="w-[90px]" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ ticket: row, index }) => (
            <tr
              key={`${row.ticket}-${index}`}
              className="h-[58px] border-b border-slate-100 text-sm text-slate-700 last:border-b-0"
            >
              <td className="pl-5 font-semibold text-slate-800">{row.ticket}</td>
              <td>{row.customer}</td>
              <td>
                <StatusBadge className={supportTypeClasses[row.type]}>{row.type}</StatusBadge>
              </td>
              <td className="font-medium">{row.createdAt}</td>
              <td>{row.resolvedIn}</td>
              <td>
                <StatusBadge className={ratingClasses[row.ratingLabel]}>
                  {row.rating} {row.ratingLabel}
                </StatusBadge>
              </td>
              <td>
                <button
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  onClick={() => onEditTicket(index)}
                  type="button"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum ticket encontrado." />}
      <TablePagination filteredCount={rows.length} totalCount={totalCount} />
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
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null)

  const filteredTickets = useFilteredTickets(ticketSearch, ticketTypeFilter)
  const metrics = getSupportMetrics(tickets)

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
          onFilterChange={(value) => setTicketTypeFilter(value as FilterValue<SupportType>)}
          onSearchChange={setTicketSearch}
          placeholder="Busque por ticket, cliente, tipo ou avaliação"
          searchValue={ticketSearch}
        />
        <SupportTable
          onEditTicket={setEditingTicketIndex}
          rows={filteredTickets}
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
