import { useMemo, useState } from "react"
import { Eye, Package, Pencil, Trash2 } from "lucide-react"

import type { ProductCategory, ProductFormValues, ProductRow, RatingLabel } from "@/types"
import { getProductImage } from "@/mocks/productImages"
import { categoryClasses } from "@/constants/badgeStyles"
import { useAppContext } from "@/context/AppContext"
import { rowIncludes } from "@/helpers/storage"
import { Button } from "@/components/ui/button"
import { DataPanel } from "@/components/shared/DataPanel"
import { PageShell } from "@/components/shared/PageShell"
import { ProductDetailDialog } from "@/components/shared/ProductDetailDialog"
import { ProductFormModal } from "@/components/shared/ProductFormModal"
import { ProductFilterModal, type ProductFilterState, DEFAULT_PRODUCT_FILTER } from "@/components/shared/ProductFilterModal"
import { ProductHighlightCard } from "@/components/shared/ProductHighlightCard"
import { RatingBadge, StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

function parsePrice(price: string): number {
  return parseFloat(price.replace(/[R$\s.]/g, "").replace(",", ".")) || 0
}

function isFilterActive(filter: ProductFilterState): boolean {
  return filter.search !== "" || filter.categories.length > 0 || filter.ratings.length > 0 || filter.minPrice > 0 || filter.maxPrice < 100_000
}

type FilteredProduct = { product: ProductRow; index: number }

function ProductsTable({
  currentPage,
  filteredCount,
  onDeleteProduct,
  onEditProduct,
  onPageChange,
  onViewProduct,
  pageCount,
  rows,
  totalCount,
}: {
  currentPage: number
  filteredCount: number
  onDeleteProduct: (index: number) => void
  onEditProduct: (index: number) => void
  onPageChange: (page: number) => void
  onViewProduct: (index: number) => void
  pageCount: number
  rows: FilteredProduct[]
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
          {rows.map(({ product: row, index }) => (
            <TableRow key={row.id} className="h-14.5 border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-5 font-semibold text-slate-800">
                <div className="flex items-center gap-3">
                  {getProductImage(row) ? (
                    <img
                      alt={row.name}
                      className="size-10 rounded-md border border-slate-200 object-cover"
                      src={getProductImage(row)}
                    />
                  ) : (
                    <div className="size-10 rounded-md border border-slate-200 bg-slate-100" />
                  )}
                  <span>{row.name}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium text-slate-400">{row.id}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {row.categories.map((cat) => (
                    <StatusBadge key={cat} className={categoryClasses[cat as ProductCategory]}>
                      {cat}
                    </StatusBadge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="font-medium">{row.price}</TableCell>
              <TableCell>{row.stock}</TableCell>
              <TableCell>
                <RatingBadge rating={row.rating} label={row.ratingLabel} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button
                    className="grid place-items-center rounded-md p-1 transition hover:bg-indigo-50"
                    onClick={() => onViewProduct(index)}
                    type="button"
                  >
                    <Eye className="size-4 text-[#4F46E5]" />
                  </button>
                  <button
                    className="grid place-items-center rounded-md p-1 transition hover:bg-indigo-50"
                    onClick={() => onEditProduct(index)}
                    type="button"
                  >
                    <Pencil className="size-4 text-[#4F46E5]" />
                  </button>
                  <button
                    className="grid place-items-center rounded-md p-1 transition hover:bg-rose-50"
                    onClick={() => onDeleteProduct(index)}
                    type="button"
                  >
                    <Trash2 className="size-4 text-[#F43F5E]" />
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

function useProductHighlights(products: ProductRow[]) {
  return useMemo(() => {
    if (products.length === 0) return null
    const mostSold   = products.reduce((a, b) => (a.sold > b.sold ? a : b))
    const leastSold  = products.reduce((a, b) => (a.sold < b.sold ? a : b))
    const bestRated  = products.reduce((a, b) => (parseFloat(a.rating) > parseFloat(b.rating) ? a : b))
    const worstRated = products.reduce((a, b) => (parseFloat(a.rating) < parseFloat(b.rating) ? a : b))
    return { mostSold, leastSold, bestRated, worstRated }
  }, [products])
}

function useFilteredProducts(toolbarSearch: string, filter: ProductFilterState) {
  const { products } = useAppContext()
  return useMemo(
    () =>
      products
        .map((product, index) => ({ product, index }))
        .filter(({ product }) => {
          const searchTarget = {
            name: product.name,
            id: product.id,
            price: product.price,
            rating: product.rating,
            ratingLabel: product.ratingLabel,
            categories: product.categories.join(" "),
          }
          if (toolbarSearch && !rowIncludes(searchTarget, toolbarSearch)) return false
          if (filter.search && !rowIncludes(searchTarget, filter.search)) return false
          if (filter.categories.length > 0 && !product.categories.some((c) => filter.categories.includes(c))) return false
          if (filter.ratings.length > 0 && !(filter.ratings as RatingLabel[]).includes(product.ratingLabel)) return false
          const price = parsePrice(product.price)
          if (price < filter.minPrice || price > filter.maxPrice) return false
          return true
        }),
    [products, toolbarSearch, filter],
  )
}

export function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [advancedFilter, setAdvancedFilter] = useState<ProductFilterState>(DEFAULT_PRODUCT_FILTER)
  const [filterOpen, setFilterOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)

  const filteredProducts = useFilteredProducts(search, advancedFilter)
  const highlights = useProductHighlights(products)

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleSaveFilter(filters: ProductFilterState) {
    setAdvancedFilter(filters)
    setCurrentPage(1)
    if (isFilterActive(filters)) showNotice("Filtros aplicados")
  }

  function handleAdd(values: ProductFormValues) {
    addProduct(values)
    setIsAddModalOpen(false)
    showNotice("Produto adicionado")
  }

  function handleUpdate(values: ProductFormValues) {
    if (editingIndex === null) return
    updateProduct(editingIndex, values)
    setEditingIndex(null)
    showNotice("Produto atualizado")
  }

  function handleDelete(index: number) {
    const product = products[index]
    if (!product) return
    if (!window.confirm(`Apagar ${product.name}?`)) return
    deleteProduct(index)
    if (editingIndex === index) setEditingIndex(null)
    if (viewingIndex === index) setViewingIndex(null)
    showNotice("Produto apagado")
  }

  function handleDeleteFromModal() {
    if (editingIndex === null) return
    deleteProduct(editingIndex)
    setEditingIndex(null)
    showNotice("Produto apagado")
  }

  return (
    <PageShell title="Produtos">
      {highlights && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProductHighlightCard
            label="Produto mais vendido"
            metricLabel="Vendidos"
            metricValue={highlights.mostSold.sold.toLocaleString("pt-BR")}
            productName={highlights.mostSold.name}
            tone="emerald"
          />
          <ProductHighlightCard
            label="Melhor avaliado"
            metricLabel="NPS"
            metricValue={highlights.bestRated.rating}
            productName={highlights.bestRated.name}
            tone="emerald"
          />
          <ProductHighlightCard
            label="Menos vendido"
            metricLabel="Vendidos"
            metricValue={highlights.leastSold.sold.toLocaleString("pt-BR")}
            productName={highlights.leastSold.name}
            tone="amber"
          />
          <ProductHighlightCard
            label="Menor avaliado"
            metricLabel="NPS"
            metricValue={highlights.worstRated.rating}
            productName={highlights.worstRated.name}
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
          placeholder="Busque por um produto, código ou categoria"
          searchValue={search}
        />
        <ProductsTable
          currentPage={safePage}
          filteredCount={filteredProducts.length}
          onDeleteProduct={handleDelete}
          onEditProduct={setEditingIndex}
          onPageChange={setCurrentPage}
          onViewProduct={setViewingIndex}
          pageCount={pageCount}
          rows={paginatedProducts}
          totalCount={products.length}
        />
      </DataPanel>

      <ProductFilterModal
        open={filterOpen}
        initial={advancedFilter}
        onClose={() => setFilterOpen(false)}
        onSave={handleSaveFilter}
      />

      {isAddModalOpen && (
        <ProductFormModal onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} title="Adicionar produto" />
      )}
      {editingIndex !== null && (
        <ProductFormModal
          initialValues={products[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onDelete={handleDeleteFromModal}
          onSubmit={handleUpdate}
          productId={products[editingIndex].id}
          title="Editar produto"
        />
      )}
      {viewingIndex !== null && (
        <ProductDetailDialog
          product={products[viewingIndex]}
          onClose={() => setViewingIndex(null)}
          onEdit={() => {
            setEditingIndex(viewingIndex)
            setViewingIndex(null)
          }}
        />
      )}
    </PageShell>
  )
}
