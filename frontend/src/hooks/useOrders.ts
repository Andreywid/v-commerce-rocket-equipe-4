import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { OrderCreate, OrderUpdate, OrderListResponse, OrderOut } from "@/types/api"

export type OrderFilters = {
  statuses?: string[]
  categoria?: string
  estado?: string
  id_cliente?: string
  data_inicio?: string
  data_fim?: string
  nome?: string
  valor_min?: number
  valor_max?: number
}

export function useOrders(filters: OrderFilters = {}, page = 1, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (filters.statuses?.length) filters.statuses.forEach((s) => params.append("status", s))
  if (filters.categoria) params.set("categoria", filters.categoria)
  if (filters.estado) params.set("estado", filters.estado)
  if (filters.id_cliente) params.set("id_cliente", filters.id_cliente)
  if (filters.data_inicio) params.set("data_inicio", filters.data_inicio)
  if (filters.data_fim) params.set("data_fim", filters.data_fim)
  if (filters.nome) params.set("nome", filters.nome)
  if (filters.valor_min != null) params.set("valor_min", String(filters.valor_min))
  if (filters.valor_max != null) params.set("valor_max", String(filters.valor_max))

  return useQuery({
    queryKey: ["orders", filters, page, size],
    queryFn: () => api.get<OrderListResponse>(`/orders?${params}`),
  })
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get<OrderOut>(`/orders/${id}`),
    enabled: id !== null,
  })
}

export function useOrderMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"] })

  const create = useMutation({
    mutationFn: (data: OrderCreate) => api.post<OrderOut>("/orders", data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderUpdate }) =>
      api.put<OrderOut>(`/orders/${id}`, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/orders/${id}`),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
