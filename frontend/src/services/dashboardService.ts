import { api } from "@/services/api"
import type { KPIsResponse } from "@/types/dashboard"

export async function fetchKpis(periodo = "12m"): Promise<KPIsResponse> {
  return api.get<KPIsResponse>(`/dashboard/kpis?periodo=${periodo}`)
}
