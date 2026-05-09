import type { ClientRow, Metric, OrderRow, SupportRow, ProductRow } from "@/types"
import { Clock3, Smartphone, CircleDollarSign, Heart, MapPin, Smile, Tag, Users, TrendingUp, Star, TrendingDown, AlertCircle } from "lucide-react"

export interface ProductHighlightMetric {
  label: string
  value: string
  badgeLabel: string
  badgeValue: string
}

export const revenueData = [
  { day: "1",  lastMonth: 105, currentMonth: 68 },
  { day: "2",  lastMonth: 118, currentMonth: 75 },
  { day: "3",  lastMonth: 138, currentMonth: 82 },
  { day: "4",  lastMonth: 162, currentMonth: 88 },
  { day: "5",  lastMonth: 178, currentMonth: 92 },
  { day: "6",  lastMonth: 192, currentMonth: 98 },
  { day: "7",  lastMonth: 185, currentMonth: 105 },
  { day: "8",  lastMonth: 172, currentMonth: 115 },
  { day: "9",  lastMonth: 162, currentMonth: 122 },
  { day: "10", lastMonth: 148, currentMonth: 118 },
  { day: "11", lastMonth: 138, currentMonth: 110 },
  { day: "12", lastMonth: 128, currentMonth: 98 },
  { day: "13", lastMonth: 140, currentMonth: 88 },
  { day: "14", lastMonth: 152, currentMonth: 82 },
  { day: "15", lastMonth: 162, currentMonth: 88 },
  { day: "16", lastMonth: 175, currentMonth: 95 },
  { day: "17", lastMonth: 170, currentMonth: 102 },
  { day: "18", lastMonth: 162, currentMonth: 108 },
  { day: "19", lastMonth: 155, currentMonth: 115 },
  { day: "20", lastMonth: 148, currentMonth: 120 },
  { day: "21", lastMonth: 140, currentMonth: 118 },
  { day: "22", lastMonth: 135, currentMonth: 115 },
  { day: "23", lastMonth: 148, currentMonth: 122 },
  { day: "24", lastMonth: 160, currentMonth: 130 },
  { day: "25", lastMonth: 172, currentMonth: 140 },
  { day: "26", lastMonth: 182, currentMonth: 150 },
  { day: "27", lastMonth: 188, currentMonth: 158 },
  { day: "28", lastMonth: 192, currentMonth: 162 },
  { day: "29", lastMonth: 190, currentMonth: 160 },
  { day: "30", lastMonth: 185, currentMonth: 155 },
]

export function getDashboardMetrics(orders: OrderRow[], tickets: SupportRow[]): Metric[] {
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.value) || 0), 0)
  const revenueStr = totalRevenue >= 1_000_000 
    ? `R$ ${(totalRevenue / 1_000_000).toFixed(1)}M` 
    : `R$ ${Math.round(totalRevenue / 1_000)}K`

  const avgRating = tickets.length > 0
    ? (tickets.reduce((sum, t) => sum + t.rating, 0) / tickets.length).toFixed(1)
    : "0.0"

  return [
    { label: "Receita total", value: revenueStr, helper: "+20% vs mês anterior", tone: "rose", icon: CircleDollarSign },
    { label: "Taxa de satisfação", value: `${avgRating}/5.0`, helper: "NPS médio do período", tone: "emerald", icon: Smile },
    { label: "Total de pedidos", value: String(orders.length), helper: "Pedidos cadastrados", tone: "indigo", icon: Tag },
    { label: "Tickets resolvidos", value: String(tickets.length), helper: "Tickets no período", tone: "violet", icon: Heart },
  ]
}

export function getOrdersMetrics(orders: OrderRow[]): Metric[] {
  const pendingOrders = orders.filter((order) => order.status === "Processando").length
  const deliveredOrders = orders.filter((order) => order.status === "Entregue").length

  return [
    {
      label: "Pedidos pendentes",
      value: String(pendingOrders),
      helper: "Em processamento",
      tone: "indigo",
      icon: Users,
    },
    {
      label: "Total de pedidos",
      value: String(orders.length),
      helper: "Pedidos cadastrados",
      tone: "indigo",
      icon: Smile,
    },
    {
      label: "Receita total",
      value: "R$ 150.000,00",
      helper: "+ 20% vs mês anterior",
      tone: "rose",
      icon: CircleDollarSign,
    },
    {
      label: "Pedidos entregues",
      value: String(deliveredOrders),
      helper: "+ 47% vs último mês",
      tone: "emerald",
      icon: Heart,
    },
  ]
}

export function getDashboardInsights(orders: OrderRow[], clients: ClientRow[]) {
  const onTimeRate = orders.length > 0
    ? Math.round((orders.filter((o) => o.timeline === "No Prazo").length / orders.length) * 100)
    : 0

  const sales: Record<string, number> = {}
  orders.forEach(o => sales[o.product] = (sales[o.product] || 0) + o.quantity)
  const sortedSales = Object.entries(sales).sort(([, a], [, b]) => b - a)
  
  const regions: Record<string, number> = {}
  clients.forEach(c => {
    const city = c.location.split(",")[0]
    regions[city] = (regions[city] || 0) + 1
  })
  const topReg = Object.entries(regions).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—"

  return [
    { 
      label: "Pedidos no prazo", 
      value: `${onTimeRate}% entregues`, 
      helper: onTimeRate >= 75 ? "Ótimo" : "Atenção", 
      tone: (onTimeRate >= 75 ? "emerald" : "rose") as any, 
      icon: Clock3 
    },
    { 
      label: "Produto mais pedido", 
      value: sortedSales[0]?.[0] ?? "—", 
      helper: `${sortedSales[0]?.[1] ?? 0} unid. vendidas`, 
      tone: "indigo" as any, 
      icon: Smartphone 
    },
    { 
      label: "Top região", 
      value: topReg, 
      helper: "Maior volume de clientes", 
      tone: "violet" as any, 
      icon: MapPin 
    },
  ]
}

export function getClientsMetrics(clients: ClientRow[]): Metric[] {
  const newClients = clients.filter((c) => c.status === "Novo").length

  return [
    {
      label: "Total de clientes",
      value: "23.942",
      helper: "+ 3% vs mês anterior",
      tone: "indigo",
      icon: Users,
    },
    {
      label: "Novos clientes",
      value: String(newClients),
      helper: "Pedidos processados",
      tone: "indigo",
      icon: Tag,
    },
    {
      label: "Taxa de satisfação",
      value: "4.6 / 5.0",
      helper: "+ 12% NPS médio",
      tone: "emerald",
      icon: Smile,
    },
    {
      label: "Top região",
      value: "São Paulo, SP",
      helper: "28% da fatura total",
      tone: "violet",
      icon: MapPin,
    },
  ]
}

export function getSupportMetrics(tickets: SupportRow[]): Metric[] {
  const criticalTickets = tickets.filter((ticket) => ticket.ratingLabel === "Crítico").length

  return [
    {
      label: "Tickets resolvidos",
      value: String(tickets.length),
      helper: "+ 3% vs mês anterior",
      tone: "emerald",
      icon: Users,
    },
    {
      label: "Satisfação média",
      value: "4.6 / 5.0",
      helper: "+ 12% NPS médio",
      tone: "emerald",
      icon: Smile,
    },
    {
      label: "Tickets críticos",
      value: String(criticalTickets),
      helper: "Atenção prioritária",
      tone: "rose",
      icon: Users,
    },
    {
      label: "Resolvidos hoje",
      value: String(tickets.length),
      helper: "Tickets",
      tone: "violet",
      icon: Heart,
    },
  ]
}

export function getProductsMetrics(products: ProductRow[]): Metric[] {
  if (products.length === 0) return []

  const mostSold = products.reduce((a, b) => (a.sold > b.sold ? a : b))
  const leastSold = products.reduce((a, b) => (a.sold < b.sold ? a : b))
  const bestRated = products.reduce((a, b) => (a.rating > b.rating ? a : b))
  const worstRated = products.reduce((a, b) => (a.rating < b.rating ? a : b))

  return [
    {
      label: "Produto mais vendido",
      value: mostSold.name,
      helper: `${mostSold.sold.toLocaleString("pt-BR")} vendidos`,
      tone: "emerald",
      icon: TrendingUp,
    },
    {
      label: "Melhor avaliado",
      value: bestRated.name,
      helper: `NPS de ${bestRated.rating.toFixed(1)}`,
      tone: "indigo",
      icon: Star,
    },
    {
      label: "Menos vendido",
      value: leastSold.name,
      helper: `${leastSold.sold.toLocaleString("pt-BR")} vendidos`,
      tone: "rose",
      icon: TrendingDown,
    },
    {
      label: "Menor avaliado",
      value: worstRated.name,
      helper: `NPS de ${worstRated.rating.toFixed(1)}`,
      tone: "rose",
      icon: AlertCircle,
    },
  ]
}