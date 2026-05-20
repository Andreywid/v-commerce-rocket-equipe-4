import type { LucideIcon } from "lucide-react"

export type PageKey = "dashboard" | "orders" | "support"
export type MetricTone = "rose" | "emerald" | "indigo" | "violet"
export type OrderStatus = "Aprovado" | "Recusado" | "Reembolsado" | "Processando"
export type SupportType = "Entrega" | "Reembolso" | "Produto" | "Pagamento"
export type SupportStatus = "Aberto" | "Resolvido"
export type SatisfacaoAtendimento = "alta" | "media" | "baixa" | "sem_avaliacao"
export type RatingLabel = "Ótimo" | "Bom" | "Excelente" | "Crítico"
export type ProductCategory =
  | "Eletronicos"
  | "Vestuario"
  | "Casa"
  | "Esportes"
  | "Beleza"
  | "Automotivo"
  | "Brinquedos"
  | "Moveis"
  | "Sem categoria"
export type ProductClassificacao = "Top Vendedor" | "Estável" | "Problemático" | "Encalhado"
export type ClientSegmento = "Alto" | "Medio" | "Baixo"
export type ClienteStatus = "Novo" | "Recorrente"
export type ReviewSentimento = "positivo" | "neutro" | "negativo"
export type MetodoPagamento = "Cartao" | "PIX" | "Boleto" | "App"

export type NavItem = {
  id: PageKey
  label: string
  icon: LucideIcon
}

export type Metric = {
  label: string
  value: string
  helper: string
  tone: MetricTone
  icon: LucideIcon
}

export type FilterValue<T extends string> = "Todos" | T
export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: Date
  source?: string | null
  isError?: boolean
}
