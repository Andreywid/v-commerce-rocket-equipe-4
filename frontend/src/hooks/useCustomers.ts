import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { Customer360, CustomerListResponse } from "@/types/api"

export type CustomerFilters = {
  nome?: string
  email?: string
  estado?: string
  segmento?: string
}

export function useCustomers(filters: CustomerFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.nome) params.set("nome", filters.nome)
  if (filters.email) params.set("email", filters.email)
  if (filters.estado) params.set("estado", filters.estado)
  if (filters.segmento) params.set("segmento", filters.segmento)

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
