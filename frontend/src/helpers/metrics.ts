import type { ClientRow, Metric, OrderRow, SupportRow } from "@/types"
import { CircleDollarSign, Heart, MapPin, Smile, Tag, Users } from "lucide-react"

export function getDashboardMetrics(orders: OrderRow[], tickets: SupportRow[]): Metric[] {
  return [
    {
      label: "Receita total",
      value: "R$ 150K",
      helper: "+20% vs mês anterior",
      tone: "rose",
      icon: CircleDollarSign,
    },
    {
      label: "Taxa de satisfação",
      value: "4.6/5.0",
      helper: "+12% NPS médio",
      tone: "emerald",
      icon: Smile,
    },
    {
      label: "Total de pedidos",
      value: String(orders.length),
      helper: "Pedidos cadastrados",
      tone: "indigo",
      icon: Tag,
    },
    {
      label: "Tickets resolvidos hoje",
      value: String(tickets.length),
      helper: "Tickets",
      tone: "violet",
      icon: Heart,
    },
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
      value: "R$ 150K",
      helper: "+20% vs mês anterior",
      tone: "rose",
      icon: CircleDollarSign,
    },
    {
      label: "Pedidos entregues",
      value: String(deliveredOrders),
      helper: "Concluídos",
      tone: "emerald",
      icon: Heart,
    },
  ]
}

export function getClientsMetrics(clients: ClientRow[]): Metric[] {
  const newClients = clients.filter((c) => c.status === "Novo").length

  return [
    {
      label: "Total de clientes",
      value: "23.942",
      helper: "+3% vs mês anterior",
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
      value: "4.6/5.0",
      helper: "+12% NPS médio",
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
      helper: "+3% vs mês anterior",
      tone: "emerald",
      icon: Users,
    },
    {
      label: "Satisfação média",
      value: "4.6/5.0",
      helper: "+12% NPS médio",
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
