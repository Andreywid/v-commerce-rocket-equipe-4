import type { OrderRow, PageKey, SupportRow } from "@/types"
import { normalizeText } from "@/lib/utils"

export function getAssistantSummary(currentPage: PageKey, orders: OrderRow[], tickets: SupportRow[]): string {
  const pendingOrders = orders.filter((order) => order.status === "Processando").length
  const transitOrders = orders.filter((order) => order.status === "Em trânsito").length
  const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico").length

  if (currentPage === "orders") {
    return `Você tem ${orders.length} pedidos cadastrados. ${pendingOrders} estão em processamento e ${transitOrders} estão em trânsito.`
  }

  if (currentPage === "support") {
    return `Você tem ${tickets.length} tickets cadastrados. ${criticalTickets} precisam de atenção crítica.`
  }

  return `Resumo geral: ${orders.length} pedidos, ${tickets.length} tickets e ${criticalTickets} ticket(s) críticos no suporte.`
}

export function getAssistantAnswer(
  question: string,
  currentPage: PageKey,
  orders: OrderRow[],
  tickets: SupportRow[],
): string {
  const normalizedQuestion = normalizeText(question)

  if (!normalizedQuestion) {
    return getAssistantSummary(currentPage, orders, tickets)
  }

  if (normalizedQuestion.includes("pedido") || normalizedQuestion.includes("venda")) {
    const deliveredOrders = orders.filter((order) => order.status === "Entregue").length
    const canceledOrders = orders.filter((order) => order.status === "Cancelado").length
    return `Pedidos: ${orders.length} no total, ${deliveredOrders} entregues e ${canceledOrders} cancelados. Use o filtro de status para isolar cada grupo.`
  }

  if (normalizedQuestion.includes("ticket") || normalizedQuestion.includes("suporte")) {
    const refundTickets = tickets.filter((ticket) => ticket.type === "Reembolso").length
    const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico").length
    return `Suporte: ${tickets.length} tickets no total, ${refundTickets} sobre reembolso e ${criticalTickets} críticos. Tickets críticos merecem prioridade.`
  }

  if (normalizedQuestion.includes("critico") || normalizedQuestion.includes("problema")) {
    const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico")
    return criticalTickets.length
      ? `Encontrei ${criticalTickets.length} ticket(s) críticos. O primeiro é ${criticalTickets[0].ticket}, do cliente ${criticalTickets[0].customer}.`
      : "Não há tickets críticos agora."
  }

  return getAssistantSummary(currentPage, orders, tickets)
}
