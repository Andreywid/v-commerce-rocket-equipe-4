import { useMemo, useState } from "react"
import { Pencil, Users } from "lucide-react"

import type { ClientFormValues, ClientRow, ClientStatus } from "@/types"
import { clientStatusOptions } from "@/mocks/clients"
import { useAppContext } from "@/context/AppContext"
import { getClientsMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { ClientAdvancedFilterDialog, emptyClientAdvancedFilters } from "@/components/shared/ClientAdvancedFilterDialog"
import type { ClientAdvancedFilters } from "@/components/shared/ClientAdvancedFilterDialog"
import { ClientFormModal } from "@/components/shared/ClientFormModal"
import { ClientProfileDialog } from "@/components/shared/ClientProfileDialog"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

const statusClasses: Record<ClientStatus, string> = {
  Novo:       "bg-indigo-50 text-indigo-500 border-indigo-200",
  Recorrente: "bg-emerald-50 text-emerald-500 border-emerald-200",
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function parseCurrency(value: string) {
  return Number(value.replace(/[^\d,]/g, "").replace(",", ".")) || 0
}

type FilteredClient = { client: ClientRow; index: number }

function ClientsTable({
  currentPage,
  filteredCount,
  onEditClient,
  onPageChange,
  onViewProfile,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditClient: (index: number) => void
  onPageChange: (page: number) => void
  onViewProfile: (index: number) => void
  pageCount: number
  rows: FilteredClient[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead sortable className="w-[220px] pl-5">Nome</TableHead>
            <TableHead className="w-[190px]">Localização</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead sortable className="w-[160px]">Último pedido</TableHead>
            <TableHead className="w-[130px]">Qt de Pedidos</TableHead>
            <TableHead sortable className="w-[140px]">Total</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ client: row, index }) => (
            <TableRow key={row.id} className="h-19 border-slate-200 text-sm text-slate-700">
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                    {getInitials(row.name)}
                  </span>
                  <button
                    className="text-left font-semibold text-slate-800 transition hover:text-indigo-600"
                    onClick={() => onViewProfile(index)}
                    type="button"
                  >
                    {row.name}
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-slate-400">{row.location}</TableCell>
              <TableCell>
                <StatusBadge className={statusClasses[row.status]}>{row.status}</StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{row.lastOrder}</TableCell>
              <TableCell>{row.orderCount}</TableCell>
              <TableCell className="font-medium">{row.total}</TableCell>
              <TableCell>
                <button
                  className="grid place-items-center rounded-md p-1 transition hover:bg-indigo-50"
                  onClick={() => onEditClient(index)}
                  type="button"
                >
                  <Pencil className="size-4 text-[#4F46E5]" />
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum cliente encontrado." />}
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

function useFilteredClients(search: string, filters: ClientAdvancedFilters) {
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
          const matchesName = !filters.name ||
            client.name.toLowerCase().includes(filters.name.toLowerCase()) ||
            client.id.toLowerCase().includes(filters.name.toLowerCase())
          const matchesLocation = filters.locations.length === 0 || filters.locations.includes(client.location)
          const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(client.status)
          const total = parseCurrency(client.total)
          const matchesTotal = total >= filters.minTotal && (filters.maxTotal >= 100_000 || total <= filters.maxTotal)
          return matchesSearch && matchesName && matchesLocation && matchesStatus && matchesTotal
        }),
    [clients, search, filters],
  )
}

export function ClientsPage() {
  const { clients, addClient, updateClient, removeClient, orders, tickets, showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<ClientAdvancedFilters>(emptyClientAdvancedFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [profileIndex, setProfileIndex] = useState<number | null>(null)

  const filteredClients = useFilteredClients(search, advancedFilters)
  const metrics = getClientsMetrics(clients)

  const pageCount = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedClients = filteredClients.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleFilterChange(value: string) {
    setAdvancedFilters((current) => ({
      ...current,
      statuses: value === "Todos" ? [] : [value as ClientStatus],
    }))
    setCurrentPage(1)
  }

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

  function handleDelete() {
    if (editingIndex === null) return
    removeClient(editingIndex)
    setEditingIndex(null)
    showNotice("Cliente removido")
  }

  return (
    <PageShell title="Clientes">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar cliente"
          filterLabel="Status"
          filterOptions={["Todos", ...clientStatusOptions]}
          filterValue={advancedFilters.statuses.length === 1 ? advancedFilters.statuses[0] : "Todos"}
          icon={Users}
          label="Lista de clientes"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setIsAdvancedFilterOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um cliente, localização ou status"
          searchValue={search}
        />
        <ClientsTable
          currentPage={safePage}
          filteredCount={filteredClients.length}
          onEditClient={setEditingIndex}
          onPageChange={setCurrentPage}
          onViewProfile={setProfileIndex}
          pageCount={pageCount}
          rows={paginatedClients}
          totalCount={clients.length}
        />
      </DataPanel>

      {isAddModalOpen && (
        <ClientFormModal onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} title="Adicionar cliente" />
      )}
      {isAdvancedFilterOpen && (
        <ClientAdvancedFilterDialog
          filters={advancedFilters}
          onApply={(filters) => {
            setAdvancedFilters(filters)
            setCurrentPage(1)
            setIsAdvancedFilterOpen(false)
          }}
          onClose={() => setIsAdvancedFilterOpen(false)}
        />
      )}
      {editingIndex !== null && (
        <ClientFormModal
          initialValues={clients[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onDelete={handleDelete}
          onSubmit={handleUpdate}
          title="Editar cliente"
        />
      )}
      {profileIndex !== null && (
        <ClientProfileDialog
          client={clients[profileIndex]}
          onClose={() => setProfileIndex(null)}
          orders={orders}
          tickets={tickets}
        />
      )}
    </PageShell>
  )
}
