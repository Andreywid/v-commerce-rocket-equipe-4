import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { KPIsResponse } from "@/types/api"

export function useKpis(periodo: "3m" | "6m" | "12m" | "all" = "12m") {
  return useQuery({
    queryKey: ["kpis", periodo],
    queryFn: () => api.get<KPIsResponse>(`/dashboard/kpis?periodo=${periodo}`),
    staleTime: 5 * 60 * 1000,
  })
}
