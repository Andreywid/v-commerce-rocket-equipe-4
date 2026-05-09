import { useMemo, useState } from "react"
import { Users, Eye, Pencil } from "lucide-react"

import type { ClientFormValues, ClientRow, ClientStatus, FilterValue } from "@/types"
import { clientStatusOptions } from "@/mocks/clients"
import { useAppContext } from "@/context/AppContext"
import { getClientsMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { ClientFormModal } from "@/components/shared/ClientFormModal"
import { DataPanel } from "@/components/shared/DataPanel"
import { DataCard, DataGrid } from "@/components/shared/MetricCards" 
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { TableRow, TableCell } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { DataTable, type Columns } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { useTableSort } from "@/hooks/useTableSort"
import { useTableFilters } from "@/hooks/useTableFilter"

const PAGE_SIZE = 5

const statusClasses: Record<ClientStatus, string> = {
  Novo: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Recorrente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function useFilteredClients(search: string, statusFilter: FilterValue<ClientStatus>) {
  const { clients } = useAppContext()
  return useMemo(
    () =>
      clients.filter((client) => {
        const formattedDate = new Intl.DateTimeFormat("pt-BR").format(new Date(client.lastOrder))
        const totalAsNumber = typeof client.total === 'string' ? parseFloat(client.total) : client.total
        const formattedTotal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAsNumber)
        const matchesSearch = rowIncludes(
          { 
            name: client.name, 
            location: client.location, 
            status: client.status, 
            lastOrder: formattedDate, 
            total: formattedTotal 
          },
          search,
        )
        const matchesStatus = statusFilter === "Todos" || client.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [clients, search, statusFilter],
  )
}

export function ClientsPage() {
  const { clients, addClient, updateClient, showNotice } = useAppContext()
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  
  const {
    search,
    filterValue,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    handleFilterChange,
  } = useTableFilters<ClientStatus>()

  const filteredClients = useFilteredClients(search, filterValue)
  const metrics = getClientsMetrics(clients)

  const { sortedData, sortConfig, handleSort } = useTableSort(
    filteredClients,
    (item, key) => item[key as keyof ClientRow]
  )

  const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedClients = sortedData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Columns<ClientRow>[] = [
    { label: "Nome", className: "w-[220px] pl-10", sortable: true, accessorKey: "name" },
    { label: "Localização", className: "w-[190px]" },
    { label: "Status", className: "w-[130px] text-center pr-15" },
    { label: "Último pedido", className: "w-[160px] text-center", sortable: true, accessorKey: "lastOrder" },
    { label: "Quantidade", className: "w-[130px] text-center" }, 
    { label: "Total", className: "w-[140px] text-right pr-20", sortable: true, accessorKey: "total" }, 
    { label: "Ações", className: "w-[90px] pl-5" },
  ]

  function handleAdd(values: ClientFormValues) {
    addClient(values)
    setIsAddModalOpen(false)
    showNotice("Cliente adicionado com sucesso!")
  }

  function handleUpdate(values: ClientFormValues) {
    if (editingIndex === null) return
    updateClient(editingIndex, values)
    setEditingIndex(null)
    showNotice("Cliente atualizado com sucesso!")
  }

  return (
    <PageShell title="Clientes">
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
          actionLabel="Adicionar cliente"
          filterLabel="Status"
          filterOptions={["Todos", ...clientStatusOptions]}
          filterValue={filterValue}
          icon={Users}
          label="Lista de clientes"
          onAction={() => setIsAddModalOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um cliente, localização ou status"
          searchValue={search}
        />
        <DataTable
          columns={columns}
          data={paginatedClients}
          emptyMessage="Nenhum cliente encontrado."
          currentPage={safePage}
          onPageChange={setCurrentPage}
          filteredCount={filteredClients.length}
          pageCount={pageCount}
          totalCount={clients.length}
          onSort={handleSort}
          sortConfig={sortConfig}
          renderRow={(client) => {
            const totalAsNumber = typeof client.total === 'string' ? parseFloat(client.total) : client.total;
            return(
              <TableRow key={client.id} className="h-[58px] border-slate-100 text-sm text-slate-700">
                <TableCell className="pl-10">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {getInitials(client.name)}
                    </span>
                    <span className="font-semibold text-slate-800">{client.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-slate-400">{client.location}</TableCell>
                <TableCell className="text-center pr-15">
                  <StatusBadge className={statusClasses[client.status]}>{client.status}</StatusBadge>
                </TableCell>
                <TableCell className="font-medium text-center">
                  {new Intl.DateTimeFormat("pt-BR").format(new Date(client.lastOrder))}
                </TableCell>
                <TableCell className="text-center">{client.orderCount}</TableCell>
                <TableCell className="font-medium text-right pr-20">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAsNumber)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setViewingIndex(clients.findIndex(p => p.id === client.id))}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditingIndex(clients.findIndex(p => p.id === client.id))}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          }}
        />
      </DataPanel>

      {isAddModalOpen && (
        <ClientFormModal onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} title="Adicionar cliente" />
      )}
      
      {editingIndex !== null && (
        <ClientFormModal
          initialValues={clients[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSubmit={handleUpdate}
          title="Editar cliente"
        />
      )}
      
    </PageShell>
  )
}