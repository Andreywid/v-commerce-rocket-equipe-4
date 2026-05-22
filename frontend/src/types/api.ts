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

export type TopRegiao = {
  estado: string
  receita: number
  percentual: number
}

export type TopRegioesResponse = {
  regioes: TopRegiao[]
}

export type TopCategoria = {
  categoria: string
  qtd_vendida: number
  percentual: number
}

export type TopCategoriasResponse = {
  categorias: TopCategoria[]
}

// Clientes
export type CustomerOut = {
  id_cliente: string
  nome: string
  email: string | null
  telefone: string | null
  data_cadastro: string
  cidade: string
  estado: string
  origem: string
  maior_de_idade: boolean | null
  qtd_pedidos_total: number
  valor_total_gasto: number | null
  ticket_medio: number | null
  data_ultimo_pedido: string | null
  qtd_tickets_abertos: number
  segmento_ltv: "Alto" | "Medio" | "Baixo"
  is_ativo_90d: boolean | null
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
  qtd_avaliacoes: number | null
  nota_media_dada: number | null
  nps_medio_avaliacoes_cliente: number | null
  qtd_eventos_clickstream: number
  canal_preferido: string | null
  data_referencia_calculo: string
}

export type CustomerListResponse = PagedResponse<CustomerOut> & {
  segmento_alto: number
}

export type CustomerCreate = {
  nome: string
  email?: string | null
  telefone?: string
  cidade?: string
  estado?: string
  origem?: "app" | "web" | "indicacao"
}

export type CustomerUpdate = {
  nome?: string
  email?: string | null
  telefone?: string
  cidade?: string
  estado?: string
  origem?: "app" | "web" | "indicacao"
  segmento_ltv?: "Alto" | "Medio" | "Baixo"
}

export type CustomerStats = {
  total_clientes: number
  nps_medio: number | null
  nota_media: number | null
  top_estado: string | null
  top_estado_percentual: number | null
  clientes_em_risco: number
  clientes_ativos_90d: number
  segmentos: Record<string, number>
}

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
  metodo_pagamento: "Cartao" | "PIX" | "Boleto"
  nome_cliente: string
  estado_cliente: string
  nome_produto: string
  categoria_produto: string
  ano: number
  mes: number
  trimestre: number
}

export type OrderListResponse = PagedResponse<OrderOut> & {
  total_pendentes: number
  total_aprovados: number
  receita_total: number
}

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
  preco_atual: number | null
  ativo: boolean
  fornecedor: string | null
  peso_kg: number | null
  estoque_disponivel: number | null
  data_cadastro_produto: string | null
  qtd_vendida_total: number
  receita_total: number
  nota_media: number | null
  qtd_tickets_associados: number
  taxa_conversao: number | null
  classificacao: "Top Vendedor" | "Estavel" | "Problematico" | "Encalhado" | null
}

export type ProductPerformance = ProductOut & {
  qtd_vendida_30d: number
  qtd_vendida_90d: number
  receita_30d: number
  qtd_tickets_30d: number
  taxa_problema: number | null
  qtd_avaliacoes: number
  pct_recomendam: number | null
  qtd_visualizacoes: number
  qtd_carrinho: number
  data_referencia_calculo: string | null
}

export type ProductListResponse = PagedResponse<ProductOut>

export type ProductCreate = {
  nome_produto: string
  categoria: ProductOut["categoria"]
  preco_atual: number
  ativo: boolean
  estoque_disponivel?: number | null
}

export type ProductUpdate = Partial<ProductCreate>

// Tickets
export type TicketOut = {
  id_ticket: string
  id_cliente: string
  id_pedido: string | null
  id_produto: string | null
  tipo_problema: "Entrega" | "Reembolso" | "Produto" | "Pagamento" | "Outros"
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
  maior_de_idade: boolean | null
  data_referencia_calculo: string | null
}

export type TicketListResponse = PagedResponse<TicketOut>

export type TicketCreate = {
  id_cliente: string
  tipo_problema: "Entrega" | "Reembolso" | "Produto" | "Pagamento" | "Outros"
  agente_suporte: string
  nome_cliente: string
  id_pedido?: string
  id_produto?: string
  nome_produto?: string
  data_abertura?: string
}

export type TicketUpdate = {
  tipo_problema?: "Entrega" | "Reembolso" | "Produto" | "Pagamento" | "Outros"
  status_ticket?: "Aberto" | "Resolvido"
  agente_suporte?: string
  nota_avaliacao?: number
  satisfacao_atendimento?: "alta" | "media" | "baixa" | "sem_avaliacao"
}

// Avaliações
export type ReviewOut = {
  id_avaliacao: string
  id_cliente: string
  id_pedido: string
  id_produto: string
  nota_produto: number | null
  nota_nps: number | null
  recomenda: boolean
  comentario: string | null
  sentimento: "positivo" | "neutro" | "negativo" | null
  data_avaliacao: string
  nome_produto: string
  categoria_produto: string | null
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
