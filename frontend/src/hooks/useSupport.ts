import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { TicketListResponse, TicketOut } from "@/types/api"

export type SupportFilters = {
  id_cliente?: string
  tipo?: string
  status?: string
  sla_estourado?: boolean
}

export function useSupport(filters: SupportFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.id_cliente) params.set("id_cliente", String(filters.id_cliente))
  if (filters.tipo) params.set("tipo", filters.tipo)
  if (filters.status) params.set("status", filters.status)
  if (filters.sla_estourado !== undefined) params.set("sla_estourado", String(filters.sla_estourado))

  return useQuery({
    queryKey: ["support", filters, page, size],
    queryFn: () => api.get<TicketListResponse>(`/support?${params}`),
  })
}

export function useSupportTicket(id: number | null) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api.get<TicketOut>(`/support/${id}`),
    enabled: id !== null,
  })
}
