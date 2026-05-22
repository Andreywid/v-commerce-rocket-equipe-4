# Módulo de Endpoints (Backend)

## Visão Geral

Referência completa de todos os endpoints da API REST do V-Commerce CRM 360.

**Base URL:** `/api/v1`
**Swagger interativo:** `http://localhost:8000/docs`
**Autenticação:** `Authorization: Bearer <jwt>` em todos os endpoints marcados como "Sim"

## Autenticação

| Método | Rota | Auth | Rate Limit | Descrição |
|---|---|---|---|---|
| POST | `/auth/login` | Não | 5/min | Autentica e retorna JWT |
| GET  | `/auth/me` | Sim | — | Dados do usuário autenticado |

### POST `/auth/login`

```json
// Request body
{ "email": "admvcommerce@gmail.com", "password": "senha123!@#" }

// Response 200
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": { "id": 1, "email": "...", "name": "...", "role": "admin" }
}
```

---

## Dashboard

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/dashboard/kpis` | Sim | KPIs mensais de vendas |
| GET | `/dashboard/top-regioes` | Sim | Top 5 estados por receita total |
| GET | `/dashboard/top-categorias` | Sim | Top 5 categorias por quantidade vendida |

### GET `/dashboard/kpis`

**Query:** `?periodo=3m|6m|12m|all` (padrão: `12m`)

Períodos inválidos → HTTP 400. `all` retorna todos os meses do dataset.

### GET `/dashboard/top-regioes`

```json
{ "regioes": [{ "estado": "SP", "receita": 8500000.0, "percentual": 32.5 }] }
```

### GET `/dashboard/top-categorias`

Calculado via `GROUP BY categoria_produto` + `SUM(quantidade)` em `gold_pedidos_enriquecidos`.

```json
{ "categorias": [{ "categoria": "Eletronicos", "qtd_vendida": 45000, "percentual": 28.3 }] }
```

---

## Produtos

| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| GET    | `/products` | Sim | Qualquer | Lista paginada |
| GET    | `/products/{id}` | Sim | Qualquer | Detalhe |
| GET    | `/products/{id}/performance` | Sim | Qualquer | Métricas 30d/90d |
| GET    | `/products/{id}/avaliacoes` | Sim | Qualquer | Avaliações paginadas |
| POST   | `/products` | Sim | Admin | Cria produto |
| PUT    | `/products/{id}` | Sim | Admin | Atualiza produto |
| DELETE | `/products/{id}` | Sim | Admin | Remove produto → 204 |

### Query params — GET `/products`

| Param | Tipo | Descrição |
|---|---|---|
| `categoria` | string[] | Ex: `?categoria=Eletronicos&categoria=Casa` |
| `ativo` | bool | `true` = apenas ativos |
| `nome` | string | ilike em `nome_produto` OR `id_produto` |
| `preco_min` | float | `preco_atual >= valor` |
| `preco_max` | float | `preco_atual <= valor` |
| `sort_by` | string | `qtd_vendida_total`, `nota_media`, `preco_atual`, `receita_total` |
| `order` | string | `asc` ou `desc` |
| `page` | int ≥1 | padrão: 1 |
| `size` | int 1–100 | padrão: 20 |

**ID gerado no POST:** `PROD-XXXX` (incrementa o maior existente; `PROD-0001` se nenhum).

---

## Clientes

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/customers` | Sim | Lista paginada |
| GET    | `/customers/stats` | Sim | Estatísticas gerais |
| GET    | `/customers/{id}` | Sim | Detalhe |
| GET    | `/customers/{id}/perfil-360` | Sim | Perfil 360° completo |
| GET    | `/customers/{id}/orders` | Sim | Pedidos do cliente (paginado) |
| GET    | `/customers/{id}/tickets` | Sim | Tickets do cliente (paginado) |
| GET    | `/customers/{id}/avaliacoes` | Sim | Avaliações do cliente (paginado) |
| GET    | `/customers/{id}/comportamento` | Sim | Clickstream do cliente |
| POST   | `/customers` | Sim | Cria cliente |
| PUT    | `/customers/{id}` | Sim | Atualiza cliente |
| DELETE | `/customers/{id}` | Sim | Remove cliente → 204 |

### Query params — GET `/customers`

| Param | Tipo | Descrição |
|---|---|---|
| `nome` | string | ilike no nome |
| `email` | string | ilike no e-mail |
| `estado` | string[] | UF(s): `?estado=SP&estado=RJ` |
| `segmento` | string[] | `Alto`, `Medio`, `Baixo` |
| `is_recorrente` | bool | `true`=Recorrente (`qtd_pedidos_total > 1`) |
| `min_total` | float | `valor_total_gasto >= valor` |
| `max_total` | float | `valor_total_gasto <= valor` |
| `sort_by` | string | `nome`, `data_ultimo_pedido`, `valor_total_gasto` |
| `order` | string | `asc` ou `desc` |
| `page` / `size` | int | paginação |

### GET `/customers/stats`

```json
{
  "total_clientes": 58000,
  "nps_medio": 7.4,
  "nota_media": 3.8,
  "top_estado": "SP",
  "top_estado_percentual": 28.5,
  "clientes_em_risco": 1200,
  "clientes_ativos_90d": 34000,
  "segmentos": { "Alto": 8000, "Medio": 25000, "Baixo": 25000 }
}
```

### GET `/customers/{id}/comportamento`

**Query:** `?periodo=30` (janela em dias, padrão: 30)

---

## Pedidos

| Método | Rota | Auth | Role | Descrição |
|---|---|---|---|---|
| GET    | `/orders` | Sim | Qualquer | Lista paginada |
| GET    | `/orders/{id}` | Sim | Qualquer | Detalhe |
| POST   | `/orders` | Sim | Admin | Cria pedido |
| PUT    | `/orders/{id}` | Sim | Admin | Atualiza pedido |
| DELETE | `/orders/{id}` | Sim | Admin | Remove pedido → 204 |

### Query params — GET `/orders`

| Param | Tipo | Descrição |
|---|---|---|
| `status` | string[] | `Aprovado`, `Recusado`, `Reembolsado`, `Processando` |
| `categoria` | string | categoria do produto |
| `estado` | string | UF do cliente |
| `id_cliente` | string | filtra por cliente específico |
| `data_inicio` | string | `YYYY-MM-DD` |
| `data_fim` | string | `YYYY-MM-DD` |
| `nome` | string | busca em nome_produto, nome_cliente ou id_pedido |
| `valor_min` | float | `valor_total >= valor` |
| `valor_max` | float | `valor_total <= valor` |
| `sort_by` | string | `nome_produto`, `valor_total`, `data_pedido` |
| `order` | string | `asc` ou `desc` |
| `dentro_prazo` | bool | `true`=Aprovado/Processando, `false`=Recusado/Reembolsado |
| `page` / `size` | int | paginação |

**Campos extras na resposta:** `total_pendentes`, `total_aprovados`, `receita_total`

---

## Suporte

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/support` | Sim | Lista paginada de tickets |
| GET    | `/support/{id}` | Sim | Detalhe de um ticket |
| POST   | `/support` | Sim | Cria ticket |
| PUT    | `/support/{id}` | Sim | Atualiza ticket |
| DELETE | `/support/{id}` | Sim | Remove ticket → 204 |

### Query params — GET `/support`

| Param | Tipo | Descrição |
|---|---|---|
| `id_cliente` | string | filtra por cliente |
| `tipo` | string[] | `Entrega`, `Reembolso`, `Produto`, `Pagamento` |
| `status` | string[] | `Aberto`, `Resolvido` (alias para `status_ticket`) |
| `sla_estourado` | bool | filtra SLA violado |
| `data_abertura` | string | data mínima de abertura `YYYY-MM-DD` |
| `nome` | string | busca por cliente, ticket ou tipo |
| `satisfacao` | string[] | `alta`, `media`, `baixa`, `sem_avaliacao` |
| `sort_by` | string | `id_ticket`, `data_abertura`, `status_ticket` |
| `order` | string | `asc` ou `desc` |
| `page` / `size` | int | paginação |

---

## Avaliações

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/reviews` | Sim | Lista paginada |
| GET    | `/reviews/{id}` | Sim | Detalhe |
| POST   | `/reviews` | Sim | Cria avaliação |
| PUT    | `/reviews/{id}` | Sim | Atualiza avaliação |
| DELETE | `/reviews/{id}` | Sim | Remove avaliação → 204 |

### Query params — GET `/reviews`

| Param | Tipo | Descrição |
|---|---|---|
| `id_produto` | string | filtra por produto |
| `id_cliente` | string | filtra por cliente |
| `sentimento` | string | `positivo`, `neutro`, `negativo` |
| `nota_min` | int 1–5 | nota_produto mínima |
| `nota_max` | int 1–5 | nota_produto máxima |
| `page` / `size` | int | paginação |

---

## Clickstream

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET    | `/clickstream` | Sim | Lista paginada |
| GET    | `/clickstream/{id}` | Sim | Detalhe |
| POST   | `/clickstream` | Sim | Cria registro |
| PUT    | `/clickstream/{id}` | Sim | Atualiza registro |
| DELETE | `/clickstream/{id}` | Sim | Remove registro → 204 |

### Query params — GET `/clickstream`

| Param | Tipo | Descrição |
|---|---|---|
| `id_cliente` | string | filtra por cliente |
| `canal` | string | `Web`, `Mobile`, `App` |
| `data_inicio` | string | `YYYY-MM-DD` |
| `data_fim` | string | `YYYY-MM-DD` |
| `page` / `size` | int | paginação |

---

## Agente de IA

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/agent/chat` | Sim | Envia pergunta em linguagem natural |
| GET  | `/agent/suggestions` | Sim | Sugestões de perguntas pré-definidas |

### POST `/agent/chat`

```json
// Request
{ "message": "Quais os 5 produtos mais vendidos?", "session_id": null }

// Response 200
{
  "answer": "Os 5 produtos mais vendidos foram...",
  "sql_used": "SELECT nome_produto, SUM(quantidade) ...",
  "data": [{ "produto": "X", "qtd": 5200 }],
  "session_id": "uuid-da-conversa"
}
```

O `session_id` retornado deve ser enviado nas próximas mensagens para manter contexto.

---

## Códigos HTTP Utilizados

| Código | Situação |
|---|---|
| 200 | Sucesso (GET, PUT) |
| 201 | Criado (POST) |
| 204 | Excluído (DELETE) |
| 400 | Parâmetro inválido |
| 401 | Token ausente, inválido ou expirado |
| 403 | Permissão insuficiente (requer admin) |
| 404 | Recurso não encontrado |
| 422 | Falha de validação Pydantic |
| 429 | Rate limit excedido |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
