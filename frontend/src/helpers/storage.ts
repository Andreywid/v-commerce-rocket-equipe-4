import type { ClientRow, OrderRow, ProductRow, SupportRow } from "@/types"
import { normalizeText } from "@/lib/utils"

export function readStoredRows<Row>(storageKey: string, fallback: Row[]): Row[] {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? (JSON.parse(stored) as Row[]) : fallback
  } catch {
    return fallback
  }
}

export function createOrderId(orders: OrderRow[]): string {
  return `PROD-${String(orders.length + 1).padStart(4, "0")}`
}

export function createTicketId(tickets: SupportRow[]): string {
  return `TCK-${String(tickets.length + 1).padStart(4, "0")}`
}

export function createProductId(products: ProductRow[]): string {
  return `PROD-${String(products.length + 1).padStart(4, "0")}`
}

export function createClientId(clients: ClientRow[]): string {
  return `CLI-${String(clients.length + 1).padStart(4, "0")}`
}

export function rowIncludes(row: Record<string, string>, search: string): boolean {
  const normalizedSearch = normalizeText(search.trim())
  if (!normalizedSearch) return true
  return Object.values(row).some((value) => normalizeText(value).includes(normalizedSearch))
}
