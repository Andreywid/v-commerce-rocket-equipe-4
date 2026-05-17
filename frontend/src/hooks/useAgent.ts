import { useMutation, useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import type { ChatRequest, ChatResponse } from "@/types/api"

export function useAgentSuggestions() {
  return useQuery({
    queryKey: ["agent-suggestions"],
    queryFn: () => api.get<string[]>("/agent/suggestions"),
    staleTime: 10 * 60 * 1000,
  })
}

export function useAgentChat() {
  return useMutation({
    mutationFn: (payload: ChatRequest) => api.post<ChatResponse>("/agent/chat", payload),
  })
}
