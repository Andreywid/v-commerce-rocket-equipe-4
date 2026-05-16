import { useMemo, useState } from "react"
import { Eye, Package, Pencil, Trash2 } from "lucide-react"

import type { ProductCategory, ProductFormValues, ProductRow, RatingLabel } from "@/types"
import { getProductImage } from "@/mocks/productImages"
import { useAppContext } from "@/context/AppContext"
import { rowIncludes } from "@/helpers/storage"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DataPanel } from "@/components/shared/DataPanel"
import { PageShell } from "@/components/shared/PageShell"
import { ProductFormModal } from "@/components/shared/ProductFormModal"
import { ProductFilterModal, type ProductFilterState, DEFAULT_PRODUCT_FILTER } from "@/components/shared/ProductFilterModal"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { EmptyTableState, TableHead, TableBody, TableHeader, TableRow, TableCell, TablePagination } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"

const PAGE_SIZE = 5

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

function parsePrice(price: string): number {
  return parseFloat(price.replace(/[R$\s.]/g, "").replace(",", ".")) || 0
}

function isFilterActive(filter: ProductFilterState): boolean {
  return filter.search !== "" || filter.categories.length > 0 || filter.ratings.length > 0 || filter.minPrice > 0 || filter.maxPrice < 100_000
}

function getProductImagePosition(product: ProductRow) {
  if (product.id === "PROD-0002") return "object-[center_28%]"
  return "object-center"
}

function getProductImageFit() {
  return "object-cover"
}

function getProductDescription(product: ProductRow) {
  if (product.name.toLowerCase().includes("perfume")) {
    return "Uma fragrÃ¢ncia sofisticada que traduz elegÃ¢ncia e presenÃ§a em cada detalhe. Com notas de saÃ­da frescas e envolventes, evolui para um coraÃ§Ã£o floral marcante, finalizando com acordes amadeirados que permanecem na pele por horas. Desenvolvido para quem busca mais do que um perfume, mas uma assinatura Ãºnica, capaz de transformar momentos em experiÃªncias memorÃ¡veis."
  }

  return "Produto cadastrado no catÃ¡logo V-Commerce com acompanhamento de estoque, preÃ§o, vendas e avaliaÃ§Ã£o para apoiar decisÃµes comerciais."
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

function ProductDetailDialog({
  onClose,
  onEdit,
  product,
}: {
  onClose: () => void
  onEdit: () => void
  product: ProductRow
}) {
  const imageSrc = getProductImage(product)

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[82dvh] overflow-hidden sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-indigo-600">Detalhes do produto</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative h-36 overflow-hidden rounded-lg bg-slate-50 sm:h-40">
            {imageSrc ? (
              <img
                alt={product.name}
                className={`h-full w-full ${getProductImageFit()} ${getProductImagePosition(product)}`}
                src={imageSrc}
              />
            ) : (
              <div className="h-full bg-[linear-gradient(135deg,#f8fafc_0%,#fed7aa_38%,#f97316_39%,#fb923c_56%,#f8fafc_57%)]" />
            )}
            <span className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-orange-600 shadow-sm">
              {product.categories[0]}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
              {Math.max(12, product.sold % 120)} avaliaÃ§Ãµes positivas
            </span>
            <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-500 ring-1 ring-rose-200">
              {Math.max(4, product.stock % 40)} avaliaÃ§Ãµes negativas
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_160px]">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{product.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-400">{product.id}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {product.categories.map((cat) => (
                  <StatusBadge key={cat} className={categoryClasses[cat]}>{cat}</StatusBadge>
                ))}
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-lg font-bold text-slate-700">{product.price}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">Qt. no estoque: {product.stock}</p>
              <div className="mt-2 flex md:justify-end">
                <StatusBadge className={ratingClasses[product.ratingLabel]}>
                  {product.rating} {product.ratingLabel}
                </StatusBadge>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">DescriÃ§Ã£o</p>
            <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-600">{getProductDescription(product)}</p>
          </div>
        </div>

        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} type="button">Fechar</Button>
          <Button onClick={onEdit} type="button">Editar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
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
      <table className="min-w-[900px] w-full table-fixed text-left">
        <TableHeader>
          <TableRow className="h-12 border-slate-200 text-sm text-slate-950 hover:bg-transparent">
            <TableHead className="w-[200px] pl-5">Produto</TableHead>
            <TableHead className="w-[120px]">CÃ³digo</TableHead>
            <TableHead className="w-[220px]">Categoria</TableHead>
            <TableHead sortable className="w-[140px]">PreÃ§o</TableHead>
            <TableHead className="w-[100px]">Estoque</TableHead>
            <TableHead sortable className="w-[150px]">AvaliaÃ§Ã£o</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ product: row, index }) => (
            <TableRow key={row.id} className="h-[58px] border-slate-100 text-sm text-slate-700">
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
                    <StatusBadge key={cat} className={categoryClasses[cat]}>
                      {cat}
                    </StatusBadge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="font-medium">{row.price}</TableCell>
              <TableCell>{row.stock}</TableCell>
              <TableCell>
                <StatusBadge className={ratingClasses[row.ratingLabel]}>
                  {row.rating} {row.ratingLabel}
                </StatusBadge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-slate-400 hover:text-indigo-600"
                    onClick={() => onViewProduct(index)}
                    type="button"
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-slate-400 hover:text-indigo-600"
                    onClick={() => onEditProduct(index)}
                    type="button"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-slate-400 hover:text-rose-600"
                    onClick={() => onDeleteProduct(index)}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </Button>
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
          if (filter.categories.length > 0 && !product.categories.some((category) => filter.categories.includes(category))) return false
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

  return (
    <PageShell title="Produtos">
      {highlights && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          advancedFilterActive={isFilterActive(advancedFilter)}
          icon={Package}
          label="Lista de produtos"
          onAction={() => setIsAddModalOpen(true)}
          onAdvancedFilter={() => setFilterOpen(true)}
          onSearchChange={handleSearchChange}
          placeholder="Busque por um produto, cÃ³digo ou categoria"
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
          onSubmit={handleUpdate}
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
