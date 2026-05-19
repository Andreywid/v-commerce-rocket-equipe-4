export type VendasKPIMes = {
  ano: number
  mes: number
  ano_mes: string
  qtd_pedidos: number
  qtd_pedidos_aprovados: number
  qtd_pedidos_recusados: number
  qtd_pedidos_reembolsados: number
  qtd_pedidos_processando: number
  receita_bruta: number
  ticket_medio: number
  qtd_clientes_unicos: number
  qtd_clientes_novos: number
  taxa_aprovacao: number
  taxa_recusa: number
  taxa_reembolso: number
  categoria_mais_vendida: string
  estado_maior_receita: string
  data_referencia_calculo: string
}

export type KPIsResponse = {
  periodo: string
  meses: VendasKPIMes[]
}
