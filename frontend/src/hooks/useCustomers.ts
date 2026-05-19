import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { Customer360, CustomerCreate, CustomerListResponse, CustomerOut, CustomerStats, CustomerUpdate, ReviewListResponse } from "@/types/api"

export type CustomerFilters = {
  nome?: string
  email?: string
  estados?: string[]
  segmentos?: string[]
  is_recorrente?: boolean
  min_total?: number
  max_total?: number
}

export function useCustomers(filters: CustomerFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.nome) params.set("nome", filters.nome)
  if (filters.email) params.set("email", filters.email)
  if (filters.estados?.length) filters.estados.forEach((e) => params.append("estado", e))
  if (filters.segmentos?.length) filters.segmentos.forEach((s) => params.append("segmento", s))
  if (filters.is_recorrente !== undefined) params.set("is_recorrente", String(filters.is_recorrente))
  if (filters.min_total !== undefined) params.set("min_total", String(filters.min_total))
  if (filters.max_total !== undefined) params.set("max_total", String(filters.max_total))

  return useQuery({
    queryKey: ["customers", filters, page, size],
    queryFn: () => api.get<CustomerListResponse>(`/customers?${params}`),
  })
}

export function useCustomer360(id: string | null) {
  return useQuery({
    queryKey: ["customer360", id],
    queryFn: () => api.get<Customer360>(`/customers/${id}/perfil-360`),
    enabled: id !== null,
  })
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ["customerStats"],
    queryFn: () => api.get<CustomerStats>("/customers/stats"),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCustomerReviews(id: string | null, page = 1, size = 5) {
  return useQuery({
    queryKey: ["customerReviews", id, page, size],
    queryFn: () => api.get<ReviewListResponse>(`/customers/${id}/avaliacoes?page=${page}&size=${size}`),
    enabled: id !== null,
  })
}

export function useCustomerMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] })

  const create = useMutation({
    mutationFn: (data: CustomerCreate) => api.post<CustomerOut>("/customers", data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      api.put<CustomerOut>(`/customers/${id}`, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
