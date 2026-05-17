// Tipos espelhando os schemas da DOCUMENTACAO_API.md

export type PagedResponse<T> = {
  total: number
  page: number
  size: number
  items: T[]
}

// Auth
export type UserOut = {
  id: number
  email: string
  name: string
  role: "admin" | "user"
}

export type LoginResponse = {
  access_token: string
  token_type: string
  user: UserOut
}

// Dashboard
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

// Clientes
export type CustomerOut = {
  id_cliente: string
  nome: string
  email: string
  telefone: string
  data_cadastro: string
  cidade: string
  estado: string
  origem: string
  qtd_pedidos_total: number
  valor_total_gasto: number
  ticket_medio: number
  data_ultimo_pedido: string | null
  qtd_tickets_abertos: number
  segmento_ltv: "Alto" | "Medio" | "Baixo"
  is_ativo_90d: boolean
  is_em_risco: boolean
}

export type Customer360 = CustomerOut & {
  qtd_pedidos_aprovados: number
  qtd_pedidos_recusados: number
  qtd_pedidos_reembolsados: number
  qtd_pedidos_processando: number
  data_primeiro_pedido: string | null
  qtd_tickets_total: number
  qtd_tickets_resolvidos: number
  qtd_avaliacoes: number
  nota_media_dada: number | null
  nps_medio_avaliacoes_cliente: number | null
  qtd_eventos_clickstream: number
  canal_preferido: string | null
  data_referencia_calculo: string
}

export type CustomerListResponse = PagedResponse<CustomerOut>

// Pedidos
export type OrderOut = {
  id_pedido: string
  id_cliente: string
  id_produto: string
  data_pedido: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  status: "Aprovado" | "Recusado" | "Reembolsado" | "Processando"
  metodo_pagamento: "Cartao" | "PIX" | "Boleto" | "App"
  nome_cliente: string
  estado_cliente: string
  nome_produto: string
  categoria_produto: string
  ano: number
  mes: number
  trimestre: number
}

export type OrderListResponse = PagedResponse<OrderOut>

export type OrderCreate = {
  id_pedido: string
  id_produto: string
  data_pedido: string
  quantidade: number
  status: "Aprovado" | "Recusado" | "Reembolsado" | "Processando"
  metodo_pagamento?: string
}

export type OrderUpdate = {
  data_pedido?: string
  status?: "Aprovado" | "Recusado" | "Reembolsado" | "Processando"
  id_produto?: string
  quantidade?: number
}

// Produtos
export type ProductOut = {
  id_produto: string
  nome_produto: string
  categoria: "Eletronicos" | "Vestuario" | "Casa" | "Esportes" | "Beleza" | "Automotivo" | "Brinquedos" | "Moveis" | "Sem categoria"
  preco_atual: number
  ativo: boolean
  estoque: number | null
  descricao: string | null
  imagem_url: string | null
  qtd_vendida_total: number
  receita_total: number
  nota_media: number | null
  qtd_tickets_associados: number
  classificacao: "Top Vendedor" | "Estável" | "Problemático" | "Encalhado"
}

export type ProductPerformance = ProductOut & {
  qtd_vendida_30d: number
  qtd_vendida_90d: number
  receita_30d: number
  qtd_tickets_30d: number
  taxa_problema: number
  qtd_avaliacoes: number
  pct_recomendam: number
  qtd_visualizacoes: number
  qtd_carrinho: number
  taxa_conversao: number
  data_referencia_calculo: string
}

export type ProductListResponse = PagedResponse<ProductOut>

export type ProductCreate = {
  nome_produto: string
  categoria: ProductOut["categoria"]
  preco_atual: number
  ativo: boolean
  estoque?: number | null
  descricao?: string | null
  imagem_url?: string | null
}

export type ProductUpdate = Partial<ProductCreate>

// Tickets
export type TicketOut = {
  id_ticket: string
  id_cliente: string
  id_pedido: string | null
  id_produto: string | null
  tipo_problema: "Entrega" | "Reembolso" | "Produto" | "Pagamento"
  satisfacao_atendimento: "alta" | "media" | "baixa" | "sem_avaliacao"
  data_abertura: string
  data_resolucao: string | null
  tempo_resolucao_horas: number | null
  agente_suporte: string | null
  nota_avaliacao: number | null
  status_ticket: "Aberto" | "Resolvido"
  sla_estourado: boolean
  nome_cliente: string
  nome_produto: string | null
  data_referencia_calculo: string
}

export type TicketListResponse = PagedResponse<TicketOut>

// Avaliações
export type ReviewOut = {
  id_avaliacao: string
  id_cliente: string
  id_pedido: string
  id_produto: string
  nota_produto: number
  nota_nps: number
  recomenda: boolean
  comentario: string | null
  sentimento: "positivo" | "neutro" | "negativo"
  data_avaliacao: string
  nome_produto: string
  categoria_produto: string
  nome_cliente: string
}

export type ReviewListResponse = PagedResponse<ReviewOut>

// Agente IA
export type ChatRequest = {
  message: string
  session_id: string | null
}

export type ChatResponse = {
  answer: string
  sql_used: string | null
  data: Record<string, unknown>[]
  session_id: string
}
