import { useMemo, useState } from "react"
import { Package, Pencil } from "lucide-react"

import type { ProductCategory } from "@/types"
import type { ProductCreate, ProductOut } from "@/types/api"
import { categoryClasses } from "@/constants/badgeStyles"
import { useAppContext } from "@/context/AppContext"
import { HttpError } from "@/services/api"
import { useProducts, useProductMutations } from "@/hooks/useProducts"
import { useDebounce } from "@/hooks/useDebounce"
import { formatCategoryLabel, getCategoryIcon } from "@/helpers/dictionary"
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

const PAGE_SIZE = 5

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function isFilterActive(filter: ProductFilterState): boolean {
  return (
    filter.search !== "" ||
    filter.categories.length > 0 ||
    filter.minPrice > 0 ||
    filter.maxPrice < 100_000 ||
    filter.apenasAtivo ||
    filter.apenasInativo
  )
}

function toProductCreate(p: ProductOut): ProductCreate {
  return {
    nome_produto: p.nome_produto,
    categoria: p.categoria,
    preco_atual: p.preco_atual,
    ativo: p.ativo,
    estoque: p.estoque,
    descricao: p.descricao,
    imagem_url: p.imagem_url,
  }
}

function ProductsTable({
  currentPage,
  filteredCount,
  onEditProduct,
  onPageChange,
  onViewProduct,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onEditProduct: (id: string) => void
  onPageChange: (page: number) => void
  onViewProduct: (id: string) => void
  pageCount: number
  rows: ProductOut[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-225 w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-50 pl-5">Produto</TableHead>
            <TableHead className="w-30">Código</TableHead>
            <TableHead className="w-55">Categoria</TableHead>
            <TableHead sortable className="w-35">Preço</TableHead>
            <TableHead className="w-25">Estoque</TableHead>
            <TableHead sortable className="w-37.5">Avaliação</TableHead>
            <TableHead className="w-30" />
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
                    "flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-200",
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
              <TableCell>{row.estoque ?? "—"}</TableCell>
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
                    <Pencil className="size-4 text-[#0A0A0A]" />
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
        pageCount={pageCount}
        totalCount={totalCount}
      />
    </div>
  )
}

function useProductHighlights(items: ProductOut[]) {
  return useMemo(() => {
    if (items.length === 0) return null
    const mostSold   = items.reduce((a, b) => (a.qtd_vendida_total > b.qtd_vendida_total ? a : b))
    const leastSold  = items.reduce((a, b) => (a.qtd_vendida_total < b.qtd_vendida_total ? a : b))
    const bestRated  = items.reduce((a, b) => ((a.nota_media ?? 0) > (b.nota_media ?? 0) ? a : b))
    const worstRated = items.reduce((a, b) => ((a.nota_media ?? 0) < (b.nota_media ?? 0) ? a : b))
    return { mostSold, leastSold, bestRated, worstRated }
  }, [items])
}

export function ProductsPage() {
  const { showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilter, setAdvancedFilter] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const categoria = advancedFilter.categories[0]
  const rawSearch = search || advancedFilter.search
  const debouncedSearch = useDebounce(rawSearch, 400)

  const ativo =
    advancedFilter.apenasAtivo && !advancedFilter.apenasInativo ? true :
    advancedFilter.apenasInativo && !advancedFilter.apenasAtivo ? false :
    undefined

  const { data, isPending } = useProducts(
    { categoria, nome: debouncedSearch || undefined, ativo },
    currentPage,
    PAGE_SIZE,
  )
  const { create, update, remove } = useProductMutations()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filteredItems = items

  const highlights = useProductHighlights(items)
  const editingProduct = items.find((p) => p.id_produto === editingId) ?? null
  const viewingProduct = items.find((p) => p.id_produto === viewingId) ?? null

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
      {highlights && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProductHighlightCard
            label="Produto mais vendido"
            metricLabel="Vendidos"
            metricValue={highlights.mostSold.qtd_vendida_total.toLocaleString("pt-BR")}
            productName={highlights.mostSold.nome_produto}
            tone="emerald"
          />
          <ProductHighlightCard
            label="Melhor avaliado"
            metricLabel="Nota"
            metricValue={highlights.bestRated.nota_media?.toFixed(1) ?? "—"}
            productName={highlights.bestRated.nome_produto}
            tone="emerald"
          />
          <ProductHighlightCard
            label="Menos vendido"
            metricLabel="Vendidos"
            metricValue={highlights.leastSold.qtd_vendida_total.toLocaleString("pt-BR")}
            productName={highlights.leastSold.nome_produto}
            tone="amber"
          />
          <ProductHighlightCard
            label="Menor avaliado"
            metricLabel="Nota"
            metricValue={highlights.worstRated.nota_media?.toFixed(1) ?? "—"}
            productName={highlights.worstRated.nome_produto}
            tone="rose"
          />
        </div>
      )}

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar produto"
          advancedFilterActive={isFilterActive(advancedFilter)}
          icon={Package}
          label="Lista de produtos"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setFilterOpen(true)}
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
            onViewProduct={setViewingId}
            pageCount={pageCount}
            rows={filteredItems}
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
          onEdit={() => {
            setEditingId(viewingId)
            setViewingId(null)
          }}
        />
      )}
    </PageShell>
  )
}
