import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { TicketCreate, TicketListResponse, TicketOut, TicketUpdate } from "@/types/api"

export type SupportFilters = {
  id_cliente?: string
  tipos?: string[]
  statuses?: string[]
  sla_estourado?: boolean
  data_abertura?: string
  nome?: string
  satisfacoes?: string[]
}

export function useSupport(filters: SupportFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.id_cliente) params.set("id_cliente", String(filters.id_cliente))
  if (filters.tipos?.length) filters.tipos.forEach((t) => params.append("tipo", t))
  if (filters.statuses?.length) filters.statuses.forEach((s) => params.append("status", s))
  if (filters.satisfacoes?.length) filters.satisfacoes.forEach((s) => params.append("satisfacao", s))
  if (filters.sla_estourado !== undefined) params.set("sla_estourado", String(filters.sla_estourado))
  if (filters.data_abertura) params.set("data_abertura", filters.data_abertura)
  if (filters.nome) params.set("nome", filters.nome)

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

export function useSupportMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["support"] })

  const create = useMutation({
    mutationFn: (data: TicketCreate) => api.post<TicketOut>("/support", data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TicketUpdate }) =>
      api.put<TicketOut>(`/support/${id}`, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/support/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
