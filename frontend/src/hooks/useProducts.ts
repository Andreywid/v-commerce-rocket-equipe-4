import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { ProductCreate, ProductListResponse, ProductOut, ProductPerformance, ProductUpdate, ReviewListResponse } from "@/types/api"

export type ProductFilters = {
  categorias?: string[]
  ativo?: boolean
  nome?: string
  preco_min?: number
  preco_max?: number
  sort_by?: string
  order?: string
}

export function useProducts(filters: ProductFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.categorias?.length) filters.categorias.forEach((c) => params.append("categoria", c))
  if (filters.ativo !== undefined) params.set("ativo", String(filters.ativo))
  if (filters.nome) params.set("nome", filters.nome)
  if (filters.preco_min != null) params.set("preco_min", String(filters.preco_min))
  if (filters.preco_max != null) params.set("preco_max", String(filters.preco_max))
  if (filters.sort_by) params.set("sort_by", filters.sort_by)
  if (filters.order) params.set("order", filters.order)

  return useQuery({
    queryKey: ["products", filters, page, size],
    queryFn: () => api.get<ProductListResponse>(`/products?${params}`),
    placeholderData: keepPreviousData,
  })
}

export function useProductPerformance(id: string | null) {
  return useQuery({
    queryKey: ["product-perf", id],
    queryFn: () => api.get<ProductPerformance>(`/products/${id}/performance`),
    enabled: id !== null,
    staleTime: 3 * 60 * 1000,
  })
}

export function useProductReviews(id: string | null, page = 1) {
  return useQuery({
    queryKey: ["product-reviews", id, page],
    queryFn: () => api.get<ReviewListResponse>(`/products/${id}/avaliacoes?page=${page}&size=20`),
    enabled: id !== null,
  })
}

export function useProductMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["products"] })

  const create = useMutation({
    mutationFn: (data: ProductCreate) => api.post<ProductOut>("/products", data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      api.put<ProductOut>(`/products/${id}`, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
