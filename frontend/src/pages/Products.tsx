import { useMemo, useState } from "react"
import { Package } from "lucide-react"

import type { FilterValue, ProductCategory, ProductFormValues, ProductRow, RatingLabel } from "@/types"
import { productCategoryOptions } from "@/mocks/products"
import { useAppContext } from "@/context/AppContext"
import { rowIncludes } from "@/helpers/storage"
import { DataPanel } from "@/components/shared/DataPanel"
import { PageShell } from "@/components/shared/PageShell"
import { ProductFormModal } from "@/components/shared/ProductFormModal"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const categoryClasses: Record<ProductCategory, string> = {
  Perfumaria: "bg-violet-50 text-violet-600 ring-violet-200",
  Artes: "bg-sky-50 text-sky-600 ring-sky-200",
  Esporte: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  Lazer: "bg-amber-50 text-amber-600 ring-amber-200",
  Bebês: "bg-pink-50 text-pink-600 ring-pink-200",
  "Utilidades domésticas": "bg-orange-50 text-orange-600 ring-orange-200",
  "Instrumentos Musicais": "bg-indigo-50 text-indigo-600 ring-indigo-200",
  Tecnologia: "bg-cyan-50 text-cyan-600 ring-cyan-200",
}

const ratingClasses: Record<RatingLabel, string> = {
  Ótimo: "bg-amber-50 text-amber-500 ring-amber-200",
  Bom: "bg-indigo-50 text-indigo-500 ring-indigo-200",
  Excelente: "bg-emerald-50 text-emerald-500 ring-emerald-200",
  Crítico: "bg-rose-50 text-rose-500 ring-rose-200",
}

function ProductHighlightCard({
  label,
  metricLabel,
  metricValue,
  productName,
}: {
  label: string
  metricLabel: string
  metricValue: string
  productName: string
}) {
  return (
    <article className="flex min-h-[80px] flex-col justify-between rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-indigo-600">{label}</p>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400">{metricLabel}</span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">{metricValue}</span>
        </div>
      </div>
      <p className="mt-2 text-base font-bold leading-tight text-slate-900">{productName}</p>
    </article>
  )
}

function useProductHighlights(products: ProductRow[]) {
  return useMemo(() => {
    if (products.length === 0) return null
    const mostSold = products.reduce((a, b) => (a.sold > b.sold ? a : b))
    const leastSold = products.reduce((a, b) => (a.sold < b.sold ? a : b))
    const bestRated = products.reduce((a, b) => (parseFloat(a.rating) > parseFloat(b.rating) ? a : b))
    const worstRated = products.reduce((a, b) => (parseFloat(a.rating) < parseFloat(b.rating) ? a : b))
    return { mostSold, leastSold, bestRated, worstRated }
  }, [products])
}

type FilteredProduct = { product: ProductRow; index: number }

function ProductsTable({
  onEditProduct,
  rows,
  totalCount,
}: {
  onEditProduct: (index: number) => void
  rows: FilteredProduct[]
  totalCount: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[900px] table-fixed text-left">
        <thead>
          <tr className="h-12 border-b border-slate-200 text-sm text-slate-950">
            <TableHead className="w-[200px] pl-5">Produto</TableHead>
            <TableHead className="w-[120px]">Código</TableHead>
            <TableHead className="w-[220px]">Categoria</TableHead>
            <TableHead sortable className="w-[140px]">Preço</TableHead>
            <TableHead className="w-[100px]">Estoque</TableHead>
            <TableHead sortable className="w-[150px]">Avaliação</TableHead>
            <TableHead className="w-[80px]" />
          </tr>
        </thead>
        <tbody>
          {rows.map(({ product: row, index }) => (
            <tr key={row.id} className="h-[58px] border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
              <td className="pl-5 font-semibold text-slate-800">{row.name}</td>
              <td className="font-medium text-slate-400">{row.id}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {row.categories.map((cat) => (
                    <StatusBadge key={cat} className={categoryClasses[cat]}>
                      {cat}
                    </StatusBadge>
                  ))}
                </div>
              </td>
              <td className="font-medium">{row.price}</td>
              <td>{row.stock}</td>
              <td>
                <StatusBadge className={ratingClasses[row.ratingLabel]}>
                  {row.rating} {row.ratingLabel}
                </StatusBadge>
              </td>
              <td>
                <button
                  className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-500"
                  onClick={() => onEditProduct(index)}
                  type="button"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyTableState message="Nenhum produto encontrado." />}
      <TablePagination filteredCount={rows.length} totalCount={totalCount} />
    </div>
  )
}

function useFilteredProducts(search: string, categoryFilter: FilterValue<ProductCategory>) {
  const { products } = useAppContext()
  return useMemo(
    () =>
      products
        .map((product, index) => ({ product, index }))
        .filter(({ product }) => {
          const matchesSearch = rowIncludes(
            { name: product.name, id: product.id, price: product.price, rating: product.rating, ratingLabel: product.ratingLabel, categories: product.categories.join(" ") },
            search,
          )
          const matchesCategory = categoryFilter === "Todos" || product.categories.includes(categoryFilter)
          return matchesSearch && matchesCategory
        }),
    [products, search, categoryFilter],
  )
}

export function ProductsPage() {
  const { products, addProduct, updateProduct, showNotice } = useAppContext()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<FilterValue<ProductCategory>>("Todos")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const filteredProducts = useFilteredProducts(search, categoryFilter)
  const highlights = useProductHighlights(products)

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

  return (
    <PageShell title="Produtos">
      {highlights && (
        <div className="grid gap-4 lg:grid-cols-4">
          <ProductHighlightCard
            label="Produto mais vendido"
            metricLabel="Vendidos"
            metricValue={highlights.mostSold.sold.toLocaleString("pt-BR")}
            productName={highlights.mostSold.name}
          />
          <ProductHighlightCard
            label="Melhor avaliado"
            metricLabel="NPS"
            metricValue={highlights.bestRated.rating}
            productName={highlights.bestRated.name}
          />
          <ProductHighlightCard
            label="Menos vendido"
            metricLabel="Vendidos"
            metricValue={highlights.leastSold.sold.toLocaleString("pt-BR")}
            productName={highlights.leastSold.name}
          />
          <ProductHighlightCard
            label="Menor avaliado"
            metricLabel="NPS"
            metricValue={highlights.worstRated.rating}
            productName={highlights.worstRated.name}
          />
        </div>
      )}

      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar produto"
          filterLabel="Categoria"
          filterOptions={["Todos", ...productCategoryOptions]}
          filterValue={categoryFilter}
          icon={Package}
          label="Lista de produtos"
          onAction={() => setIsAddModalOpen(true)}
          onFilterChange={(value) => setCategoryFilter(value as FilterValue<ProductCategory>)}
          onSearchChange={setSearch}
          placeholder="Busque por um produto, código ou categoria"
          searchValue={search}
        />
        <ProductsTable
          onEditProduct={setEditingIndex}
          rows={filteredProducts}
          totalCount={products.length}
        />
      </DataPanel>

      {isAddModalOpen && (
        <ProductFormModal onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} title="Adicionar produto" />
      )}
      {editingIndex !== null && (
        <ProductFormModal
          initialValues={products[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onSubmit={handleUpdate}
          title="Editar produto"
        />
      )}
    </PageShell>
  )
}
