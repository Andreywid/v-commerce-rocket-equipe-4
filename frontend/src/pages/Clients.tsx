import { useMemo, useState } from "react"
import { Users } from "lucide-react"

import type { ClientSegmento } from "@/types"
import type { CustomerOut } from "@/types/api"
import { segmentoClasses } from "@/constants/badgeStyles"
import { useAppContext } from "@/context/AppContext"
import { useCustomers } from "@/hooks/useCustomers"
import { ClientAdvancedFilterDialog, emptyClientAdvancedFilters } from "@/components/shared/ClientAdvancedFilterDialog"
import type { ClientAdvancedFilters } from "@/components/shared/ClientAdvancedFilterDialog"
import { ClientProfileDialog } from "@/components/shared/ClientProfileDialog"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { MapPin, Smile, Tag } from "lucide-react"
import type { Metric } from "@/types"

const PAGE_SIZE = 5

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
  return f.name !== "" || f.locations.length > 0 || f.segmentos.length > 0 || f.minTotal > 0 || f.maxTotal < 100_000
}

function ClientsTable({
  currentPage,
  filteredCount,
  onPageChange,
  onViewProfile,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onPageChange: (page: number) => void
  onViewProfile: (id: string) => void
  pageCount: number
  rows: CustomerOut[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead sortable className="w-[220px] pl-5">Nome</TableHead>
            <TableHead className="w-[190px]">Localização</TableHead>
            <TableHead className="w-[130px]">Segmento</TableHead>
            <TableHead sortable className="w-[160px]">Último pedido</TableHead>
            <TableHead className="w-[130px]">Qt de Pedidos</TableHead>
            <TableHead sortable className="w-[140px]">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id_cliente} className="h-19 border-slate-200 text-sm text-slate-700">
              <TableCell className="pl-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
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
                <StatusBadge className={segmentoClasses[row.segmento_ltv as ClientSegmento]}>
                  {row.segmento_ltv}
                </StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{formatDate(row.data_ultimo_pedido)}</TableCell>
              <TableCell>{row.qtd_pedidos_total}</TableCell>
              <TableCell className="font-medium">{formatBRL(row.valor_total_gasto)}</TableCell>
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

export function ClientsPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<ClientAdvancedFilters>(emptyClientAdvancedFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  const segmento = advancedFilters.segmentos[0]
  const estado = advancedFilters.locations[0]
  const { data, isPending } = useCustomers(
    { nome: advancedFilters.name || search || undefined, estado, segmento },
    currentPage,
    PAGE_SIZE,
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return items
    return items.filter((c) => c.nome.toLowerCase().includes(q) || String(c.id_cliente).includes(q))
  }, [items, search])

  const metrics = useMemo((): Metric[] => [
    { label: "Total de clientes", value: total.toLocaleString("pt-BR"), helper: "Cadastrados", tone: "emerald", icon: Users },
    { label: "Segmento Alto",      value: String(items.filter((c) => c.segmento_ltv === "Alto").length), helper: "Na página atual", tone: "indigo",  icon: Tag },
    { label: "Taxa de satisfação", value: "4.6/5.0", helper: "+12% NPS médio",     tone: "emerald", icon: Smile },
    { label: "Top região",         value: "São Paulo, SP", helper: "28% da fatura total", tone: "indigo",  icon: MapPin },
  ], [total, items])

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  return (
    <PageShell title="Clientes">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          advancedFilterActive={isFilterActive(advancedFilters)}
          icon={Users}
          label="Lista de clientes"
          onAdvancedFilter={() => setIsAdvancedFilterOpen(true)}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um cliente ou código"
          searchValue={search}
        />
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <ClientsTable
            currentPage={currentPage}
            filteredCount={filteredItems.length}
            onPageChange={setCurrentPage}
            onViewProfile={setProfileId}
            pageCount={pageCount}
            rows={filteredItems}
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
    </PageShell>
  )
}
