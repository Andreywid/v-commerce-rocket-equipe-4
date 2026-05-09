import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import type { FilterValue, OrderFormValues, OrderRow, OrderStatus, OrderTimeline } from "@/types"
import { orderStatusOptions } from "@/mocks/orders"
import { useAppContext } from "@/context/AppContext"
import { getOrdersMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { DataPanel } from "@/components/shared/DataPanel"
import { DataCard, DataGrid } from "@/components/shared/MetricCards" 
import { OrderFormModal } from "@/components/shared/OrderFormModal"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { TableRow, TableCell } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { DataTable, type Columns } from "@/components/shared/DataTable"
import { useTableSort } from "@/hooks/useTableSort"
import { useTableFilters } from "@/hooks/useTableFilter"

const PAGE_SIZE = 5

const statusClasses: Record<OrderStatus, string> = {
  Processando: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Entregue: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Cancelado: "bg-rose-50 text-rose-500 ring-rose-200",
  "Em trânsito": "bg-amber-50 text-amber-500 ring-amber-200",
}

const timelineClasses: Record<OrderTimeline, string> = {
  "No Prazo": "bg-indigo-50 text-indigo-500 ring-indigo-200",
  "Fora do Prazo": "bg-rose-50 text-rose-500 ring-rose-200",
}

function useFilteredOrders(search: string, statusFilter: FilterValue<OrderStatus>) {
  const { orders } = useAppContext()
  return useMemo(
    () =>
      orders.filter((order) => {
        const formattedDate = new Intl.DateTimeFormat("pt-BR").format(new Date(order.date))
        const valueAsNumber = typeof order.value === 'string' ? parseFloat(order.value) : order.value
        const formattedValue = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueAsNumber)
        const matchesSearch = rowIncludes(
          {
            id: order.id,
            product: order.product,
            customer: order.customer,
            value: formattedValue,
            stock: String(order.stock),
            date: formattedDate,
            status: order.status,
            quantity: String(order.quantity),
          },
          search,
        )
        const matchesStatus = statusFilter === "Todos" || order.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [orders, search, statusFilter],
  )
}

export function OrdersPage() {
  const { orders, addOrder, showNotice } = useAppContext()
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const {
    search,
    filterValue,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    handleFilterChange,
  } = useTableFilters<OrderStatus>()

  const filteredOrders = useFilteredOrders(search, filterValue)
  const metrics = getOrdersMetrics(orders)

  const { sortedData, sortConfig, handleSort } = useTableSort(
    filteredOrders,
    (item, key) => item[key as keyof OrderRow]
  )

  const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedOrders = sortedData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Columns<OrderRow>[] = [
    { label: "Prazo", className: "pl-10", sortable: true, accessorKey: "timeline" },
    { label: "Código", className: "pl-5", sortable: true, accessorKey: "id" },
    { label: "Produto", sortable: true, accessorKey: "product" },
    { label: "Quantidade", className: "text-center pl-5", sortable: true, accessorKey: "quantity" }, 
    { label: "Cliente", className: "w-[240px] pl-5", sortable: true, accessorKey: "customer" },
    { label: "Valor", className: "text-right pr-5", sortable: true, accessorKey: "value" }, 
    { label: "Estoque", className: "text-center", sortable: true, accessorKey: "stock" }, 
    { label: "Data", className: "text-center pr-10", sortable: true, accessorKey: "date" },
    { label: "Status", className: "text-center pr-12", sortable: false, accessorKey: "status" },
  ]

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
          actionLabel="Adicionar pedido"
          filterLabel="Status"
          filterOptions={["Todos", ...orderStatusOptions]}
          filterValue={filterValue}
          icon={ClipboardList}
          label="Pedidos solicitados"
          onAction={() => setIsOrderModalOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          placeholder="Busque por produto, cliente, data ou status"
          searchValue={search}
        />
        <DataTable
          columns={columns}
          data={paginatedOrders}
          emptyMessage="Nenhum pedido encontrado."
          currentPage={safePage}
          onPageChange={setCurrentPage}
          filteredCount={filteredOrders.length}
          pageCount={pageCount}
          totalCount={orders.length}
          onSort={handleSort}
          sortConfig={sortConfig}
          renderRow={(order) => {
            const valueAsNumber = typeof order.value === 'string' ? parseFloat(order.value) : order.value;
            return (
              <TableRow key={order.id} className="h-[58px] border-slate-100 text-sm text-slate-700">
                <TableCell className="pl-10">
                  <StatusBadge className={timelineClasses[order.timeline]}>{order.timeline}</StatusBadge>
                </TableCell>
                <TableCell className="pl-5 font-medium text-slate-400">{order.id}</TableCell>
                <TableCell className="font-semibold text-slate-800">{order.product}</TableCell>
                <TableCell className="font-medium text-center">{order.quantity}x</TableCell>
                <TableCell className="pl-5">{order.customer}</TableCell>
                <TableCell className="font-medium text-right pr-5">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueAsNumber)}
                </TableCell>
                <TableCell className="text-center">{order.stock.toLocaleString('pt-BR')}</TableCell>
                <TableCell className="text-center pr-10">{new Intl.DateTimeFormat("pt-BR").format(new Date(order.date))}</TableCell>
                <TableCell className="text-center pr-10">
                  <StatusBadge className={statusClasses[order.status]}>{order.status}</StatusBadge>
                </TableCell>
              </TableRow>
            )
          }}
        />
      </DataPanel>

      {isOrderModalOpen && <OrderFormModal onClose={() => setIsOrderModalOpen(false)} onSubmit={handleSubmit} />}
    </PageShell>
  )
}