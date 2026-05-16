import { useMemo, useState } from "react"
import { Calendar, Filter, Mail, MapPin, Phone, Users, X } from "lucide-react"

import type { ClientFormValues, ClientRow, ClientStatus, FilterValue, OrderRow, SupportRow } from "@/types"
import { clientStatusOptions } from "@/mocks/clients"
import { useAppContext } from "@/context/AppContext"
import { getClientsMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ClientFormModal } from "@/components/shared/ClientFormModal"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

type ClientAdvancedFilters = {
  location: string
  status: FilterValue<ClientStatus>
  minTotal: string
  maxTotal: string
}

const emptyClientAdvancedFilters: ClientAdvancedFilters = {
  location: "",
  status: "Todos",
  minTotal: "",
  maxTotal: "",
}

const statusClasses: Record<ClientStatus, string> = {
  Novo: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Recorrente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
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
            <TableRow key={row.id} className="h-[58px] border-slate-100 text-sm text-slate-700">
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
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  onClick={() => onEditClient(index)}
                  type="button"
                >
                  Editar
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
          const matchesStatus = filters.status === "Todos" || client.status === filters.status
          const matchesLocation = !filters.location || client.location.toLowerCase().includes(filters.location.toLowerCase())
          const total = parseCurrency(client.total)
          const minTotal = Number(filters.minTotal) || 0
          const maxTotal = Number(filters.maxTotal) || Infinity
          return matchesSearch && matchesStatus && matchesLocation && total >= minTotal && total <= maxTotal
        }),
    [clients, search, filters],
  )
}

function ClientAdvancedFilterDialog({
  filters,
  onApply,
  onClose,
}: {
  filters: ClientAdvancedFilters
  onApply: (filters: ClientAdvancedFilters) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(filters)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-600">
            <Filter className="size-4" />
            Filtro avançado
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label>Localização</Label>
            <Input
              onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              placeholder="Ex: Rio de Janeiro, RJ"
              value={draft.location}
            />
          </div>

          <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) => setDraft({ ...draft, status: event.target.value as FilterValue<ClientStatus> })}
                value={draft.status}
              >
                {["Todos", ...clientStatusOptions].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Total mínimo</Label>
              <Input
                inputMode="numeric"
                onChange={(event) => setDraft({ ...draft, minTotal: event.target.value })}
                placeholder="R$ Min"
                value={draft.minTotal}
              />
            </div>
            <div className="grid gap-2">
              <Label>Total máximo</Label>
              <Input
                inputMode="numeric"
                onChange={(event) => setDraft({ ...draft, maxTotal: event.target.value })}
                placeholder="R$ Max"
                value={draft.maxTotal}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose} type="button">
              <X className="size-4" />
              Cancelar
            </Button>
            <Button onClick={() => onApply(draft)} type="button">
              Salvar alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ClientProfileDialog({
  client,
  clientIndex,
  onClose,
  orders,
  tickets,
}: {
  client: ClientRow
  clientIndex: number
  onClose: () => void
  orders: OrderRow[]
  tickets: SupportRow[]
}) {
  const [tab, setTab] = useState<"orders" | "tickets">("orders")
  const clientOrders = orders.slice(0, Math.max(2, Math.min(orders.length, client.orderCount || 2)))
  const clientTickets = tickets.slice(0, 2)
  const resolvedTickets = clientTickets.filter((ticket) => Number(ticket.rating) >= 4).length
  const openTickets = Math.max(0, clientTickets.length - resolvedTickets)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[82dvh] overflow-hidden sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-indigo-600">Perfil do cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-2.5">
            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                  {getInitials(client.name)}
                </span>
                <div>
                  <p className="text-base font-bold text-slate-900">{client.name}</p>
                  <p className="text-xs text-slate-500">{client.name.toLowerCase().replace(/\s+/g, ".")}@hotmail.com</p>
                </div>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2"><Phone className="size-4" /> +55 (88) 98888-8888</p>
                <p className="flex items-center gap-2"><MapPin className="size-4" /> {client.location}</p>
                <p className="flex items-center gap-2"><Calendar className="size-4" /> Último pedido {client.lastOrder}</p>
                <p className="flex items-center gap-2"><Mail className="size-4" /> Cliente #{clientIndex + 1}</p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Nível de satisfação</p>
                  <p className="mt-1 text-base font-bold text-slate-900">Alta</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Risco de evasão</p>
                  <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Seguro</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[87%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-right text-sm font-medium text-slate-600">87%</p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-sm text-slate-500">Tickets abertos</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-emerald-50 p-2.5 text-center text-emerald-700">
                  <p className="text-lg font-bold">{resolvedTickets}</p>
                  <p className="text-xs">resolvidos</p>
                </div>
                <div className="rounded-md bg-amber-50 p-2.5 text-center text-amber-700">
                  <p className="text-lg font-bold">{openTickets}</p>
                  <p className="text-xs">em aberto</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-sm text-slate-500">Total gasto</p>
              <p className="mt-2 text-base font-bold text-slate-900">{client.total.replace("32.309,95", "79.656,77")}</p>
            </section>
          </aside>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex justify-end gap-2 border-b border-slate-100 px-4 py-2.5">
              <Button size="sm" variant={tab === "orders" ? "default" : "ghost"} onClick={() => setTab("orders")} type="button">
                Pedidos ({clientOrders.length})
              </Button>
              <Button size="sm" variant={tab === "tickets" ? "default" : "ghost"} onClick={() => setTab("tickets")} type="button">
                Tickets ({clientTickets.length})
              </Button>
            </div>

            {tab === "orders" ? (
              <table className="w-full table-fixed text-left text-xs">
                <thead className="bg-slate-50 text-slate-900">
                  <tr className="h-10">
                    <th className="px-4 font-semibold">Pedido</th>
                    <th className="font-semibold">Data</th>
                    <th className="font-semibold">Status</th>
                    <th className="font-semibold">Itens</th>
                    <th className="font-semibold">Valor</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {clientOrders.map((order, index) => (
                    <tr className="h-10 border-t border-slate-100" key={`${order.id}-${index}`}>
                      <td className="px-4 font-medium text-slate-600">{order.id.replace("PROD", "PED")}</td>
                      <td>{order.date}</td>
                      <td><StatusBadge className="bg-emerald-50 text-emerald-600 ring-emerald-200">{order.status}</StatusBadge></td>
                      <td>{order.quantity.replace("x", "")}</td>
                      <td>{order.value}</td>
                      <td><button className="font-semibold text-indigo-600" type="button">Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full table-fixed text-left text-xs">
                <thead className="bg-slate-50 text-slate-900">
                  <tr className="h-10">
                    <th className="px-4 font-semibold">Ticket</th>
                    <th className="font-semibold">Data</th>
                    <th className="font-semibold">Status</th>
                    <th className="font-semibold">Avaliação</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {clientTickets.map((ticket, index) => (
                    <tr className="h-10 border-t border-slate-100" key={`${ticket.ticket}-${index}`}>
                      <td className="px-4 font-medium text-slate-600">{ticket.ticket}</td>
                      <td>{ticket.createdAt}</td>
                      <td><StatusBadge className="bg-emerald-50 text-emerald-600 ring-emerald-200">Resolvido</StatusBadge></td>
                      <td><StatusBadge className="bg-indigo-50 text-indigo-600 ring-indigo-200">{ticket.rating} {ticket.ratingLabel}</StatusBadge></td>
                      <td><button className="font-semibold text-indigo-600" type="button">Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ClientsPage() {
  const { clients, addClient, updateClient, orders, tickets, showNotice } = useAppContext()
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
    setAdvancedFilters((current) => ({ ...current, status: value as FilterValue<ClientStatus> }))
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

  return (
    <PageShell title="Clientes">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar cliente"
          filterLabel="Status"
          filterOptions={["Todos", ...clientStatusOptions]}
          filterValue={advancedFilters.status}
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
          onSubmit={handleUpdate}
          title="Editar cliente"
        />
      )}
      {profileIndex !== null && (
        <ClientProfileDialog
          client={clients[profileIndex]}
          clientIndex={profileIndex}
          onClose={() => setProfileIndex(null)}
          orders={orders}
          tickets={tickets}
        />
      )}
    </PageShell>
  )
}
