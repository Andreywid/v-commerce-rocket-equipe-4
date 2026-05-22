# Módulo de Repositórios (Backend)

## Visão Geral

Os repositórios encapsulam toda a lógica de acesso ao banco de dados. Abrem e fecham a sessão SQLAlchemy de forma independente (padrão `SessionLocal()`), sem depender do ciclo de vida da requisição HTTP.

## Responsabilidades

1. Executar queries SQLAlchemy com filtros, ordenação e paginação
2. Retornar tuplas `(list[Model], total_count)` para listas paginadas
3. Gerar IDs no padrão de negócio (ex: `PROD-XXXX`)
4. Aplicar updates parciais (somente campos não-None)
5. Abstrair operações de banco dos serviços

## Arquitetura Interna

### Padrão geral de listagem com filtros

```python
def get_all(filtros..., page=1, size=20) -> tuple[list[Model], int]:
    with SessionLocal() as db:
        query = db.query(Model)

        # Filtros exatos
        if filtro_a:
            query = query.filter(Model.campo_a == filtro_a)

        # Filtros de busca parcial (case-insensitive)
        if filtro_b:
            query = query.filter(Model.campo_b.ilike(f"%{filtro_b}%"))

        # Filtros de lista (IN)
        if lista_c:
            query = query.filter(Model.campo_c.in_(lista_c))

        # Filtros de range
        if min_val:
            query = query.filter(Model.valor >= min_val)
        if max_val:
            query = query.filter(Model.valor <= max_val)

        # Ordenação
        if sort_by and sort_by in _SORTABLE:
            col = getattr(Model, sort_by)
            query = query.order_by(desc(col) if order == "desc" else asc(col))

        total = query.count()
        items = query.offset((page - 1) * size).limit(size).all()
        return items, total
```

### Padrão de update parcial

```python
def update(id: str, data: dict) -> Model | None:
    with SessionLocal() as db:
        obj = db.query(Model).filter(Model.pk == id).first()
        if not obj:
            return None
        for key, value in data.items():
            if value is not None:        # atualiza apenas campos enviados
                setattr(obj, key, value)
        db.commit()
        db.refresh(obj)
        return obj
```

---

## `product_repository.py`

```python
get_all(
    categorias: list[str] | None,
    ativo: bool | None,
    nome: str | None,         # ilike em nome_produto OR id_produto
    preco_min: float | None,
    preco_max: float | None,
    sort_by: str | None,      # _SORTABLE = {qtd_vendida_total, nota_media, preco_atual, receita_total}
    order: str | None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[Product], int]
# Nota: sort por nota_media adiciona filtro NOT NULL antes de ordenar
#       (evita que produtos sem nota apareçam no topo)

get_by_id(id_produto: str) -> Product | None
get_performance(id_produto: str) -> Product | None
get_reviews(id_produto: str, page: int, size: int) -> tuple[list[Review], int]

create(data: dict) -> Product
# Geração de ID:
#   1. Busca MAX(id_produto) WHERE id_produto LIKE 'PROD-%'
#   2. Extrai número, incrementa, formata: PROD-0001 ... PROD-9999
#   3. Seta: classificacao="Estável", data_referencia_calculo=date.today()
#            + todos os campos numéricos = 0

update(id_produto: str, data: dict) -> Product | None
delete(id_produto: str) -> bool
```

---

## `dashboard_repository.py`

```python
get_kpis(periodo: str) -> list[dict]
# 1. Busca todos os DashboardKPI ORDER BY ano_mes ASC
# 2. _PERIODOS_VALIDOS = {"3m": 3, "6m": 6, "12m": 12, "all": 9999}
# 3. Fatia: registros[-meses_count:]
# 4. Retorna como list[dict] (model_to_dict)

get_top_regioes(limit: int = 5) -> list[dict]
# SELECT estado_cliente, SUM(valor_total) as receita
# FROM gold_pedidos_enriquecidos
# GROUP BY estado_cliente
# ORDER BY receita DESC
# LIMIT limit
# + calcula percentual de cada estado sobre o total geral

get_top_categorias(limit: int = 5) -> list[dict]
# SELECT categoria_produto, SUM(quantidade) as qtd_vendida
# FROM gold_pedidos_enriquecidos
# GROUP BY categoria_produto
# ORDER BY qtd_vendida DESC
# LIMIT limit
# + calcula percentual
```

---

## `customer_repository.py`

```python
get_all(
    nome: str | None,
    email: str | None,
    estado: list[str] | None,
    segmento: list[str] | None,
    is_recorrente: bool | None,  # True → qtd_pedidos_total > 1
    min_total: float | None,
    max_total: float | None,
    sort_by: str | None,
    order: str | None,
    page: int, size: int,
) -> tuple[list[Customer], int, int]  # (items, total, segmento_alto)

get_by_id(id_cliente: str) -> Customer | None
get_perfil_360(id_cliente: str) -> Customer | None
get_orders(id_cliente: str, page, size) -> tuple[list[Order], int]
get_tickets(id_cliente: str, page, size) -> tuple[list[SupportTicket], int]
get_reviews(id_cliente: str, page, size) -> tuple[list[Review], int]
get_clickstream(id_cliente: str, periodo_dias: int) -> list[Clickstream]
get_stats() -> dict   # agrega: total, nps_medio, nota_media, top_estado, segmentos, etc.

create(data: dict) -> Customer
update(id_cliente: str, data: dict) -> Customer | None
delete(id_cliente: str) -> bool
```

---

## `order_repository.py`

```python
get_all(
    status: list[str] | None,
    categoria: str | None,
    estado: str | None,
    id_cliente: str | None,
    data_inicio: str | None,
    data_fim: str | None,
    nome: str | None,          # busca em nome_produto, nome_cliente, id_pedido
    valor_min: float | None,
    valor_max: float | None,
    sort_by: str | None,
    order: str | None,
    dentro_prazo: bool | None, # True → status IN (Aprovado, Processando)
    page: int, size: int,
) -> tuple[list[Order], int, int, int, float]
# Retorna: (items, total, total_pendentes, total_aprovados, receita_total)

get_by_id(id_pedido: str) -> Order | None
create(data: dict) -> Order
update(id_pedido: str, data: dict) -> Order | None
delete(id_pedido: str) -> bool
```

---

## `support_repository.py`

```python
get_all(
    id_cliente: str | None,
    tipo: list[str] | None,
    status: list[str] | None,    # mapeado para status_ticket
    sla_estourado: bool | None,
    data_abertura: str | None,
    nome: str | None,
    satisfacao: list[str] | None,
    sort_by: str | None,
    order: str | None,
    page: int, size: int,
) -> tuple[list[SupportTicket], int]

get_by_id(id_ticket: str) -> SupportTicket | None
create(data: dict) -> SupportTicket
update(id_ticket: str, data: dict) -> SupportTicket | None
delete(id_ticket: str) -> bool
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [servicos.md](servicos.md) | ← usa | Serviços chamam repositórios e tratam 404 |
| [modelos.md](modelos.md) | ← usa | Repositórios fazem queries sobre os modelos |
| [banco-de-dados.md](banco-de-dados.md) | ← usa | SessionLocal para criar sessões |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/repositories/product_repository.py` | CRUD + geração PROD-XXXX + filtros de produto |
| `app/repositories/dashboard_repository.py` | KPIs, top regiões, top categorias |
| `app/repositories/customer_repository.py` | CRUD + perfil 360 + stats + sub-recursos |
| `app/repositories/order_repository.py` | CRUD + filtros + totais agregados |
| `app/repositories/support_repository.py` | CRUD + filtros de ticket |
| `app/repositories/review_repository.py` | CRUD + filtros de avaliação |
| `app/repositories/user_repository.py` | get_by_id, get_by_email (usado em auth) |

## Glossário

| Termo | Significado |
|---|---|
| `ilike` | `LIKE` case-insensitive no SQLAlchemy |
| `SessionLocal()` | Factory de sessão SQLAlchemy; usada como context manager nos repositórios |
| update parcial | Atualiza somente campos com valor não-None; permite PATCH-style updates via PUT |
| `_SORTABLE` | Set de strings com nomes de campos válidos para ordenação (evita SQL injection) |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
