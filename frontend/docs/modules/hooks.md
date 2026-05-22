# Módulo de Hooks (Frontend)

## Visão Geral

Todos os hooks de acesso a dados são construídos sobre **TanStack Query v5**. Cada entidade de negócio tem seu próprio arquivo de hooks que agrupa leituras (`useQuery`) e mutações (`useMutation`). Dois hooks utilitários complementam o sistema: `useDebounce` e `usePersistedPageSize`.

## Responsabilidades

1. Abstrair as chamadas HTTP atrás de interfaces tipadas e reutilizáveis
2. Gerenciar cache, invalidação e estados de loading/error automaticamente
3. Prover `keepPreviousData` durante mudanças de página (evita flash)
4. Invalidar queries relacionadas após mutações bem-sucedidas
5. Persistir preferências de paginação no `localStorage`
6. Debouncar inputs de busca para reduzir requisições

## Arquitetura Interna

### `useKpis.ts`

```typescript
useKpis(periodo: "3m" | "6m" | "12m" | "all" = "12m"): UseQueryResult<KPIsResponse>
// queryKey: ["kpis", periodo]
// staleTime: 5 min (sobrescreve o padrão global)
// endpoint: GET /dashboard/kpis?periodo=<periodo>

useTopRegioes(): UseQueryResult<TopRegioesResponse>
// queryKey: ["dashboard", "top-regioes"]
// staleTime: 10 min
// endpoint: GET /dashboard/top-regioes

useTopCategorias(): UseQueryResult<TopCategoriasResponse>
// queryKey: ["dashboard", "top-categorias"]
// staleTime: 10 min
// endpoint: GET /dashboard/top-categorias
```

### `useProducts.ts`

```typescript
useProducts(filters: ProductFilters, page = 1, size = 20)
// queryKey: ["products", filters, page, size]
// placeholderData: keepPreviousData — sem flash durante paginação
// endpoint: GET /products?...params (serializa filtros como query params)

useProductPerformance(id: string | null)
// queryKey: ["product-perf", id]
// enabled: id !== null
// staleTime: 3 min
// endpoint: GET /products/{id}/performance

useProductReviews(id: string | null, page = 1)
// queryKey: ["product-reviews", id, page]
// enabled: id !== null
// endpoint: GET /products/{id}/avaliacoes?page=<page>

useProductMutations()
// create → POST /products        → invalida ["products"]
// update → PUT  /products/{id}   → invalida ["products"]
// remove → DELETE /products/{id} → invalida ["products"]
```

### `useCustomers.ts`

```typescript
useCustomers(filters: CustomerFilters, page = 1, size = 20)
// queryKey: ["customers", filters, page, size]
// endpoint: GET /customers?...params

useCustomer360(id: string | null)
// queryKey: ["customer360", id]
// enabled: id !== null
// endpoint: GET /customers/{id}/perfil-360

useCustomerStats()
// queryKey: ["customerStats"]
// staleTime: 5 min
// endpoint: GET /customers/stats

useCustomerReviews(id: string | null, page = 1, size = 5)
// queryKey: ["customerReviews", id, page, size]
// enabled: id !== null
// endpoint: GET /customers/{id}/avaliacoes

useCustomerMutations()
// create → POST /customers       → invalida ["customers"]
// update → PUT  /customers/{id}  → invalida ["customers"]
// remove → DELETE /customers/{id}→ invalida ["customers"]
```

### `useOrders.ts`

```typescript
useOrders(filters: OrderFilters, page = 1, size = 20)
// queryKey: ["orders", filters, page, size]
// endpoint: GET /orders?...params

useOrder(id: string | null)
// queryKey: ["order", id]
// enabled: id !== null
// endpoint: GET /orders/{id}

useOrderMutations()
// create → POST /orders       → invalida ["orders"]
// update → PUT  /orders/{id}  → invalida ["orders"]
// remove → DELETE /orders/{id}→ invalida ["orders"]
```

### `useSupport.ts`

```typescript
useSupport(filters: SupportFilters, page = 1, size = 20)
// queryKey: ["support", filters, page, size]
// endpoint: GET /support?...params

useSupportTicket(id: number | null)
// queryKey: ["ticket", id]
// enabled: id !== null
// endpoint: GET /support/{id}

useSupportMutations()
// create → POST /support       → invalida ["support"]
// update → PUT  /support/{id}  → invalida ["support"]
// remove → DELETE /support/{id}→ invalida ["support"]
```

### `useAgent.ts`

```typescript
useAgentSuggestions(): UseQueryResult<string[]>
// queryKey: ["agent-suggestions"]
// staleTime: 10 min
// endpoint: GET /agent/suggestions

useAgentChat(): UseMutationResult<ChatResponse, Error, ChatRequest>
// endpoint: POST /agent/chat
// Não invalida nenhuma query — chat é stateful no AI Agent
```

### `useDebounce.ts`

```typescript
useDebounce<T>(value: T, delay: number): T
// Retorna o valor com atraso de `delay` ms.
// Cancela o timeout anterior se o valor mudar antes do prazo.
// Padrão nas buscas: 400ms
```

### `usePersistedPageSize.ts`

```typescript
usePersistedPageSize(pageKey: string): [number, (size: number) => void]
// Tamanhos válidos: [6, 10, 20, 50]
// Padrão: 6
// Chave no localStorage: `pageSize:<pageKey>`
// Exemplos de pageKey: "produtos", "clientes", "pedidos", "suporte"
```

## Fluxo de uma Mutação

```
handleAdd(values)
│
├── create.mutateAsync(values)
│       └── api.post<ProductOut>("/products", values)
│           └── Backend cria produto → 201 Created
│
├── onSuccess:
│       └── queryClient.invalidateQueries({ queryKey: ["products"] })
│               └── TanStack Query marca o cache como stale
│                   → refetch automático na próxima renderização
│
└── setIsAddModalOpen(false)
    showNotice("Produto adicionado")
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [api.md](api.md) | ← usa | Todos os hooks chamam `api.get/post/put/delete` |
| [paginas.md](paginas.md) | ← usa | Páginas consomem os hooks |
| [tipos.md](tipos.md) | ← usa | Hooks são tipados com os contratos de `types/api.ts` |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/hooks/useKpis.ts` | KPIs do dashboard |
| `src/hooks/useProducts.ts` | Produtos + performance + reviews + mutations |
| `src/hooks/useCustomers.ts` | Clientes + 360 + stats + reviews + mutations |
| `src/hooks/useOrders.ts` | Pedidos + mutations |
| `src/hooks/useSupport.ts` | Tickets + mutations |
| `src/hooks/useAgent.ts` | Chat IA + sugestões |
| `src/hooks/useDebounce.ts` | Debounce genérico |
| `src/hooks/usePersistedPageSize.ts` | Persistência de page size |

## Glossário

| Termo | Significado |
|---|---|
| `queryKey` | Array identificador de uma query no cache do TanStack Query |
| `keepPreviousData` | Mantém dados anteriores visíveis enquanto novos carregam (paginação suave) |
| `invalidateQueries` | Marca entradas do cache como stale, triggando refetch na próxima leitura |
| `enabled` | Flag booleana: quando `false`, a query não é disparada |
| `staleTime` | Override local do tempo de "frescor" dos dados |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
