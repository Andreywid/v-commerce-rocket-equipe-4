import type { RatingLabel, SupportFormValues, SupportRow, SupportType } from "@/types"

export const supportStorageKey = "v-commerce-support-tickets"

export const supportTypeOptions: SupportType[] = ["Pagamento", "Atraso", "Reembolso"]

export const ratingLabelOptions: RatingLabel[] = ["Ótimo", "Bom", "Excelente", "Crítico"]

export const initialSupportTickets: SupportRow[] = [
  {
    ticket: "TCK-0001",
    customer: "Nome do Cliente",
    type: "Pagamento",
    createdAt: "28/04/2026",
    resolvedIn: "2h",
    rating: "4.5",
    ratingLabel: "Ótimo",
  },
  {
    ticket: "TCK-0002",
    customer: "Nome do Cliente",
    type: "Pagamento",
    createdAt: "28/04/2026",
    resolvedIn: "4h",
    rating: "4.0",
    ratingLabel: "Bom",
  },
  {
    ticket: "TCK-0003",
    customer: "Nome do Cliente",
    type: "Atraso",
    createdAt: "29/04/2026",
    resolvedIn: "24h",
    rating: "4.5",
    ratingLabel: "Ótimo",
  },
  {
    ticket: "TCK-0004",
    customer: "Nome do Cliente",
    type: "Reembolso",
    createdAt: "30/04/2026",
    resolvedIn: "53h",
    rating: "4.1",
    ratingLabel: "Bom",
  },
  {
    ticket: "TCK-0005",
    customer: "Nome do Cliente",
    type: "Reembolso",
    createdAt: "01/05/2026",
    resolvedIn: "12h",
    rating: "4.7",
    ratingLabel: "Excelente",
  },
  {
    ticket: "TCK-0006",
    customer: "Nome do Cliente",
    type: "Atraso",
    createdAt: "02/05/2026",
    resolvedIn: "72h",
    rating: "3.9",
    ratingLabel: "Crítico",
  },
]

export const emptySupportForm: SupportFormValues = {
  customer: "",
  type: "Pagamento",
  createdAt: "",
  resolvedIn: "",
  rating: "",
  ratingLabel: "Bom",
}
