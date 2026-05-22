import { useState } from "react"
import { usePersistedPageSize } from "@/hooks/usePersistedPageSize"
import { Package, Pencil } from "lucide-react"

import type { ProductCategory } from "@/types"
import type { ProductCreate, ProductOut } from "@/types/api"
import { categoryClasses } from "@/constants/badgeStyles"
import { useAppContext } from "@/context/AppContext"
import { HttpError } from "@/services/api"
import { useProducts, useProductMutations } from "@/hooks/useProducts"
import { useDebounce } from "@/hooks/useDebounce"
import { formatCategoryLabel, getCategoryIcon } from "@/helpers/dictionary"
import { exportProductsToCSV } from "@/helpers/export"
import { cn } from "@/lib/utils"
import { DataPanel } from "@/components/shared/DataPanel"
import { PageShell } from "@/components/shared/PageShell"
import { ProductDetailDialog } from "@/components/shared/ProductDetailDialog"
import { ProductFormModal } from "@/components/shared/ProductFormModal"
import { ProductFilterModal, type ProductFilterState, DEFAULT_PRODUCT_FILTER } from "@/components/shared/ProductFilterModal"
import { ProductHighlightCard } from "@/components/shared/ProductHighlightCard"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RatingBadge } from "@/components/shared/RatingBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function isFilterActive(filter: ProductFilterState): boolean {
  return (
    filter.search !== "" ||
    filter.categories.length > 0 ||
    filter.minPrice > 0 ||
    filter.maxPrice < 100_000
  )
}

function toProductCreate(p: ProductOut): ProductCreate {
  return {
    nome_produto: p.nome_produto,
    categoria: p.categoria,
    preco_atual: p.preco_atual ?? 0,
    ativo: p.ativo,
    estoque_disponivel: p.estoque_disponivel,
  }
}

function ProductsTable({
  currentPage,
  filteredCount,
  onEditProduct,
  onPageChange,
  onPageSizeChange,
  onViewProduct,
  onSort,
  pageCount,
  pageSize,
  rows,
  sortBy,
  sortOrder,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditProduct: (id: string) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onViewProduct: (id: string) => void
  onSort: (key: string) => void
  pageCount: number
  pageSize: number
  rows: ProductOut[]
  sortBy?: string
  sortOrder?: "asc" | "desc"
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-192 w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-52 pl-5">Produto</TableHead>
            <TableHead className="w-28">Código</TableHead>
            <TableHead className="w-36">Categoria</TableHead>
            <TableHead sortKey="preco_atual" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-28">Preço</TableHead>
            <TableHead sortKey="nota_media" currentSortKey={sortBy} currentSortOrder={sortOrder} onSort={onSort} className="w-28">Avaliação</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id_produto}
              className="h-14.5 border-slate-100 text-sm text-slate-700 cursor-pointer"
              onClick={() => onViewProduct(row.id_produto)}
            >
              <TableCell className="pl-5 font-semibold text-slate-800">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200",
                    "bg-slate-50 text-slate-400"
                  )}>
                    {(() => {
                      const Icon = getCategoryIcon(row.categoria)
                      return <Icon className="size-5" />
                    })()}
                  </div>
                  <span className="truncate" title={row.nome_produto}>
                    {row.nome_produto}
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-400">#{row.id_produto}</TableCell>
              <TableCell>
                <StatusBadge className={categoryClasses[row.categoria as ProductCategory]}>
                  {formatCategoryLabel(row.categoria)}
                </StatusBadge>
              </TableCell>
              <TableCell className="font-medium">{formatBRL(row.preco_atual)}</TableCell>
              <TableCell>
                {row.nota_media != null ? <RatingBadge nota={row.nota_media} /> : "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    className="grid place-items-center rounded-md p-1 transition hover:bg-slate-100"
                    onClick={(e) => { e.stopPropagation(); onEditProduct(row.id_produto) }}
                    type="button"
                  >
                    <Pencil className="size-4 text-[#6366F1]" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum produto encontrado." />}
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


export function ProductsPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilter, setAdvancedFilter] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = usePersistedPageSize("produtos")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string | undefined>(undefined)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const rawSearch = search || advancedFilter.search
  const debouncedSearch = useDebounce(rawSearch, 400)

  const { data, isPending } = useProducts(
    {
      categorias: advancedFilter.categories.length > 0 ? advancedFilter.categories : undefined,
      nome: debouncedSearch || undefined,
      preco_min: advancedFilter.minPrice > 0 ? advancedFilter.minPrice : undefined,
      preco_max: advancedFilter.maxPrice < 100_000 ? advancedFilter.maxPrice : undefined,
      sort_by: sortBy,
      order: sortBy ? sortOrder : undefined,
    },
    currentPage,
    pageSize,
  )
  const { create, update, remove } = useProductMutations()

  const { data: topSold }    = useProducts({ sort_by: "qtd_vendida_total", order: "desc" }, 1, 1)
  const { data: botSold }    = useProducts({ sort_by: "qtd_vendida_total", order: "asc"  }, 1, 1)
  const { data: topRated }   = useProducts({ sort_by: "nota_media",        order: "desc" }, 1, 1)
  const { data: botRated }   = useProducts({ sort_by: "nota_media",        order: "asc"  }, 1, 1)

  const highlights = {
    mostSold:   topSold?.items[0]  ?? null,
    leastSold:  botSold?.items[0]  ?? null,
    bestRated:  topRated?.items[0] ?? null,
    worstRated: botRated?.items[0] ?? null,
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const filteredItems = items

  const editingProduct = items.find((p) => p.id_produto === editingId) ?? null
  const viewingProduct = items.find((p) => p.id_produto === viewingId) ?? null

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

  function handleSaveFilter(filters: ProductFilterState) {
    setAdvancedFilter(filters)
    setCurrentPage(1)
    if (isFilterActive(filters)) showNotice("Filtros aplicados")
  }

  function notifyError(err: unknown, fallback: string) {
    const msg = err instanceof HttpError
      ? `Erro ${err.status}: ${err.detail}`
      : fallback
    showNotice(msg)
  }

  async function handleAdd(values: ProductCreate) {
    try {
      await create.mutateAsync(values)
      setIsAddModalOpen(false)
      showNotice("Produto adicionado")
    } catch (err) {
      notifyError(err, "Erro ao adicionar produto")
    }
  }

  async function handleUpdate(values: ProductCreate) {
    if (editingId === null) return
    try {
      await update.mutateAsync({ id: editingId, data: values })
      setEditingId(null)
      showNotice("Produto atualizado")
    } catch (err) {
      notifyError(err, "Erro ao atualizar produto")
    }
  }

  async function handleDeleteFromModal() {
    if (editingId === null) return
    try {
      await remove.mutateAsync(editingId)
      setEditingId(null)
      showNotice("Produto apagado")
    } catch (err) {
      notifyError(err, "Erro ao apagar produto")
    }
  }

  return (
    <PageShell title="Produtos">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProductHighlightCard
          label="Produto mais vendido"
          metricLabel="Vendidos"
          metricValue={highlights.mostSold?.qtd_vendida_total.toLocaleString("pt-BR") ?? "—"}
          productName={highlights.mostSold?.nome_produto ?? "Carregando..."}
          tone="emerald"
        />
        <ProductHighlightCard
          label="Melhor avaliado"
          metricLabel="Nota"
          metricValue={highlights.bestRated?.nota_media?.toFixed(1) ?? "—"}
          productName={highlights.bestRated?.nome_produto ?? "Carregando..."}
          tone="indigo"
        />
        <ProductHighlightCard
          label="Menos vendido"
          metricLabel="Vendidos"
          metricValue={highlights.leastSold?.qtd_vendida_total.toLocaleString("pt-BR") ?? "—"}
          productName={highlights.leastSold?.nome_produto ?? "Carregando..."}
          tone="amber"
        />
        <ProductHighlightCard
          label="Menor avaliado"
          metricLabel="Nota"
          metricValue={highlights.worstRated?.nota_media?.toFixed(1) ?? "—"}
          productName={highlights.worstRated?.nome_produto ?? "Carregando..."}
          tone="rose"
        />
      </div>

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar produto"
          advancedFilterActive={isFilterActive(advancedFilter)}
          icon={Package}
          label="Lista de produtos"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setFilterOpen(true)}
          onExport={() => {
            if (!items.length) { showNotice("Nenhum dado para exportar."); return }
            exportProductsToCSV(items)
            showNotice(`${items.length} produtos exportados`)
          }}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um produto ou código"
          searchValue={search}
        />
        {isPending ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">Carregando...</div>
        ) : (
          <ProductsTable
            currentPage={currentPage}
            filteredCount={total}
            onEditProduct={setEditingId}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            onViewProduct={setViewingId}
            onSort={handleSort}
            pageCount={pageCount}
            pageSize={pageSize}
            rows={filteredItems}
            sortBy={sortBy}
            sortOrder={sortOrder}
            totalCount={total}
          />
        )}
      </DataPanel>

      <ProductFilterModal
        open={filterOpen}
        initial={advancedFilter}
        onClose={() => setFilterOpen(false)}
        onSave={handleSaveFilter}
      />

      {isAddModalOpen && (
        <ProductFormModal
          isSubmitting={create.isPending}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAdd}
          title="Adicionar produto"
        />
      )}
      {editingId !== null && editingProduct && (
        <ProductFormModal
          initialValues={toProductCreate(editingProduct)}
          isSubmitting={update.isPending}
          onClose={() => setEditingId(null)}
          onDelete={handleDeleteFromModal}
          onSubmit={handleUpdate}
          productId={editingId}
          title="Editar produto"
        />
      )}
      {viewingId !== null && viewingProduct && (
        <ProductDetailDialog
          product={viewingProduct}
          onClose={() => setViewingId(null)}
        />
      )}
    </PageShell>
  )
}
