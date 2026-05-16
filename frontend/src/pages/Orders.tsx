import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import type { OrderFormValues, OrderPrazo, OrderRow, OrderStatus } from "@/types"
import { useAppContext } from "@/context/AppContext"
import { getOrdersMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { DataCard, DataGrid } from "@/components/shared/MetricCards"
import { DataPanel } from "@/components/shared/DataPanel"
import { OrderFormModal } from "@/components/shared/OrderFormModal"
import { OrderFilterModal, emptyOrderFilters } from "@/components/shared/OrderFilterModal"
import type { OrderFilters } from "@/components/shared/OrderFilterModal"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

const statusClasses: Record<OrderStatus, string> = {
  Processando:   "bg-indigo-50 text-indigo-500 border-indigo-200",
  Entregue:      "bg-emerald-50 text-emerald-500 border-emerald-200",
  Cancelado:     "bg-rose-50 text-rose-500 border-rose-200",
  "Em trânsito": "bg-amber-50 text-amber-500 border-amber-200",
}

const PRAZO_STYLE: Record<OrderPrazo, { bg: string; border: string; color: string }> = {
  "No prazo":      { bg: "#C7D2FE", border: "#A5B4FC", color: "#4338CA" },
  "Fora do prazo": { bg: "#FECDD3", border: "#FDA4AF", color: "#E11D48" },
}

function PrazoBadge({ prazo }: { prazo: OrderPrazo }) {
  const s = PRAZO_STYLE[prazo] ?? PRAZO_STYLE["No prazo"]
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, borderColor: s.border, color: s.color }}
    >
      {prazo}
    </span>
  )
}

function OrdersTable({
  currentPage,
  filteredCount,
  onPageChange,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onPageChange: (page: number) => void
  pageCount: number
  rows: OrderRow[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-280 w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-32.5 pl-5">Prazo</TableHead>
            <TableHead className="w-27.5">Pedido</TableHead>
            <TableHead sortable className="w-40">Produto</TableHead>
            <TableHead className="w-25">Quantidade</TableHead>
            <TableHead className="w-40">Cliente</TableHead>
            <TableHead sortable className="w-32.5">Valor</TableHead>
            <TableHead className="w-22.5">Estoque</TableHead>
            <TableHead sortable className="w-30">Data</TableHead>
            <TableHead className="w-32.5">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="h-14.5 border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-5">
                <PrazoBadge prazo={row.prazo} />
              </TableCell>
              <TableCell className="font-medium text-slate-400">{row.id}</TableCell>
              <TableCell className="font-semibold text-slate-800">{row.product}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell className="max-w-0"><span className="block truncate">{row.customer}</span></TableCell>
              <TableCell className="font-medium">{row.value}</TableCell>
              <TableCell>{row.stock}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>
                <StatusBadge className={statusClasses[row.status]}>{row.status}</StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum pedido encontrado." />}
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

function parseOrderPrice(value: string): number {
  return parseFloat(value.replace("R$ ", "").replace(/\./g, "").replace(",", ".")) || 0
}

function useFilteredOrders(search: string, filters: OrderFilters) {
  const { orders } = useAppContext()
  return useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = !search || rowIncludes(order, search)
        const matchesDate = !filters.date || order.date.includes(filters.date)
        const matchesStatus = filters.statuses.length === 0 || filters.statuses.includes(order.status)
        const price = parseOrderPrice(order.value)
        const matchesPrice = price >= filters.priceMin && price <= filters.priceMax
        const matchesPrazo = filters.prazo.length === 0 || filters.prazo.includes(order.prazo)
        return matchesSearch && matchesDate && matchesStatus && matchesPrice && matchesPrazo
      }),
    [orders, search, filters],
  )
}

export function OrdersPage() {
  const { orders, addOrder, showNotice } = useAppContext()
  const [orderSearch, setOrderSearch] = useState("")
  const [orderFilters, setOrderFilters] = useState<OrderFilters>(emptyOrderFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  const filteredOrders = useFilteredOrders(orderSearch, orderFilters)
  const metrics = getOrdersMetrics(orders)

  const isFilterActive =
    !!orderFilters.date ||
    orderFilters.statuses.length > 0 ||
    orderFilters.priceMin > 0 ||
    orderFilters.priceMax < 100000 ||
    orderFilters.prazo.length > 0

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setOrderSearch(value)
    setCurrentPage(1)
  }

  function handleApplyFilters(filters: OrderFilters) {
    setOrderFilters(filters)
    setIsFilterModalOpen(false)
    setCurrentPage(1)
  }

  function handleSubmit(values: OrderFormValues) {
    addOrder(values)
    setIsOrderModalOpen(false)
    showNotice("Pedido adicionado")
  }

  return (
    <PageShell title="Pedidos">
      <DataGrid>
        {metrics.map((metric) => (
          <DataCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
            icon={metric.icon}
          />
        ))}
      </DataGrid>

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar novo pedido"
          advancedFilterActive={isFilterActive}
          icon={ClipboardList}
          label="Pedidos solicitados"
          onAction={() => setIsOrderModalOpen(true)}
          onAdvancedFilter={() => setIsFilterModalOpen(true)}
          onExport={() => showNotice("Lista exportada!")}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um produto, data ou status"
          searchValue={orderSearch}
        />
        <OrdersTable
          currentPage={safePage}
          filteredCount={filteredOrders.length}
          onPageChange={setCurrentPage}
          pageCount={pageCount}
          rows={paginatedOrders}
          totalCount={orders.length}
        />
      </DataPanel>

      {isOrderModalOpen && (
        <OrderFormModal onClose={() => setIsOrderModalOpen(false)} onSubmit={handleSubmit} />
      )}
      {isFilterModalOpen && (
        <OrderFilterModal
          filters={orderFilters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}
    </PageShell>
  )
}
