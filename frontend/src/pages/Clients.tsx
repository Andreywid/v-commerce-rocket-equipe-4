import { useMemo, useState } from "react"
import { Users } from "lucide-react"

import type { ClientFormValues, ClientRow, ClientStatus, FilterValue } from "@/types"
import { clientStatusOptions } from "@/mocks/clients"
import { useAppContext } from "@/context/AppContext"
import { getClientsMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { ClientFormModal } from "@/components/shared/ClientFormModal"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const statusClasses: Record<ClientStatus, string> = {
  Novo: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Recorrente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type FilteredClient = { client: ClientRow; index: number }

function ClientsTable({
  onEditClient,
  rows,
  totalCount,
}: {
  onEditClient: (index: number) => void
  rows: FilteredClient[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] table-fixed text-left">
        <thead>
          <tr className="h-12 border-b border-slate-200 text-sm text-slate-950">
            <TableHead sortable className="w-[220px] pl-5">Nome</TableHead>
            <TableHead className="w-[190px]">Localização</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead sortable className="w-[160px]">Último pedido</TableHead>
            <TableHead className="w-[130px]">Qt de Pedidos</TableHead>
            <TableHead sortable className="w-[140px]">Total</TableHead>
            <TableHead className="w-[80px]" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ client: row, index }) => (
            <tr key={row.id} className="h-[58px] border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
              <td className="pl-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {getInitials(row.name)}
                  </span>
                  <span className="font-semibold text-slate-800">{row.name}</span>
                </div>
              </td>
              <td className="text-slate-400">{row.location}</td>
              <td>
                <StatusBadge className={statusClasses[row.status]}>{row.status}</StatusBadge>
              </td>
              <td className="font-medium">{row.lastOrder}</td>
              <td>{row.orderCount}</td>
              <td className="font-medium">{row.total}</td>
              <td>
                <button
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  onClick={() => onEditClient(index)}
                  type="button"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum cliente encontrado." />}
      <TablePagination filteredCount={rows.length} totalCount={totalCount} />
    </div>
  )
}

function useFilteredClients(search: string, statusFilter: FilterValue<ClientStatus>) {
  const { clients } = useAppContext()
  return useMemo(
    () =>
      clients
        .map((client, index) => ({ client, index }))
        .filter(({ client }) => {
          const matchesSearch = rowIncludes(
            { name: client.name, location: client.location, status: client.status, lastOrder: client.lastOrder, total: client.total },
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
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterValue<ClientStatus>>("Todos")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const filteredClients = useFilteredClients(search, statusFilter)
  const metrics = getClientsMetrics(clients)

  function handleAdd(values: ClientFormValues) {
    addClient(values)
    setIsAddModalOpen(false)
    showNotice("Cliente adicionado")
  }

  function handleUpdate(values: ClientFormValues) {
    if (editingIndex === null) return
    updateClient(editingIndex, values)
    setEditingIndex(null)
    showNotice("Cliente atualizado")
  }

  return (
    <PageShell title="Clientes">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar cliente"
          filterLabel="Status"
          filterOptions={["Todos", ...clientStatusOptions]}
          filterValue={statusFilter}
          icon={Users}
          label="Lista de clientes"
          onAction={() => setIsAddModalOpen(true)}
          onFilterChange={(value) => setStatusFilter(value as FilterValue<ClientStatus>)}
          onSearchChange={setSearch}
          placeholder="Busque por um cliente, localização ou status"
          searchValue={search}
        />
        <ClientsTable
          onEditClient={setEditingIndex}
          rows={filteredClients}
          totalCount={clients.length}
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
