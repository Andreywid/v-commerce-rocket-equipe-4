import type { LucideIcon } from "lucide-react"

export type PageKey = "dashboard" | "orders" | "support"
export type MetricTone = "rose" | "emerald" | "indigo" | "violet"
export type OrderStatus = "Processando" | "Entregue" | "Cancelado" | "Em trânsito"
export type SupportType = "Pagamento" | "Atraso" | "Reembolso"
export type RatingLabel = "Ótimo" | "Bom" | "Excelente" | "Crítico"
export type ProductCategory =
  | "Perfumaria"
  | "Artes"
  | "Esporte"
  | "Lazer"
  | "Bebês"
  | "Utilidades domésticas"
  | "Instrumentos Musicais"
  | "Tecnologia"
export type ClientStatus = "Novo" | "Recorrente"

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

export type OrderPrazo = "No prazo" | "Fora do prazo"

export type OrderRow = {
  id: string
  product: string
  customer: string
  value: string
  stock: string
  date: string
  status: OrderStatus
  quantity: string
  prazo: OrderPrazo
}

export type SupportRow = {
  ticket: string
  customer: string
  type: SupportType
  createdAt: string
  resolvedIn: string
  rating: string
  ratingLabel: RatingLabel
}

export type ProductRow = {
  id: string
  name: string
  categories: ProductCategory[]
  imageUrl?: string
  price: string
  stock: number
  rating: string
  ratingLabel: RatingLabel
  sold: number
}

export type ClientRow = {
  id: string
  name: string
  location: string
  status: ClientStatus
  lastOrder: string
  orderCount: number
  total: string
}

export type OrderFormValues = Omit<OrderRow, "id">
export type SupportFormValues = Omit<SupportRow, "ticket">
export type ProductFormValues = Omit<ProductRow, "id">
export type ClientFormValues = Omit<ClientRow, "id">
export type FilterValue<T extends string> = "Todos" | T
export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
}
