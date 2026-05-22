# Módulo de Serviços (Backend)

## Visão Geral

A camada de serviços fica entre os routers e os repositórios. Aplica regras de negócio, valida pré-condições (ex: período inválido) e lança `HTTPException` para erros de domínio (404, 400). Os routers delegam toda a lógica de negócio para os serviços.

## Responsabilidades

1. Orquestrar chamadas a repositórios
2. Lançar `HTTPException(404)` quando recursos não existem
3. Validar parâmetros de negócio e lançar `HTTPException(400)` quando inválidos
4. Converter dados brutos do repositório para schemas de resposta
5. Isolar os routers de qualquer conhecimento de banco de dados

## Arquitetura Interna

### Padrão dos serviços CRUD

```python
# Padrão geral aplicado em product, customer, order, support, review, clickstream

def get_xxx_list(filtros...) -> XxxListResponse:
    items, total = xxx_repository.get_all(filtros...)
    return XxxListResponse(total=total, page=page, size=size, items=items)

def get_xxx_by_id(id: str) -> XxxOut:
    obj = xxx_repository.get_by_id(id)
    if not obj:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    return XxxOut.model_validate(obj)

def create_xxx(data: XxxCreate) -> XxxOut:
    obj = xxx_repository.create(data.model_dump())
    return XxxOut.model_validate(obj)

def update_xxx(id: str, data: XxxUpdate) -> XxxOut:
    obj = xxx_repository.update(id, data.model_dump(exclude_none=True))
    if not obj:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
    return XxxOut.model_validate(obj)

def delete_xxx(id: str) -> None:
    success = xxx_repository.delete(id)
    if not success:
        raise HTTPException(status_code=404, detail="Recurso não encontrado")
```

---

## `dashboard_service.py`

```python
_PERIODOS_VALIDOS = {"3m", "6m", "12m", "all"}

def get_kpis(periodo: str) -> KPIsResponse:
    if periodo not in _PERIODOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Período inválido. Use: {', '.join(_PERIODOS_VALIDOS)}"
        )
    meses = dashboard_repository.get_kpis(periodo)
    return KPIsResponse(periodo=periodo, meses=meses)

def get_top_regioes() -> TopRegioesResponse:
    regioes = dashboard_repository.get_top_regioes(limit=5)
    return TopRegioesResponse(regioes=regioes)

def get_top_categorias() -> TopCategoriasResponse:
    categorias = dashboard_repository.get_top_categorias(limit=5)
    return TopCategoriasResponse(categorias=categorias)
```

---

## `auth_service.py`

```python
def login(db: Session, email: str, password: str) -> tuple[str, User]:
    user = user_repository.get_by_email(db, email)
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Credenciais inválidas"
        )
    token = create_access_token({"sub": str(user.id)})
    return token, user
```

---

## `customer_service.py` — regras específicas

```python
def get_stats() -> CustomerStats:
    # Agrega: total, nps_medio, nota_media, top_estado (+percentual),
    #         clientes_em_risco, clientes_ativos_90d, segmentos
    stats = customer_repository.get_stats()
    return CustomerStats(**stats)

def get_perfil_360(id_cliente: str) -> Customer360:
    obj = customer_repository.get_perfil_360(id_cliente)
    if not obj:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return Customer360.model_validate(obj)

def get_comportamento(id_cliente: str, periodo_dias: int) -> list[ClickstreamOut]:
    items = customer_repository.get_clickstream(id_cliente, periodo_dias)
    return [ClickstreamOut.model_validate(i) for i in items]
```

---

## `product_service.py` — regras específicas

```python
def get_performance(id_produto: str) -> ProductPerformance:
    obj = product_repository.get_performance(id_produto)
    if not obj:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return ProductPerformance.model_validate(obj)

def get_reviews(id_produto: str, page: int, size: int) -> ReviewListResponse:
    items, total = product_repository.get_reviews(id_produto, page, size)
    return ReviewListResponse(total=total, page=page, size=size, items=items)
```

---

## Fluxo Completo: Criação de Produto

```
POST /products  body: ProductCreate
         │
         ▼
Router products.py
  ├── Depends(require_admin) → valida JWT + role
  └── product_service.create_product(body)
              │
              ▼
      product_repository.create(body.model_dump())
              │
              ├── Gera id_produto: PROD-XXXX
              ├── Define classificacao = "Estável"
              ├── Define campos numéricos = 0
              ├── db.add(new_product)
              └── db.commit() → db.refresh()
              │
              ▼
      ProductOut.model_validate(new_product)
              │
              ▼
      Response 201 Created { ProductOut JSON }
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [repositorios.md](repositorios.md) | ← usa | Serviços delegam operações de banco |
| [schemas.md](schemas.md) | ← usa | Serviços recebem schemas Create/Update e retornam Out |
| [endpoints.md](endpoints.md) | ← usa | Routers chamam os serviços |
| [autenticacao.md](autenticacao.md) | contexto | Routers validam JWT antes de chamar serviços |

## Tratamento de Erros

| Situação | Lançado por | HTTP | Detalhe |
|---|---|---|---|
| Recurso não encontrado | Todos os serviços | 404 | "Recurso não encontrado" |
| Período de KPI inválido | dashboard_service | 400 | Lista de períodos válidos |
| Credenciais inválidas | auth_service | 401 | "Credenciais inválidas" |
| Validação Pydantic | FastAPI (automático) | 422 | Lista de erros de campo |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/services/dashboard_service.py` | KPIs, top regiões, top categorias |
| `app/services/auth_service.py` | Login: verify + create_token |
| `app/services/product_service.py` | CRUD + performance + reviews |
| `app/services/customer_service.py` | CRUD + stats + 360 + comportamento |
| `app/services/order_service.py` | CRUD com totais |
| `app/services/support_service.py` | CRUD de tickets |
| `app/services/review_service.py` | CRUD de avaliações |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
