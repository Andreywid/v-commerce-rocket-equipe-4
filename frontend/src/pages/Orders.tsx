import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import type { FilterValue, OrderFormValues, OrderStatus } from "@/types"
import { orderStatusOptions } from "@/mocks/orders"
import { useAppContext } from "@/context/AppContext"
import { getOrdersMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { DataPanel } from "@/components/shared/DataPanel"
import { MetricGrid } from "@/components/shared/MetricCard"
import { OrderFormModal } from "@/components/shared/OrderFormModal"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

const statusClasses: Record<OrderStatus, string> = {
  Processando: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Entregue: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Cancelado: "bg-rose-50 text-rose-500 ring-rose-200",
  "Em trânsito": "bg-amber-50 text-amber-500 ring-amber-200",
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
  rows: ReturnType<typeof useFilteredOrders>
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-[110px] pl-5">Pedido</TableHead>
            <TableHead className="w-[160px]">Produto</TableHead>
            <TableHead className="w-[250px]">Cliente</TableHead>
            <TableHead sortable className="w-[130px]">Valor</TableHead>
            <TableHead className="w-[100px]">Estoque</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px]">Quant.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="h-[58px] border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-5 font-medium text-slate-400">{row.id}</TableCell>
              <TableCell className="font-semibold text-slate-800">{row.product}</TableCell>
              <TableCell>{row.customer}</TableCell>
              <TableCell className="font-medium">{row.value}</TableCell>
              <TableCell>{row.stock}</TableCell>
              <TableCell>{row.date}</TableCell>
              <TableCell>
                <StatusBadge className={statusClasses[row.status]}>{row.status}</StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{row.quantity}</TableCell>
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

function useFilteredOrders(search: string, statusFilter: FilterValue<OrderStatus>) {
  const { orders } = useAppContext()
  return useMemo(
    () =>
      orders.filter((order) => {
        const matchesSearch = rowIncludes(order, search)
        const matchesStatus = statusFilter === "Todos" || order.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [orders, search, statusFilter],
  )
}

export function OrdersPage() {
  const { orders, addOrder, showNotice } = useAppContext()
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState<FilterValue<OrderStatus>>("Todos")
  const [currentPage, setCurrentPage] = useState(1)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  const filteredOrders = useFilteredOrders(orderSearch, orderStatusFilter)
  const metrics = getOrdersMetrics(orders)

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedOrders = filteredOrders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setOrderSearch(value)
    setCurrentPage(1)
  }

  function handleFilterChange(value: string) {
    setOrderStatusFilter(value as FilterValue<OrderStatus>)
    setCurrentPage(1)
  }

  function handleSubmit(values: OrderFormValues) {
    addOrder(values)
    setIsOrderModalOpen(false)
    showNotice("Pedido adicionado")
  }

  return (
    <PageShell title="Pedidos">
      <MetricGrid metrics={metrics} />

      <DataPanel>
        <TableToolbar
          actionLabel="Criar novo"
          filterLabel="Status"
          filterOptions={["Todos", ...orderStatusOptions]}
          filterValue={orderStatusFilter}
          icon={ClipboardList}
          label="Pedidos solicitados"
          onAction={() => setIsOrderModalOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          placeholder="Busque por produto, cliente, data ou status"
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

      {isOrderModalOpen && <OrderFormModal onClose={() => setIsOrderModalOpen(false)} onSubmit={handleSubmit} />}
    </PageShell>
  )
}
