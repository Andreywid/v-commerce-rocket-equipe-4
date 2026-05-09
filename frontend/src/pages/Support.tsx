import { useMemo, useState } from "react"
import { ClipboardList, Eye, Pencil } from "lucide-react"

import type { FilterValue, SupportFormValues, SupportRow, SupportType } from "@/types"
import { supportTypeOptions } from "@/mocks/tickets"
import { useAppContext } from "@/context/AppContext"
import { getSupportMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { Button } from "@/components/ui/button"
import { DataPanel } from "@/components/shared/DataPanel"
import { DataCard, DataGrid } from "@/components/shared/MetricCards" 
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { SupportFormModal } from "@/components/shared/SupportFormModal"
import { TableRow, TableCell } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { DataTable, type Columns } from "@/components/shared/DataTable"
import { useTableSort } from "@/hooks/useTableSort"
import { useTableFilters } from "@/hooks/useTableFilter"
import { RatingBadge } from "@/components/shared/RatingBadge"
import { DeadlineBadge } from "@/components/shared/DeadlineBadge"

const PAGE_SIZE = 5

const supportTypeClasses: Record<SupportType, string> = {
  Pagamento: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Atraso: "bg-amber-50 text-amber-500 ring-amber-200",
  Reembolso: "bg-rose-50 text-rose-500 ring-rose-200",
}

function useFilteredTickets(search: string, typeFilter: FilterValue<SupportType>) {
  const { tickets } = useAppContext()
  return useMemo(
    () =>
      tickets.filter((ticket) => {
        const formattedDate = new Intl.DateTimeFormat("pt-BR").format(new Date(ticket.createdAt))
        
        const matchesSearch = rowIncludes(
          { 
            ticket: ticket.ticket, 
            customer: ticket.customer, 
            type: ticket.type, 
            date: formattedDate,
            rating: ticket.rating.toString(),
            timeline: ticket.timeline 
          },
          search,
        )
        const matchesType = typeFilter === "Todos" || ticket.type === typeFilter
        return matchesSearch && matchesType
      }),
    [tickets, search, typeFilter],
  )
}

export function SupportPage() {
  const { tickets, addTicket, updateTicket, showNotice } = useAppContext()
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [editingTicketIndex, setEditingTicketIndex] = useState<number | null>(null)

  const {
    search,
    filterValue,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    handleFilterChange,
  } = useTableFilters<SupportType>()

  const filteredTickets = useFilteredTickets(search, filterValue)
  const metrics = getSupportMetrics(tickets)

  const { sortedData, sortConfig, handleSort } = useTableSort(
    filteredTickets,
    (item, key) => item[key as keyof SupportRow]
  )

  const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedTickets = sortedData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Columns<SupportRow>[] = [
    { label: "Prazo", className: "w-[140px] pl-10", sortable: true, accessorKey: "timeline" },
    { label: "Ticket", className: "w-[150px]", sortable: true, accessorKey: "ticket" },
    { label: "Cliente", className: "w-[200px]", sortable: true, accessorKey: "customer" },
    { label: "Tipo", className: "w-[130px] text-center pr-25" },
    { label: "Data de criação", className: "w-[180px] text-center", sortable: true, accessorKey: "createdAt" },
    { label: "Avaliação", className: "w-[160px] text-center pr-10", sortable: true, accessorKey: "rating" },
    { label: "Ações", className: "w-[90px] pl-5" },
  ]

  function handleAddTicket(values: SupportFormValues) {
    addTicket(values)
    setIsTicketModalOpen(false)
    showNotice("Ticket adicionado com sucesso!")
  }

  function handleUpdateTicket(values: SupportFormValues) {
    if (editingTicketIndex === null) return
    updateTicket(editingTicketIndex, values)
    setEditingTicketIndex(null)
    showNotice("Ticket atualizado com sucesso!")
  }

  return (
    <PageShell title="Suporte">
      <DataGrid>
        {metrics.map((m) => (
          <DataCard
            key={m.label}
            label={m.label}
            value={m.value}
            helper={m.helper}
            tone={m.tone}
            icon={m.icon}
          />
        ))}
      </DataGrid>
      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar ticket"
          filterLabel="Tipo"
          filterOptions={["Todos", ...supportTypeOptions]}
          filterValue={filterValue}
          icon={ClipboardList}
          label="Tickets de suporte"
          onAction={() => setIsTicketModalOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          placeholder="Busque por ticket, cliente, tipo ou avaliação"
          searchValue={search}
        />
        <DataTable
          columns={columns}
          data={paginatedTickets}
          emptyMessage="Nenhum ticket encontrado."
          currentPage={safePage}
          onPageChange={setCurrentPage}
          filteredCount={filteredTickets.length}
          pageCount={pageCount}
          totalCount={tickets.length}
          onSort={handleSort}
          sortConfig={sortConfig}
          renderRow={(row) => (
            <TableRow key={row.ticket} className="h-[58px] border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-10">
                <DeadlineBadge status={row.timeline} />
              </TableCell>
              <TableCell className="font-semibold text-slate-800">{row.ticket}</TableCell>
              <TableCell>{row.customer}</TableCell>
              <TableCell className="text-center pr-25">
                <StatusBadge className={supportTypeClasses[row.type]}>{row.type}</StatusBadge>
              </TableCell>
              <TableCell className="text-center font-medium">
                {new Intl.DateTimeFormat("pt-BR").format(new Date(row.createdAt))}
              </TableCell>
              <TableCell className="text-center pr-10">
                <RatingBadge rating={row.rating} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => {}}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={() => setEditingTicketIndex(tickets.findIndex(t => t.ticket === row.ticket))}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
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