import { useState } from "react"
import { ClipboardList, Pencil } from "lucide-react"

import type { OrderStatus } from "@/types"
import type { OrderOut } from "@/types/api"
import { orderStatusClasses } from "@/constants/badgeStyles"
import type { OrderCreate, OrderUpdate } from "@/types/api"
import { HttpError } from "@/services/api"
import { useAppContext } from "@/context/AppContext"
import { useOrders, useOrderMutations } from "@/hooks/useOrders"
import { useDebounce } from "@/hooks/useDebounce"
import { OrderFormModal } from "@/components/shared/OrderFormModal"
import { DataCard, DataGrid } from "@/components/shared/MetricCards"
import { DataPanel } from "@/components/shared/DataPanel"
import { OrderFilterModal, emptyOrderFilters } from "@/components/shared/OrderFilterModal"
import type { OrderFilters } from "@/components/shared/OrderFilterModal"
import { PageShell } from "@/components/shared/PageShell"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { CircleDollarSign, Heart, Smile, Tag } from "lucide-react"

const PAGE_SIZE = 6

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR")
}

function OrdersTable({
  currentPage,
  filteredCount,
  onEditOrder,
  onPageChange,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditOrder: (id: string) => void
  onPageChange: (page: number) => void
  pageCount: number
  rows: OrderOut[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-280 w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-27.5 pl-5">Pedido</TableHead>
            <TableHead sortable className="w-40">Produto</TableHead>
            <TableHead className="w-25">Quantidade</TableHead>
            <TableHead className="w-40">Cliente</TableHead>
            <TableHead sortable className="w-32.5">Valor</TableHead>
            <TableHead sortable className="w-30">Data</TableHead>
            <TableHead className="w-32.5">Status</TableHead>
            <TableHead className="w-14" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id_pedido} className="h-14.5 border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-5 font-medium text-slate-400">
                <span className="block truncate" title={row.id_pedido}>
                  #{row.id_pedido.slice(0, 8)}...
                </span>
              </TableCell>
              <TableCell className="font-semibold text-slate-800">{row.nome_produto}</TableCell>
              <TableCell>{row.quantidade}</TableCell>
              <TableCell className="max-w-0"><span className="block truncate">{row.nome_cliente}</span></TableCell>
              <TableCell className="font-medium">{formatBRL(row.valor_total)}</TableCell>
              <TableCell>{formatDate(row.data_pedido)}</TableCell>
              <TableCell>
                <StatusBadge className={orderStatusClasses[row.status as OrderStatus]}>{row.status}</StatusBadge>
              </TableCell>
              <TableCell>
                <button
                  className="grid place-items-center rounded-md p-1 transition hover:bg-slate-100"
                  onClick={() => onEditOrder(row.id_pedido)}
                  type="button"
                >
                  <Pencil className="size-4 text-[#6366F1]" />
                </button>
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

export function OrdersPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [orderFilters, setOrderFilters] = useState<OrderFilters>(emptyOrderFilters)
  const [currentPage, setCurrentPage] = useState(1)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { create, update, remove } = useOrderMutations()

  const debouncedSearch = useDebounce(search, 400)
  const { data, isPending } = useOrders(
    {
      statuses: orderFilters.statuses.length > 0 ? orderFilters.statuses : undefined,
      data_inicio: orderFilters.date || undefined,
      data_fim: orderFilters.date || undefined,
      nome: debouncedSearch || undefined,
      valor_min: orderFilters.priceMin > 0 ? orderFilters.priceMin : undefined,
      valor_max: orderFilters.priceMax < 100000 ? orderFilters.priceMax : undefined,
    },
    currentPage,
    PAGE_SIZE,
  )

  const items = data?.items ?? []
  const editingOrder = items.find((o) => o.id_pedido === editingId) ?? null
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filteredItems = items

  const aprovados = items.filter((o) => o.status === "Aprovado").length
  const processando = items.filter((o) => o.status === "Processando").length
  const receitaTotal = items.reduce((sum, o) => sum + o.valor_total, 0)

  const isFilterActive =
    !!orderFilters.date ||
    orderFilters.statuses.length > 0 ||
    orderFilters.priceMin > 0 ||
    orderFilters.priceMax < 100000

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleApplyFilters(filters: OrderFilters) {
    setOrderFilters(filters)
    setIsFilterModalOpen(false)
    setCurrentPage(1)
  }

  function notifyError(err: unknown, fallback: string) {
    const msg = err instanceof HttpError ? `Erro ${err.status}: ${err.detail}` : fallback
    showNotice(msg)
  }

  async function handleAdd(values: OrderCreate) {
    try {
      await create.mutateAsync(values)
      setIsAddModalOpen(false)
      showNotice("Pedido adicionado")
    } catch (err) {
      notifyError(err, "Erro ao adicionar pedido")
    }
  }

  async function handleUpdate(values: OrderUpdate) {
    if (!editingId) return
    try {
      await update.mutateAsync({ id: editingId, data: values })
      setEditingId(null)
      showNotice("Pedido atualizado")
    } catch (err) {
      notifyError(err, "Erro ao atualizar pedido")
    }
  }

  async function handleDelete() {
    if (!editingId) return
    try {
      await remove.mutateAsync(editingId)
      setEditingId(null)
      showNotice("Pedido excluído")
    } catch (err) {
      notifyError(err, "Erro ao excluir pedido")
    }
  }

  return (
    <PageShell title="Pedidos">
      <DataGrid>
        <DataCard label="Pedidos pendentes"  value={String(processando)} helper="Nesta página"    tone="indigo" icon={Tag} />
        <DataCard label="Total de pedidos"   value={total.toLocaleString("pt-BR")} helper="Resultado dos filtros" tone="indigo" icon={Smile} />
        <DataCard label="Receita (página)"   value={formatBRL(receitaTotal)} helper="Soma dos pedidos exibidos" tone="rose" icon={CircleDollarSign} />
        <DataCard label="Pedidos aprovados"  value={String(aprovados)} helper="Nesta página"   tone="emerald" icon={Heart} />
      </DataGrid>

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar novo pedido"
          advancedFilterActive={isFilterActive}
          icon={ClipboardList}
          label="Pedidos solicitados"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setIsFilterModalOpen(true)}
          onExport={() => showNotice("Lista exportada!")}
          onSearchChange={handleSearchChange}
          placeholder="Busque por produto, cliente ou número"
          searchValue={search}
        />
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <OrdersTable
            currentPage={currentPage}
            filteredCount={filteredItems.length}
            onEditOrder={setEditingId}
            onPageChange={setCurrentPage}
            pageCount={pageCount}
            rows={filteredItems}
            totalCount={total}
          />
        )}
      </DataPanel>

      {isFilterModalOpen && (
        <OrderFilterModal
          filters={orderFilters}
          onApply={handleApplyFilters}
          onClose={() => setIsFilterModalOpen(false)}
        />
      )}

      {isAddModalOpen && (
        <OrderFormModal
          mode="add"
          isSubmitting={create.isPending}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAdd}
        />
      )}

      {editingId !== null && editingOrder && (
        <OrderFormModal
          mode="edit"
          orderId={editingId}
          initialValues={{
            id_produto: editingOrder.id_produto,
            data_pedido: editingOrder.data_pedido,
            status: editingOrder.status as OrderCreate["status"],
            quantidade: editingOrder.quantidade,
          }}
          isSubmitting={update.isPending}
          onClose={() => setEditingId(null)}
          onSubmit={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </PageShell>
  )
}
