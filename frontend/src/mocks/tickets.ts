import type { RatingLabel, SupportFormValues, SupportRow, SupportType } from "@/types"

export const supportStorageKey = "v-commerce-support-tickets"

export const supportTypeOptions: SupportType[] = ["Pagamento", "Atraso", "Reembolso"]
export const ratingLabelOptions: RatingLabel[] = ["Ótimo", "Bom", "Excelente", "Crítico"]

export const initialSupportTickets: SupportRow[] = [
  {
    ticket: "TCK-0001",
    customer: "Maria Silva",
    type: "Pagamento",
    createdAt: new Date("2026-04-28T10:00:00"),
    resolvedIn: "2h",
    rating: 4.5,
    ratingLabel: "Ótimo",
    timeline: "No Prazo",
  },
  {
    ticket: "TCK-0002",
    customer: "João Souza",
    type: "Pagamento",
    createdAt: new Date("2026-04-28T14:30:00"),
    resolvedIn: "4h",
    rating: 4.0,
    ratingLabel: "Bom",
    timeline: "No Prazo",
  },
  {
    ticket: "TCK-0003",
    customer: "Ana Costa",
    type: "Atraso",
    createdAt: new Date("2026-04-29T09:15:00"),
    resolvedIn: "24h",
    rating: 4.5,
    ratingLabel: "Ótimo",
    timeline: "No Prazo",
  },
  {
    ticket: "TCK-0004",
    customer: "Carlos Lima",
    type: "Reembolso",
    createdAt: new Date("2026-04-30T11:00:00"),
    resolvedIn: "53h",
    rating: 4.1,
    ratingLabel: "Bom",
    timeline: "Fora do Prazo",
  },
  {
    ticket: "TCK-0005",
    customer: "Beatriz Oliveira",
    type: "Reembolso",
    createdAt: new Date("2026-05-01T16:20:00"),
    resolvedIn: "12h",
    rating: 4.7,
    ratingLabel: "Excelente",
    timeline: "Fora do Prazo",
  },
  {
    ticket: "TCK-0006",
    customer: "Ricardo Santos",
    type: "Atraso",
    createdAt: new Date("2026-05-02T08:45:00"),
    resolvedIn: "72h",
    rating: 3.9,
    ratingLabel: "Crítico",
    timeline: "No Prazo",
  },
]

export const emptySupportForm: SupportFormValues = {
  customer: "",
  type: "Pagamento",
  createdAt: new Date(), 
  resolvedIn: "",
  rating: 0, 
  ratingLabel: "Bom",
  timeline: "No Prazo", 
}