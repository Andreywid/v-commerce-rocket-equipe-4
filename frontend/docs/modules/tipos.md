# Módulo de Tipos TypeScript (Frontend)

## Visão Geral

Os tipos estão divididos em dois arquivos: `src/types/index.ts` (tipos de domínio, independentes da API) e `src/types/api.ts` (contratos exatos de request/response espelhando os schemas Pydantic do backend).

## Responsabilidades

1. Garantir type safety em todo o ciclo: requisição → cache → renderização
2. Espelhar fielmente os schemas Pydantic do backend
3. Centralizar os tipos de domínio para uso em componentes, helpers e constantes
4. Tipar corretamente estados de UI e callbacks de páginas

## Tipos de Domínio (`src/types/index.ts`)

### Enums de string

```typescript
type OrderStatus        = "Aprovado" | "Recusado" | "Reembolsado" | "Processando"
type SupportType        = "Entrega" | "Reembolso" | "Produto" | "Pagamento"
type SupportStatus      = "Aberto" | "Resolvido"
type SatisfacaoAtendimento = "alta" | "media" | "baixa" | "sem_avaliacao"

type ProductCategory =
  | "Eletronicos" | "Vestuario" | "Casa"    | "Esportes"
  | "Beleza"      | "Automotivo"| "Brinquedos"| "Moveis"
  | "Sem categoria"

type ProductClassificacao = "Top Vendedor" | "Estável" | "Problemático" | "Encalhado"
type ClientSegmento      = "Alto" | "Medio" | "Baixo"
type ReviewSentimento    = "positivo" | "neutro" | "negativo"
type MetodoPagamento     = "Cartao" | "PIX" | "Boleto" | "App"

type MetricTone  = "rose" | "emerald" | "indigo" | "violet"
```

### `ChatMessage`

```typescript
type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  source?: string     // tabela consultada pelo AI Agent
  isError?: boolean   // indica resposta de erro do agente
}
```

---

## Contratos de API (`src/types/api.ts`)

### Paginação genérica

```typescript
type PagedResponse<T> = {
  total: number
  page: number
  size: number
  items: T[]
}
```

### Autenticação

```typescript
type UserOut = {
  id: number
  email: string
  name: string
  role: "admin" | "viewer"
}

type LoginResponse = {
  access_token: string
  token_type: "bearer"
  user: UserOut
}
```

### Dashboard

```typescript
type VendasKPIMes = {
  ano: number
  mes: number
  ano_mes: string                 // "2025-01"
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

type KPIsResponse = { periodo: string; meses: VendasKPIMes[] }

type TopRegiao    = { estado: string; receita: number; percentual: number }
type TopCategoria = { categoria: string; qtd_vendida: number; percentual: number }

type TopRegioesResponse   = { regioes: TopRegiao[] }
type TopCategoriasResponse = { categorias: TopCategoria[] }
```

### Clientes

```typescript
type CustomerOut = {
  id_cliente: string
  nome: string
  email: string
  telefone: string | null
  data_cadastro: string | null
  cidade: string | null
  estado: string | null
  origem: string | null
  qtd_pedidos_total: number
  valor_total_gasto: number
  ticket_medio: number
  data_ultimo_pedido: string | null
  qtd_tickets_abertos: number
  segmento_ltv: string | null
  is_ativo_90d: boolean
  is_em_risco: boolean
}

type Customer360 = CustomerOut & {
  qtd_pedidos_aprovados: number
  qtd_pedidos_recusados: number
  data_primeiro_pedido: string | null
  qtd_tickets_total: number
  qtd_avaliacoes: number
  nota_media_dada: number | null
  nps_medio_avaliacoes_cliente: number | null
  qtd_eventos_clickstream: number
  canal_preferido: string | null
}

type CustomerListResponse = PagedResponse<CustomerOut> & {
  segmento_alto: number
}

type CustomerStats = {
  total_clientes: number
  nps_medio: number
  nota_media: number
  top_estado: string
  top_estado_percentual: number
  clientes_em_risco: number
  clientes_ativos_90d: number
  segmentos: { Alto: number; Medio: number; Baixo: number }
}
```

### Pedidos

```typescript
type OrderOut = {
  id_pedido: string
  id_cliente: string
  id_produto: string
  data_pedido: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  status: OrderStatus
  metodo_pagamento: MetodoPagamento
  nome_cliente: string
  estado_cliente: string | null
  nome_produto: string
  categoria_produto: string
  ano: number
  mes: number
  trimestre: number
}

type OrderListResponse = PagedResponse<OrderOut> & {
  total_pendentes: number
  total_aprovados: number
  receita_total: number
}
```

### Produtos

```typescript
type ProductOut = {
  id_produto: string
  nome_produto: string
  categoria: string
  preco_atual: number
  ativo: boolean
  estoque: number | null
  descricao: string | null
  imagem_url: string | null
  qtd_vendida_total: number
  receita_total: number
  nota_media: number | null
  qtd_tickets_associados: number
  classificacao: string | null
}

type ProductPerformance = ProductOut & {
  qtd_vendida_30d: number
  qtd_vendida_90d: number
  receita_30d: number
  qtd_tickets_30d: number
  taxa_problema: number
  qtd_avaliacoes: number
  pct_recomendam: number | null
  qtd_visualizacoes: number
  qtd_carrinho: number
  taxa_conversao: number
  data_referencia_calculo: string | null
}
```

### Tickets e Avaliações

```typescript
type TicketOut = {
  id_ticket: string
  id_cliente: string
  id_pedido: string | null
  id_produto: string | null
  tipo_problema: SupportType
  satisfacao_atendimento: SatisfacaoAtendimento
  data_abertura: string
  data_resolucao: string | null
  tempo_resolucao_horas: number | null
  agente_suporte: string
  nota_avaliacao: number | null
  status_ticket: SupportStatus
  sla_estourado: boolean
  nome_cliente: string
  nome_produto: string | null
}

type ReviewOut = {
  id_avaliacao: string
  id_cliente: string
  id_pedido: string
  id_produto: string
  nota_produto: number | null   // 1–5
  nota_nps: number | null       // 0–10
  recomenda: boolean
  comentario: string | null
  sentimento: ReviewSentimento | null
  data_avaliacao: string
  nome_produto: string
  categoria_produto: string | null
  nome_cliente: string
}
```

### Agente de IA

```typescript
type ChatRequest = {
  message: string
  session_id: string | null
}

type ChatResponse = {
  answer: string
  sql_used: string | null
  data: Record<string, unknown>[]
  session_id: string
}
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [hooks.md](hooks.md) | ← usa | Hooks são parametrizados e retornam esses tipos |
| [paginas.md](paginas.md) | ← usa | Estado de UI e filtros usam tipos de domínio |
| [componentes.md](componentes.md) | ← usa | Props dos componentes são tipadas com esses contratos |
| [helpers.md](helpers.md) | ← usa | Funções de export e dictionary recebem esses tipos |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/types/index.ts` | Tipos de domínio independentes da API |
| `src/types/api.ts` | Contratos de request/response da API |
| `src/types/dashboard.ts` | Tipos auxiliares do dashboard (helpers metrics) |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
