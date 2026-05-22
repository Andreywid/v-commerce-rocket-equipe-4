# Módulo de Componentes (Frontend)

## Visão Geral

Os componentes estão organizados em três camadas: `layout/` (estrutura da página autenticada), `shared/` (componentes de domínio reutilizáveis) e `ui/` (primitivos de UI sem lógica de negócio).

## Responsabilidades

1. Prover a estrutura visual da aplicação autenticada (`AppLayout`, `Sidebar`, `Header`)
2. Oferecer componentes de tabela padronizados com paginação e ordenação
3. Gerenciar o chat do Assistente de IA (painel overlay + botão flutuante)
4. Renderizar modais de CRUD, filtros e detalhes para todas as entidades
5. Expor primitivos de UI acessíveis (shadcn/ui + Base UI) para composição

## Componentes de Layout

### `AppLayout`

Shell da área autenticada. Compõe todos os outros elementos de layout.

```
AppLayout
├── Sidebar
├── div.flex-col (main content)
│   ├── Header
│   └── <Outlet> (página ativa via React Router)
├── FloatingAssistant
└── AssistantPanel
```

**Props:** `userEmail`, `userName`, `onLogout`, `isAssistantOpen`, `setIsAssistantOpen`

### `Sidebar`

- **Desktop:** `<aside>` fixo de 270px. `NavLink` com `isActive` → `bg-indigo-600`
- **Mobile:** `<Sheet>` (Base UI drawer), abre pelo hambúrguer do `<Header>`
- **Itens de nav:** Dashboard, Produtos, Clientes, Pedidos, Suporte
- **Logos:** `V-Horizontal.svg` (desktop), `V.svg` (mobile)

### `Header`

Barra superior: e-mail e nome do usuário + botão hambúrguer (mobile).

---

## Componentes de Tabela

### `TableToolbar`

Toolbar padrão de todas as tabelas listagem.

```
┌─────────────────────────────────────────────────────────────┐
│ [ícone] Título da lista                                      │
│       [🔍 Busca] [⚙ Filtros] [↓ Exportar CSV] [+ Ação]     │
└─────────────────────────────────────────────────────────────┘
```

**Props principais:** `label`, `icon`, `searchValue`, `onSearchChange`, `placeholder`, `onAdvancedFilter`, `advancedFilterActive` (indicador visual), `onExport`, `onAction`, `actionLabel`

### `Table` (primitivos)

```typescript
// Componentes exportados de src/components/shared/Table.tsx:
<TableHeader>         // <thead>
<TableBody>           // <tbody>
<TableRow>            // <tr>
<TableHead            // <th> com suporte a ordenação
  sortKey="campo"
  currentSortKey={sortBy}
  currentSortOrder={sortOrder}
  onSort={handleSort}
>
<TableCell>           // <td>
<TablePagination      // controles de paginação
  currentPage pageCount pageSize totalCount filteredCount
  onPageChange onPageSizeChange
/>
<EmptyTableState message="Nenhum item encontrado." />
```

`TableHead` com `sortKey` renderiza ↑ (asc) ou ↓ (desc) e chama `onSort(key)` ao clicar. Sem `sortKey`, renderiza como header simples.

### `DataPanel`

Container com borda, sombra e radius que envolve cada tabela. Sem props específicas; aceita `children`.

---

## Componentes de Badge e Indicadores

### `StatusBadge`

Badge colorido genérico. Recebe `className` com as classes de cor da constante `badgeStyles.ts`.

```typescript
// Exemplo de uso:
<StatusBadge className={orderStatusClasses["Aprovado"]}>
  Aprovado
</StatusBadge>
```

### `RatingBadge`

Badge de nota numérica com cor automática por faixa:
- `nota >= 4` → verde (emerald)
- `nota >= 3` → amarelo (amber)
- `nota < 3`  → vermelho (rose)

### `MetricCards` (DataCard, InsightCard, DataGrid)

- **DataCard:** card de KPI com `label`, `value`, `helper` e `icon`. Suporta `tone`: `rose | emerald | indigo | violet`
- **InsightCard:** card clicável com `onClick` e `actionLabel` ("Ver Top 5"). Igual ao DataCard mas com interação
- **DataGrid:** grid responsivo de 4 colunas que envolve os cards

### `ProductHighlightCard`

Card para highlights de produto (mais/menos vendido, melhor/pior avaliado). Props: `label`, `productName`, `metricLabel`, `metricValue`, `tone`.

---

## Assistente de IA

### `FloatingAssistant`

Botão fixo no canto inferior direito com ícone `Sparkles`. Ao clicar, alterna `isAssistantOpen` no `AppLayout`.

### `AssistantPanel`

Painel de chat (overlay lateral/bottom). Gerencia:
- Estado `messages: ChatMessage[]` local
- `sessionId` para contexto multi-turno
- Sugestões iniciais via `useAgentSuggestions()`
- Envio de mensagem via `useAgentChat()` mutation

**Fluxo interno:**

```
sendMessage(text)
│
├── Adiciona msg do usuário + placeholder "…" ao estado
├── Chama mutation.mutate({ message: text, session_id })
│
└── onSuccess:
    ├── parseAnswer(response.answer) → remove blocos SQL, extrai source
    ├── setSessionId(response.session_id)
    └── Substitui placeholder pela resposta real
```

**Renderização de mensagens:**
- Usuário → bolha direita (borda cinza)
- Assistente → texto puro, sem bolha
  - `isError` → `<ErrorBlock>` (rose)
  - `source` → `<SourceBlock>` com link para a rota relacionada

**Mapeamento source → rota:**

```typescript
routeForSource(source)
// "pedido" / "order"   → "/pedidos"
// "cliente" / "cust"   → "/clientes"
// "produto" / "prod"   → "/produtos"
// "ticket" / "suporte" → "/suporte"
// outros               → null (sem botão)
```

---

## Modais de CRUD e Filtros

| Componente | Entidade | Finalidade |
|---|---|---|
| `ProductFormModal` | Produto | Criação e edição (admin); inclui exclusão ao editar |
| `ProductDetailDialog` | Produto | Visualização de performance + avaliações |
| `ProductFilterModal` | Produto | Filtros avançados (categorias, preço, status) |
| `ClientFormModal` | Cliente | Criação e edição |
| `ClientProfileDialog` | Cliente | Perfil 360° com abas pedidos/tickets/avaliações |
| `ClientAdvancedFilterDialog` | Cliente | Filtros avançados (UF, segmento, valor, recorrência) |
| `OrderFormModal` | Pedido | Criação e edição (admin) |
| `OrderFilterModal` | Pedido | Filtros avançados |
| `TicketFormModal` | Ticket | Criação e edição |
| `TicketDetailModal` | Ticket | Visualização detalhada |
| `SupportFilterModal` | Ticket | Filtros avançados (tipo, status, SLA, satisfação) |
| `FilterModal` | Dashboard | Filtro de período e mês de referência |
| `TopRegioesModal` | Dashboard | Top 5 estados por receita |
| `TopProdutosModal` | Dashboard | Top 5 produtos por quantidade vendida |
| `TopCategoriasModal` | Dashboard | Top 5 categorias |
| `ConfirmDeleteDialog` | Global | Confirmação genérica de exclusão |

---

## Primitivos de UI (`components/ui/`)

Baseados em **shadcn/ui** e **@base-ui/react**. Sem lógica de negócio; apenas estilização e acessibilidade.

| Componente | Origem | Descrição |
|---|---|---|
| `button.tsx` | shadcn | Botão com variantes via CVA |
| `dialog.tsx` | Base UI | Dialog acessível (ARIA) |
| `input.tsx` | shadcn | Campo de texto estilizado |
| `select.tsx` | Base UI | Select acessível |
| `sheet.tsx` | Base UI | Drawer mobile (Sidebar) |
| `badge.tsx` | shadcn | Badge base |
| `card.tsx` | shadcn | Card container |
| `avatar.tsx` | shadcn | Avatar com fallback |
| `sonner.tsx` | sonner | Toast wrapper |
| `table.tsx` | shadcn | Primitivos de tabela HTML |

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [paginas.md](paginas.md) | ← usa | Páginas montam os componentes compartilhados |
| [hooks.md](hooks.md) | ← usa | Modais de detalhe usam hooks para carregar sub-dados |
| [tipos.md](tipos.md) | ← usa | Props tipadas com os tipos de domínio e API |
| [helpers.md](helpers.md) | ← usa | `formatCategoryLabel`, `getCategoryIcon`, `cn()` |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/components/layout/AppLayout.tsx` | Shell autenticado |
| `src/components/layout/Sidebar.tsx` | Navegação lateral |
| `src/components/shared/Table.tsx` | Primitivos de tabela e paginação |
| `src/components/shared/TableToolbar.tsx` | Toolbar de busca/filtro/export |
| `src/components/shared/AssistantPanel.tsx` | Chat IA completo |
| `src/components/shared/FloatingAssistant.tsx` | Botão flutuante IA |
| `src/components/shared/MetricCards.tsx` | DataCard, InsightCard, DataGrid |
| `src/constants/badgeStyles.ts` | Classes CSS por status/categoria/tipo |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
