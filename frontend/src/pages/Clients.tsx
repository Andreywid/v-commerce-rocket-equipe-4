import { useState } from "react"
import { usePersistedPageSize } from "@/hooks/usePersistedPageSize"
import { Pencil, Users } from "lucide-react"

import type { ClienteStatus } from "@/types"
import type { CustomerOut } from "@/types/api"
import { clienteStatusClasses } from "@/constants/badgeStyles"
import { toast } from "sonner"
import { useAppContext } from "@/context/AppContext"
import { exportClientesToCSV } from "@/helpers/export"
import { useCustomers, useCustomerStats } from "@/hooks/useCustomers"
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
import { MapPin, Smile, Tag } from "lucide-react"
import type { Metric } from "@/types"

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR")
}

function isFilterActive(f: ClientAdvancedFilters): boolean {
  return f.name !== "" || f.locations.length > 0 || f.avaliacoes.length > 0 || f.statuses.length > 0 || f.minTotal > 0 || f.maxTotal < 100_000
}

function ClientsTable({
  currentPage,
  filteredCount,
  onEditClient,
  onPageChange,
  onPageSizeChange,
  onSort,
  onViewProfile,
  pageCount,
  pageSize,
  rows,
  sortBy,
  sortOrder,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditClient: (customer: CustomerOut) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSort: (key: string) => void
  onViewProfile: (id: string) => void
  pageCount: number
  pageSize: number
  rows: CustomerOut[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead sortKey="nome" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-[220px] pl-5">Nome</TableHead>
            <TableHead className="w-[190px]">Localização</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead sortKey="data_ultimo_pedido" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-[160px]">Último pedido</TableHead>
            <TableHead className="w-[130px]">Qt de Pedidos</TableHead>
            <TableHead sortKey="valor_total_gasto" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-[140px]">Total</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id_cliente} className="h-19 border-slate-200 text-sm text-slate-700">
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xs font-bold text-[#0A0A0A]">
                    {getInitials(row.nome)}
                  </span>
                  <button
                    className="text-left font-semibold text-slate-800 transition hover:text-indigo-600"
                    onClick={() => onViewProfile(row.id_cliente)}
                    type="button"
                  >
                    {row.nome}
                  </button>
                </div>
              </TableCell>
              <TableCell className="text-slate-400">{row.cidade}, {row.estado}</TableCell>
              <TableCell>
                {(() => {
                  const status: ClienteStatus = row.qtd_pedidos_total >= 2 ? "Recorrente" : "Novo"
                  return (
                    <StatusBadge className={clienteStatusClasses[status]}>
                      {status}
                    </StatusBadge>
                  )
                })()}
              </TableCell>
              <TableCell className="font-medium">{formatDate(row.data_ultimo_pedido)}</TableCell>
              <TableCell>{row.qtd_pedidos_total}</TableCell>
              <TableCell className="font-medium">{formatBRL(row.valor_total_gasto)}</TableCell>
              <TableCell>
                <button
                  className="grid place-items-center rounded-md p-1 transition hover:bg-slate-100"
                  onClick={() => onEditClient(row)}
                  type="button"
                >
                  <Pencil className="size-4 text-[#6366F1]" />
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
        onPageSizeChange={onPageSizeChange}
        pageCount={pageCount}
        pageSize={pageSize}
        totalCount={totalCount}
      />
    </div>
  )
}

export function ClientsPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<ClientAdvancedFilters>(emptyClientAdvancedFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize("clientes")
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<CustomerOut | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const segMap: Record<string, string> = { Excelente: "Alto", Ótimo: "Alto", Bom: "Medio", Crítico: "Baixo" }
  const segmentos = [...new Set(advancedFilters.avaliacoes.map((a) => segMap[a]).filter(Boolean))]
  const isRecorrente =
    advancedFilters.statuses.length === 1
      ? advancedFilters.statuses[0] === "Recorrente"
      : undefined

  const { data: stats } = useCustomerStats()
  const { data, isPending } = useCustomers(
    {
      nome: advancedFilters.name || search || undefined,
      estados: advancedFilters.locations.length > 0 ? advancedFilters.locations : undefined,
      segmentos: segmentos.length > 0 ? segmentos : undefined,
      is_recorrente: isRecorrente,
      min_total: advancedFilters.minTotal > 0 ? advancedFilters.minTotal : undefined,
      max_total: advancedFilters.maxTotal < 100_000 ? advancedFilters.maxTotal : undefined,
      sort_by: sortBy,
      order: sortBy ? sortOrder : undefined,
    },
    currentPage,
    pageSize,
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const filteredItems = items

  const metrics: Metric[] = [
    { label: "Total de clientes", value: total.toLocaleString("pt-BR"), helper: "Cadastrados", tone: "emerald", icon: Users },
    { label: "Segmento Alto",      value: String(data?.segmento_alto ?? 0), helper: "Resultado dos filtros", tone: "indigo",  icon: Tag },
    {
      label: "Nota média",
      value: stats?.nota_media != null ? `${stats.nota_media.toFixed(1)}/5.0` : "—",
      helper: stats?.nps_medio != null ? `NPS médio ${stats.nps_medio.toFixed(1)}` : "Carregando...",
      tone: "emerald",
      icon: Smile,
    },
    {
      label: "Top região",
      value: stats?.top_estado ?? "—",
      helper: stats?.top_estado_percentual != null ? `${stats.top_estado_percentual}% dos clientes` : "Carregando...",
      tone: "indigo",
      icon: MapPin,
    },
  ]

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setCurrentPage(1)
  }

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

  return (
    <PageShell title="Clientes">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar cliente"
          advancedFilterActive={isFilterActive(advancedFilters)}
          icon={Users}
          label="Lista de clientes"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setIsAdvancedFilterOpen(true)}
          onExport={() => {
            if (!items.length) { toast.error("Nenhum dado para exportar."); return }
            exportClientesToCSV(items)
            showNotice(`${items.length} clientes exportados`)
          }}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um cliente ou código"
          searchValue={search}
        />
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <ClientsTable
            currentPage={currentPage}
            filteredCount={total}
            onEditClient={setEditingClient}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            onSort={handleSort}
            onViewProfile={setProfileId}
            pageCount={pageCount}
            pageSize={pageSize}
            rows={filteredItems}
            sortBy={sortBy}
            sortOrder={sortOrder}
            totalCount={total}
          />
        )}
      </DataPanel>

      {isAdvancedFilterOpen && (
        <ClientAdvancedFilterDialog
          filters={advancedFilters}
          onApply={(filters) => {
            setAdvancedFilters(filters)
            setCurrentPage(1)
            setIsAdvancedFilterOpen(false)
            if (isFilterActive(filters)) showNotice("Filtros aplicados")
          }}
          onClose={() => setIsAdvancedFilterOpen(false)}
        />
      )}
      {profileId !== null && (
        <ClientProfileDialog
          customerId={profileId}
          onClose={() => setProfileId(null)}
        />
      )}
      {isAddModalOpen && (
        <ClientFormModal
          mode="add"
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={() => { setIsAddModalOpen(false); showNotice("Cliente adicionado") }}
        />
      )}
      {editingClient !== null && (
        <ClientFormModal
          mode="edit"
          customer={editingClient}
          onClose={() => setEditingClient(null)}
          onDelete={() => { setEditingClient(null); showNotice("Cliente excluído") }}
          onSubmit={() => { setEditingClient(null); showNotice("Cliente atualizado") }}
        />
      )}
    </PageShell>
  )
}
