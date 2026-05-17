import type { Metric, MetricTone } from "@/types"
import type { VendasKPIMes } from "@/types/api"
import { CircleDollarSign, Clock3, MapPin, Smartphone, Tag, Users } from "lucide-react"

export type PerformanceLabel = "Ótimo" | "Bom" | "Regular" | "Crítico"

function getPerformance(rate: number): { label: PerformanceLabel; tone: MetricTone } {
  if (rate >= 90) return { label: "Ótimo",    tone: "emerald" }
  if (rate >= 75) return { label: "Bom",      tone: "indigo"  }
  if (rate >= 60) return { label: "Regular",  tone: "violet"  }
  return              { label: "Crítico",  tone: "rose"    }
}

const MONTH_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

export function formatMesLabel(ano_mes: string): string {
  const [ano, mes] = ano_mes.split("-")
  return `${MONTH_ABBR[parseInt(mes) - 1]}/${ano.slice(2)}`
}

export function getKpiCards(mes: VendasKPIMes): Metric[] {
  const receita =
    mes.receita_bruta >= 1_000_000
      ? `R$ ${(mes.receita_bruta / 1_000_000).toFixed(1)}M`
      : `R$ ${Math.round(mes.receita_bruta / 1_000)}K`

  return [
    {
      label: "Receita bruta",
      value: receita,
      helper: `Referência: ${formatMesLabel(mes.ano_mes)}`,
      tone: "rose",
      icon: CircleDollarSign,
    },
    {
      label: "Total de pedidos",
      value: mes.qtd_pedidos.toLocaleString("pt-BR"),
      helper: `${mes.taxa_aprovacao.toFixed(1)}% aprovados`,
      tone: "indigo",
      icon: Tag,
    },
    {
      label: "Clientes únicos",
      value: mes.qtd_clientes_unicos.toLocaleString("pt-BR"),
      helper: `+${mes.qtd_clientes_novos} novos no mês`,
      tone: "violet",
      icon: Users,
    },
    {
      label: "Ticket médio",
      value: `R$ ${mes.ticket_medio.toFixed(2).replace(".", ",")}`,
      helper: `${mes.taxa_recusa.toFixed(1)}% de recusa`,
      tone: "emerald",
      icon: CircleDollarSign,
    },
  ]
}

export function getKpiInsights(mes: VendasKPIMes): Metric[] {
  const perf = getPerformance(mes.taxa_aprovacao)
  const regionPct = mes.qtd_pedidos > 0
    ? Math.round((mes.qtd_pedidos_aprovados / mes.qtd_pedidos) * 100)
    : 0

  return [
    {
      label: "Pedidos no prazo",
      value: `${mes.taxa_aprovacao.toFixed(1).replace(".", ",")}%`,
      helper: perf.label,
      tone: perf.tone,
      icon: Clock3,
    },
    {
      label: "Produto mais vendido",
      value: mes.categoria_mais_vendida,
      helper: `${mes.qtd_pedidos_aprovados.toLocaleString("pt-BR")} unidades`,
      tone: "emerald",
      icon: Smartphone,
    },
    {
      label: "Top região",
      value: mes.estado_maior_receita,
      helper: `${regionPct}% da receita total`,
      tone: "emerald",
      icon: MapPin,
    },
  ]
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
