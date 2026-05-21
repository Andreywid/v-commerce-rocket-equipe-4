import type { Metric, MetricTone } from "@/types"
import type { VendasKPIMes } from "@/types/api"
import { CircleDollarSign, Clock3, LayoutGrid, MapPin, Smartphone, Tag, Users } from "lucide-react"
import { formatCategoryLabel } from "@/helpers/dictionary"

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

export function getKpiInsights(
  mes: VendasKPIMes,
  topProductName?: string | null,
  topCategoriaNome?: string | null,
  topCategoriaQtd?: number | null,
): Metric[] {
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
      label: "Top categorias",
      value: formatCategoryLabel(topCategoriaNome ?? mes.categoria_mais_vendida),
      helper: topCategoriaQtd != null ? `${topCategoriaQtd.toLocaleString("pt-BR")} un.` : "",
      tone: "emerald",
      icon: LayoutGrid,
    },
    {
      label: "Produto mais vendido",
      value: topProductName ?? mes.categoria_mais_vendida,
      helper: `${mes.qtd_pedidos_aprovados.toLocaleString("pt-BR")} un.`,
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

