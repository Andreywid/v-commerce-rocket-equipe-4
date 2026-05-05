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
import { EmptyTableState, TableHead, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const statusClasses: Record<OrderStatus, string> = {
  Processando: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Entregue: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Cancelado: "bg-rose-50 text-rose-500 ring-rose-200",
  "Em trânsito": "bg-amber-50 text-amber-500 ring-amber-200",
}

function OrdersTable({ rows, totalCount }: { rows: ReturnType<typeof useFilteredOrders>; totalCount: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] table-fixed text-left">
        <thead>
          <tr className="h-12 border-b border-slate-200 text-sm text-slate-950">
            <TableHead className="w-[110px] pl-5">Pedido</TableHead>
            <TableHead className="w-[160px]">Produto</TableHead>
            <TableHead className="w-[250px]">Cliente</TableHead>
            <TableHead sortable className="w-[130px]">Valor</TableHead>
            <TableHead className="w-[100px]">Estoque</TableHead>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[80px]">Quant.</TableHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="h-[58px] border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
              <td className="pl-5 font-medium text-slate-400">{row.id}</td>
              <td className="font-semibold text-slate-800">{row.product}</td>
              <td>{row.customer}</td>
              <td className="font-medium">{row.value}</td>
              <td>{row.stock}</td>
              <td>{row.date}</td>
              <td>
                <StatusBadge className={statusClasses[row.status]}>{row.status}</StatusBadge>
              </td>
              <td className="font-medium">{row.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum pedido encontrado." />}
      <TablePagination filteredCount={rows.length} totalCount={totalCount} />
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
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)

  const filteredOrders = useFilteredOrders(orderSearch, orderStatusFilter)
  const metrics = getOrdersMetrics(orders)

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
          onFilterChange={(value) => setOrderStatusFilter(value as FilterValue<OrderStatus>)}
          onSearchChange={setOrderSearch}
          placeholder="Busque por produto, cliente, data ou status"
          searchValue={orderSearch}
        />
        <OrdersTable rows={filteredOrders} totalCount={orders.length} />
      </DataPanel>

      {isOrderModalOpen && <OrderFormModal onClose={() => setIsOrderModalOpen(false)} onSubmit={handleSubmit} />}
    </PageShell>
  )
}
