import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import type { SupportType } from "@/types"
import type { TicketOut } from "@/types/api"
import { supportStatusClasses, supportTypeClasses } from "@/constants/badgeStyles"
import { useAppContext } from "@/context/AppContext"
import { useSupport } from "@/hooks/useSupport"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { SupportFilterModal, emptySupportFilters, type SupportFilters } from "@/components/shared/SupportFilterModal"
import { TicketDetailModal } from "@/components/shared/TicketDetailModal"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { Heart, Smile, Users } from "lucide-react"
import type { Metric } from "@/types"

const PAGE_SIZE = 5

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function SupportTable({
  currentPage,
  filteredCount,
  onPageChange,
  onViewTicket,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onPageChange: (page: number) => void
  onViewTicket: (ticket: TicketOut) => void
  pageCount: number
  rows: TicketOut[]
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
            <TableHead sortable className="w-35">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id_ticket} className="h-14.5 border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-5">
                <button
                  className="font-semibold text-slate-800 transition hover:text-indigo-600"
                  onClick={() => onViewTicket(row)}
                  type="button"
                >
                  #{row.id_ticket}
                </button>
              </TableCell>
              <TableCell>{row.nome_cliente}</TableCell>
              <TableCell>
                <StatusBadge className={supportTypeClasses[row.tipo_problema as SupportType]}>
                  {row.tipo_problema}
                </StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{formatDate(row.data_abertura)}</TableCell>
              <TableCell>{row.data_resolucao ? formatDate(row.data_resolucao) : "—"}</TableCell>
              <TableCell>
                <StatusBadge className={supportStatusClasses[row.status_ticket]}>
                  {row.status_ticket}
                </StatusBadge>
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

export function SupportPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilters, setAdvancedFilters] = useState<SupportFilters>(emptySupportFilters)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingTicket, setViewingTicket] = useState<TicketOut | null>(null)

  const tipo = advancedFilters.types[0]
  const status = advancedFilters.statuses[0]
  const { data, isPending } = useSupport({ tipo, status }, currentPage, PAGE_SIZE)

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return items
    return items.filter(
      (t) =>
        t.nome_cliente.toLowerCase().includes(q) ||
        String(t.id_ticket).includes(q) ||
        t.tipo_problema.toLowerCase().includes(q),
    )
  }, [items, search])

  const resolvidos = items.filter((t) => t.status_ticket === "Resolvido").length
  const abertos = items.filter((t) => t.status_ticket === "Aberto").length

  const metrics: Metric[] = [
    { label: "Tickets resolvidos", value: String(resolvidos), helper: "+3% vs mês anterior", tone: "emerald", icon: Users },
    { label: "Satisfação média",   value: "4.6/5.0", helper: "+12% NPS médio",   tone: "emerald", icon: Smile },
    { label: "Tickets em aberto",  value: String(abertos), helper: "Atenção prioritária",   tone: "rose",    icon: Users },
    { label: "Total (página)",     value: String(items.length), helper: "Tickets",           tone: "violet",  icon: Heart },
  ]

  const isAdvancedFilterActive = !!(
    advancedFilters.date ||
    advancedFilters.types.length > 0 ||
    advancedFilters.statuses.length > 0
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleApplyFilters(filters: SupportFilters) {
    setAdvancedFilters(filters)
    setCurrentPage(1)
    if (filters.types.length > 0 || filters.statuses.length > 0) showNotice("Filtros aplicados")
  }

  return (
    <PageShell title="Suporte">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          advancedFilterActive={isAdvancedFilterActive}
          icon={ClipboardList}
          label="Tickets de suporte"
          onAdvancedFilter={() => setIsFilterModalOpen(true)}
          onSearchChange={handleSearchChange}
          placeholder="Busque por ticket, cliente ou tipo"
          searchValue={search}
        />
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <SupportTable
            currentPage={currentPage}
            filteredCount={filteredItems.length}
            onPageChange={setCurrentPage}
            onViewTicket={setViewingTicket}
            pageCount={pageCount}
            rows={filteredItems}
            totalCount={total}
          />
        )}
      </DataPanel>

      {isFilterModalOpen && (
        <SupportFilterModal
          filters={advancedFilters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
      {viewingTicket && (
        <TicketDetailModal
          ticket={viewingTicket}
          onClose={() => setViewingTicket(null)}
        />
      )}
    </PageShell>
  )
}
