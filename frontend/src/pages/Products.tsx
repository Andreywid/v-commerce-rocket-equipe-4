import { useMemo, useState } from "react"
import { Eye, Package, Pencil } from "lucide-react"

import type { FilterValue, ProductCategory, ProductFormValues, ProductRow } from "@/types"
import { productCategoryOptions } from "@/mocks/products"
import { useAppContext } from "@/context/AppContext"
import { getProductsMetrics } from "@/helpers/metrics"
import { rowIncludes } from "@/helpers/storage"
import { Button } from "@/components/ui/button"
import { DataPanel } from "@/components/shared/DataPanel"
import { PageShell } from "@/components/shared/PageShell"
import { ProductFormModal } from "@/components/shared/ProductFormModal"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { TableRow, TableCell } from "@/components/shared/Table"
import { TableToolbar } from "@/components/shared/TableToolbar"
import { DataTable, type Columns } from "@/components/shared/DataTable"
import { useTableSort } from "@/hooks/useTableSort"
import { useTableFilters } from "@/hooks/useTableFilter"
import { RatingBadge } from "@/components/shared/RatingBadge"
import { DataCard, DataGrid } from "@/components/shared/MetricCards"
import { ProductDetailDialog, categoryClasses } from "@/components/shared/ProductDetailDialog"

const PAGE_SIZE = 5

function useFilteredProducts(search: string, categoryFilter: FilterValue<ProductCategory>) {
  const { products } = useAppContext()
  return useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = rowIncludes(
          { 
            name: product.name, 
            id: product.id, 
            price: product.price.toString(), 
            categories: product.categories.join(" ") 
          },
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [viewingIndex, setViewingIndex] = useState<number | null>(null)
  const { search, filterValue, currentPage, setCurrentPage, handleSearchChange, handleFilterChange } = useTableFilters<ProductCategory>()
  const filteredProducts = useFilteredProducts(search, filterValue)
  const metrics = getProductsMetrics(products)

  const { sortedData, sortConfig, handleSort } = useTableSort(
    filteredProducts, 
    (item, key) => item[key as keyof ProductRow]
  )

  const pageCount = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, pageCount)
  const paginatedProducts = sortedData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const columns: Columns<ProductRow>[] = [
    { label: "Produto", className: "w-[240px] pl-10", sortable: true, accessorKey: "name" },
    { label: "Código", className: "w-[130px]", sortable: true, accessorKey: "id" },
    { label: "Categoria", className: "w-[190px]", accessorKey: "categories" },
    { label: "Preço", className: "w-[130px] text-right pr-8", sortable: true, accessorKey: "price" },
    { label: "Estoque", className: "w-[120px] text-center", sortable: true, accessorKey: "stock" },
    { label: "Avaliação", className: "w-[140px] text-center pr-10", sortable: true, accessorKey: "rating" },
    { label: "Ações", className: "w-[90px] pl-5" },
  ]

  function handleAdd(values: ProductFormValues) {
    addProduct(values)
    setIsAddModalOpen(false)
    showNotice("Produto adicionado com sucesso!")
  }

  function handleUpdate(values: ProductFormValues) {
    if (editingIndex === null) return
    updateProduct(editingIndex, values)
    setEditingIndex(null)
    showNotice("Produto atualizado com sucesso!")
  }

  return (
    <PageShell title="Produtos">
      <DataGrid>
        {metrics.map((m) => (
          <DataCard
            key={m.label}
            label={m.label}
            value={m.value}
            helper={m.helper}
            tone={m.tone}
            icon={m.icon}
          />
        ))}
      </DataGrid>
      <DataPanel>
        <TableToolbar
          actionLabel="Adicionar produto"
          filterLabel="Categoria"
          filterOptions={["Todos", ...productCategoryOptions]}
          filterValue={filterValue}
          icon={Package}
          label="Lista de produtos"
          onAction={() => setIsAddModalOpen(true)}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          searchValue={search}
          placeholder="Busque por um produto, código ou categoria"
        />
        <DataTable
          columns={columns}
          data={paginatedProducts}
          currentPage={safePage}
          onPageChange={setCurrentPage}
          filteredCount={filteredProducts.length}
          pageCount={pageCount}
          totalCount={products.length}
          onSort={handleSort}
          sortConfig={sortConfig}
          renderRow={(product) => (
            <TableRow key={product.id} className="h-[58px] border-slate-100 text-sm text-slate-700">
              <TableCell className="pl-10 font-semibold text-slate-800">{product.name}</TableCell>
              <TableCell className="font-medium text-slate-400">{product.id}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {product.categories.map((cat) => (
                    <StatusBadge key={cat} className={categoryClasses[cat]}>{cat}</StatusBadge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right pr-8 font-medium">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.price)}
              </TableCell>
              <TableCell className="text-center">{product.stock}</TableCell>
              <TableCell className="text-center pr-10">
                <RatingBadge rating={product.rating} />
              </TableCell>
              <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={() => setViewingIndex(products.findIndex(p => p.id === product.id))}
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-sm" 
                      onClick={() => setEditingIndex(products.findIndex(p => p.id === product.id))}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                </TableCell>
            </TableRow>
          )}
        />
      </DataPanel>

      {isAddModalOpen && <ProductFormModal onClose={() => setIsAddModalOpen(false)} onSubmit={handleAdd} title="Adicionar produto" />}
      
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