# Módulo de API HTTP (Frontend)

## Visão Geral

`src/services/api.ts` é o único ponto de comunicação HTTP do frontend com o backend. Injeta automaticamente o JWT de sessão em todas as requisições e normaliza erros HTTP numa classe `HttpError` consistente.

## Responsabilidades

1. Determinar a URL base da API (`VITE_API_URL` ou `/api/v1`)
2. Injetar o header `Authorization: Bearer <token>` em todas as chamadas
3. Tratar respostas 204/empty-body sem tentar parsear JSON
4. Normalizar todos os erros HTTP em instâncias de `HttpError`
5. Expor uma API pública tipada: `api.get`, `api.post`, `api.put`, `api.delete`

## Arquitetura Interna

### Configuração da URL base

```typescript
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1"
```

Em desenvolvimento, `/api/v1` é interceptado pelo Vite que faz proxy para `http://localhost:8000`.

### Classe `HttpError`

```typescript
class HttpError extends Error {
  constructor(
    public status: number,   // código HTTP; 0 = falha de rede
    public detail: string    // `body.detail` ou "Erro desconhecido"
  ) {
    super(detail)
  }
}
```

### Função `request<T>`

```
request(path, options?)
│
├── 1. Lê token do localStorage
├── 2. Faz fetch(`${BASE_URL}${path}`, {
│         method: options.method ?? "GET",
│         headers: {
│           "Content-Type": "application/json",
│           "Authorization": "Bearer <token>"  (se houver)
│         },
│         body: JSON.stringify(options.body)   (se houver)
│      })
├── 3. Se !response.ok
│       └── lê body.detail → lança HttpError(status, detail)
├── 4. Se status 204 ou content-length === "0"
│       └── retorna undefined (cast para T)
└── 5. Retorna response.json() como Promise<T>
```

### API pública

```typescript
api.get<T>(path: string): Promise<T>
api.post<T>(path: string, body: unknown): Promise<T>
api.put<T>(path: string, body: unknown): Promise<T>
api.delete(path: string): Promise<void>
```

## Fluxo de Tratamento de Erros nas Páginas

```typescript
// Padrão usado em todas as páginas com operações de escrita:
function notifyError(err: unknown, fallback: string) {
  const msg = err instanceof HttpError
    ? `Erro ${err.status}: ${err.detail}`
    : fallback
  showNotice(msg)   // toast via sonner
}

// Uso em handlers de submit:
try {
  await create.mutateAsync(values)
  showNotice("Produto adicionado")
} catch (err) {
  notifyError(err, "Erro ao adicionar produto")
}
```

## Chaves do `localStorage` Utilizadas

| Chave | Lida por | Conteúdo |
|---|---|---|
| `token` | `request()` | JWT retornado pelo backend |
| `userEmail` | `App.tsx` | E-mail do usuário (guarda de rota) |
| `userName` | `App.tsx` | Nome do usuário (exibição) |
| `pageSize:<key>` | `usePersistedPageSize` | Tamanho de página por tabela |

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [hooks.md](hooks.md) | ← usa | Todos os hooks chamam `api.get/post/put/delete` nas queryFns |
| [rotas.md](rotas.md) | ← usa | LoginPage chama `api.post("/auth/login", ...)` |
| Backend FastAPI | → HTTP | Destino de todas as requisições |

## Tratamento de Erros

| Situação | Comportamento |
|---|---|
| Resposta HTTP ≥400 | Lança `HttpError(status, body.detail)` |
| Falha de rede (fetch throws) | Erro nativo propagado (não é `HttpError`) |
| Status 204 sem body | Retorna `undefined` sem tentar parsear |
| Token ausente no localStorage | Header `Authorization` é omitido; servidor retorna 401 |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/services/api.ts` | Implementação completa do cliente HTTP |
| `src/hooks/useProducts.ts` | Exemplo de uso: `api.get`, `api.post`, `api.put`, `api.delete` |
| `src/pages/Products.tsx` | Exemplo de `notifyError` com `HttpError` |

## Glossário

| Termo | Significado |
|---|---|
| `HttpError` | Classe que encapsula status + detail de erros HTTP; distinguível via `instanceof` |
| `VITE_API_URL` | Variável de ambiente Vite para URL da API em produção |
| proxy Vite | Reescrita de `/api/*` → `http://localhost:8000/*` no servidor de desenvolvimento |
| 204 No Content | Status HTTP para DELETE bem-sucedido sem corpo de resposta |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
