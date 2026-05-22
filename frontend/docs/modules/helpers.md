# Módulo de Helpers e Utilitários (Frontend)

## Visão Geral

Os helpers são funções puras sem efeitos colaterais (exceto `downloadFile`, que manipula o DOM). Estão organizados em quatro arquivos: `export.ts` (CSV), `dictionary.ts` (labels e ícones), `metrics.ts` (dados para os cards do dashboard) e `lib/utils.ts` (composição de classes CSS).

## Responsabilidades

1. Gerar e disparar download de arquivos CSV para todas as entidades listadas
2. Traduzir valores de backend (ex: `"Eletronicos"`) em labels legíveis pelo usuário
3. Mapear categorias de produto aos ícones Lucide correspondentes
4. Transformar dados de KPI em estruturas prontas para os cards do dashboard
5. Compor classes CSS Tailwind de forma segura (sem conflitos)

## `src/helpers/export.ts`

### Arquitetura

```
exportXxxToCSV(data: XxxOut[])
│
├── 1. Define headers[]           (array de strings com nomes das colunas)
├── 2. Define rows[][]            (data.map() → array de valores)
├── 3. generateCSV(headers, rows) → string CSV
│       ├── Junta header com vírgulas
│       ├── Para cada row: escapa aspas duplas (replace `"` → `""`)
│       │   e envolve campos com vírgulas em aspas
│       └── Junta linhas com \n
└── 4. downloadFile(csv, filename, "text/csv;charset=utf-8;")
        ├── new Blob([content], { type })
        ├── URL.createObjectURL(blob)
        ├── Cria <a> invisível e simula .click()
        ├── document.body removeChild(a)
        └── setTimeout(300ms) → URL.revokeObjectURL() (libera memória)
```

### Funções disponíveis

| Função | Arquivo gerado | Colunas principais |
|---|---|---|
| `exportKpiToCSV(data)` | `vcommerce_dashboard_kpi_YYYY-MM-DD.csv` | Ano/Mês, Pedidos, Aprovados, Receita, Ticket Médio, Clientes Únicos, Taxa Aprovação, Categoria Top |
| `exportProductsToCSV(data)` | `vcommerce_produtos_YYYY-MM-DD.csv` | ID, Nome, Categoria, Preço, Ativo, Estoque, Qtd Vendida, Receita, Nota, Classificação |
| `exportClientesToCSV(data)` | `vcommerce_clientes_YYYY-MM-DD.csv` | ID, Nome, Email, Telefone, Cidade, Estado, Origem, Pedidos, Valor Total, Ticket Médio, Último Pedido, Tickets Abertos, Segmento, Ativo 90d, Em Risco |
| `exportOrdersToCSV(data)` | `vcommerce_pedidos_YYYY-MM-DD.csv` | ID Pedido, Cliente, Nome Cliente, Produto, Nome Produto, Categoria, Data, Qtd, Valor Unitário, Valor Total, Status, Pagamento, Estado |
| `exportTicketsToCSV(data)` | `vcommerce_tickets_YYYY-MM-DD.csv` | ID Ticket, Cliente, Tipo, Status, Data Abertura, Data Resolução, Agente, Nota, SLA Estourado |

### Uso nas páginas

```typescript
// Padrão em todas as páginas com TableToolbar:
onExport={() => {
  if (!items.length) { showNotice("Nenhum dado para exportar."); return }
  exportProductsToCSV(items)
  showNotice(`${items.length} produtos exportados`)
}}
```

---

## `src/helpers/dictionary.ts`

### `formatCategoryLabel(categoria: string): string`

Converte chave interna em label legível pelo usuário.

```typescript
// Exemplos:
"Eletronicos" → "Eletrônicos"
"Vestuario"   → "Vestuário"
"Casa"        → "Casa"
"Automotivo"  → "Automotivo"
"Sem categoria" → "Sem categoria"
```

### `getCategoryIcon(categoria: string): LucideIcon`

Retorna o componente de ícone Lucide correspondente à categoria.

```typescript
// Exemplos:
"Eletronicos" → Laptop
"Vestuario"   → Shirt
"Casa"        → Home
"Esportes"    → Dumbbell
"Beleza"      → Sparkles
"Automotivo"  → Car
"Brinquedos"  → Gamepad2
"Moveis"      → Sofa
default       → Package
```

**Uso em Products.tsx:**

```typescript
const Icon = getCategoryIcon(row.categoria)
return <Icon className="size-5" />
```

---

## `src/helpers/metrics.ts`

### `getKpiCards(mes: VendasKPIMes): Metric[]`

Transforma os dados do mês em 4 DataCards para o Dashboard.

```typescript
// Output: array com 4 objetos Metric
[
  { label: "Receita Bruta",     value: "R$ 150.000",  tone: "emerald", icon: TrendingUp },
  { label: "Pedidos Aprovados", value: "1.000",        tone: "indigo",  icon: ShoppingCart },
  { label: "Ticket Médio",      value: "R$ 125",       tone: "violet",  icon: Wallet },
  { label: "Clientes Únicos",   value: "800",          tone: "rose",    icon: Users },
]
```

### `getKpiInsights(mes, topProduct, topCategoria, topCategoriaQtd): Metric[]`

Transforma dados do mês + produto/categoria top em 4 InsightCards.

```typescript
// Output: array com 4 objetos Metric
[
  { label: "Top Região",            value: mes.estado_maior_receita,  actionLabel: "Ver Top 5" },
  { label: "Produto mais vendido",  value: topProduct,                actionLabel: "Ver Top 5" },
  { label: "Top Categorias",        value: topCategoria,              actionLabel: "Ver Top 5" },
  { label: "Taxa de Aprovação",     value: `${mes.taxa_aprovacao}%`,  actionLabel: null },
]
```

---

## `src/lib/utils.ts`

### `cn(...inputs: ClassValue[]): string`

Combina `clsx` + `tailwind-merge` para composição segura de classes Tailwind. Resolve conflitos (ex: `p-4` vs `p-2` → mantém o último relevante).

```typescript
// Uso padrão:
cn("base-class", condicional && "extra-class", props.className)

// Exemplo real em RatingBadge:
cn(
  "rounded-full px-2 py-0.5 text-xs font-semibold",
  nota >= 4 ? "bg-emerald-50 text-emerald-700" :
  nota >= 3 ? "bg-amber-50 text-amber-700" :
              "bg-rose-50 text-rose-700"
)
```

---

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [paginas.md](paginas.md) | ← usa | Páginas chamam `exportXxxToCSV` e `showNotice` |
| [componentes.md](componentes.md) | ← usa | `formatCategoryLabel`, `getCategoryIcon`, `cn()` |
| [tipos.md](tipos.md) | ← usa | Funções de export recebem `XxxOut[]` |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/helpers/export.ts` | Geração e download de CSV para todas as entidades |
| `src/helpers/dictionary.ts` | Labels legíveis e ícones por categoria |
| `src/helpers/metrics.ts` | Estruturas de dados para os cards do Dashboard |
| `src/lib/utils.ts` | `cn()` para composição de classes Tailwind |

## Glossário

| Termo | Significado |
|---|---|
| `clsx` | Biblioteca para composição condicional de classes CSS |
| `tailwind-merge` | Remove classes Tailwind conflitantes em uma string mesclada |
| `createObjectURL` | API do browser para criar URL temporária apontando para um Blob |
| `Blob` | Objeto binário imutável; usado para criar o arquivo CSV na memória |
| `LucideIcon` | Tipo TypeScript do pacote `lucide-react` para componentes de ícone |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
