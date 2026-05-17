import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { ProductCreate, ProductListResponse, ProductOut, ProductPerformance, ProductUpdate, ReviewListResponse } from "@/types/api"

export type ProductFilters = {
  categoria?: string
  ativo?: boolean
  nome?: string
}

export function useProducts(filters: ProductFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.categoria) params.set("categoria", filters.categoria)
  if (filters.ativo !== undefined) params.set("ativo", String(filters.ativo))
  if (filters.nome) params.set("nome", filters.nome)

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
