import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { KPIsResponse, TopRegioesResponse, TopCategoriasResponse } from "@/types/api"

export function useKpis(periodo: "3m" | "6m" | "12m" | "all" = "12m") {
  return useQuery({
    queryKey: ["kpis", periodo],
    queryFn: () => api.get<KPIsResponse>(`/dashboard/kpis?periodo=${periodo}`),
    staleTime: 5 * 60 * 1000,
  })
}

export function useTopRegioes() {
  return useQuery({
    queryKey: ["dashboard", "top-regioes"],
    queryFn: () => api.get<TopRegioesResponse>("/dashboard/top-regioes"),
    staleTime: 10 * 60 * 1000,
  })
}

export function useTopCategorias() {
  return useQuery({
    queryKey: ["dashboard", "top-categorias"],
    queryFn: () => api.get<TopCategoriasResponse>("/dashboard/top-categorias"),
    staleTime: 10 * 60 * 1000,
  })
}
