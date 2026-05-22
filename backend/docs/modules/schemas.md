# Módulo de Schemas Pydantic (Backend)

## Visão Geral

Os schemas Pydantic v2 definem os contratos de entrada (Create/Update) e saída (Out/ListResponse) para todas as entidades. Todos os schemas de saída usam `model_config = {"from_attributes": True}` para serialização direta de modelos SQLAlchemy.

## Responsabilidades

1. Validar corpos de requisição (POST/PUT) antes de chegar ao serviço
2. Serializar modelos ORM para JSON de resposta
3. Tratar variações de formato de data nos dados Gold
4. Garantir type safety nos campos opcionais do banco

## Convenções Globais

### Padrão de resposta paginada

Cada entidade define seu próprio `XxxListResponse` (sem base genérica):

```python
class XxxListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[XxxOut]
    # Campos extras opcionais por entidade — ver abaixo
```

### Validação de datas flexíveis

`TicketOut` e `ReviewOut` aceitam múltiplos formatos nos dados Gold:

```python
@field_validator("data_abertura", mode="before")
@classmethod
def parse_date(cls, v):
    if isinstance(v, (date, datetime)): return v
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S%z"):
        try: return datetime.strptime(str(v), fmt).date()
        except ValueError: pass
    return v  # deixa Pydantic lançar o erro nativo
```

---

## Schemas de Autenticação (`schemas/auth.py`)

```python
class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str   # "admin" | "viewer"
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut
```

---

## Schemas de Produto (`schemas/product.py`)

```python
class ProductOut(BaseModel):
    id_produto: str
    nome_produto: str
    categoria: str
    preco_atual: float
    ativo: bool
    estoque: Optional[int] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None
    qtd_vendida_total: int
    receita_total: float
    nota_media: Optional[float] = None
    qtd_tickets_associados: int
    classificacao: Optional[str] = None
    model_config = {"from_attributes": True}

class ProductPerformance(ProductOut):
    # Herda ProductOut +
    qtd_vendida_30d: int
    qtd_vendida_90d: int
    receita_30d: float
    qtd_tickets_30d: int
    taxa_problema: float
    qtd_avaliacoes: int
    pct_recomendam: Optional[float] = None
    qtd_visualizacoes: int
    qtd_carrinho: int
    taxa_conversao: float
    data_referencia_calculo: Optional[date] = None

class ProductCreate(BaseModel):
    nome_produto: str
    categoria: str
    preco_atual: float
    ativo: bool = True
    estoque: Optional[int] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None

class ProductUpdate(BaseModel):
    # Todos os campos são opcionais (PATCH-style update)
    nome_produto: Optional[str] = None
    categoria: Optional[str] = None
    preco_atual: Optional[float] = None
    ativo: Optional[bool] = None
    estoque: Optional[int] = None
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None

class ProductListResponse(BaseModel):
    total: int; page: int; size: int
    items: list[ProductOut]
```

---

## Schemas de Cliente (`schemas/customer.py`)

```python
class CustomerOut(BaseModel):
    id_cliente: str
    nome: str; email: str; telefone: Optional[str] = None
    data_cadastro: Optional[date] = None
    cidade: Optional[str] = None; estado: Optional[str] = None
    origem: Optional[str] = None
    qtd_pedidos_total: int; qtd_tickets_abertos: int
    valor_total_gasto: float; ticket_medio: float
    data_ultimo_pedido: Optional[date] = None
    segmento_ltv: Optional[str] = None
    is_ativo_90d: bool; is_em_risco: bool
    model_config = {"from_attributes": True}

class Customer360(CustomerOut):
    # Herda CustomerOut +
    qtd_pedidos_aprovados: int; qtd_pedidos_recusados: int
    data_primeiro_pedido: Optional[date] = None
    qtd_tickets_total: int; qtd_avaliacoes: int
    nota_media_dada: Optional[float] = None
    nps_medio_avaliacoes_cliente: Optional[float] = None
    qtd_eventos_clickstream: int; canal_preferido: Optional[str] = None

class CustomerCreate(BaseModel):
    nome: str
    email: EmailStr    # pydantic.EmailStr — valida formato de e-mail
    telefone: Optional[str] = None
    cidade: Optional[str] = None
    estado: Optional[str] = None
    origem: Optional[str] = None

class CustomerListResponse(BaseModel):
    total: int; page: int; size: int
    items: list[CustomerOut]
    segmento_alto: int   # campo extra: total de clientes com segmento "Alto"

class CustomerStats(BaseModel):
    total_clientes: int; nps_medio: float; nota_media: float
    top_estado: str; top_estado_percentual: float
    clientes_em_risco: int; clientes_ativos_90d: int
    segmentos: dict[str, int]   # { "Alto": N, "Medio": N, "Baixo": N }
```

---

## Schemas de Pedido (`schemas/order.py`)

```python
class OrderOut(BaseModel):
    id_pedido: str; id_cliente: str; id_produto: str
    data_pedido: date; quantidade: int
    valor_unitario: float; valor_total: float
    status: str                 # Aprovado | Recusado | Reembolsado | Processando
    metodo_pagamento: str       # Cartao | PIX | Boleto | App
    nome_cliente: str; estado_cliente: Optional[str] = None
    nome_produto: str; categoria_produto: str
    ano: int; mes: int; trimestre: int
    model_config = {"from_attributes": True}

class OrderCreate(BaseModel):
    id_pedido: str; id_produto: str; data_pedido: date
    quantidade: int; status: str; metodo_pagamento: str

class OrderListResponse(BaseModel):
    total: int; page: int; size: int
    items: list[OrderOut]
    total_pendentes: int    # total de pedidos com status Processando
    total_aprovados: int    # total de pedidos com status Aprovado
    receita_total: float    # soma de valor_total de todos os registros (não só a página)
```

---

## Schemas de Ticket (`schemas/support_ticket.py`)

```python
class TicketOut(BaseModel):
    id_ticket: str; id_cliente: str
    id_pedido: Optional[str] = None; id_produto: Optional[str] = None
    tipo_problema: str              # Entrega | Reembolso | Produto | Pagamento
    satisfacao_atendimento: str    # alta | media | baixa | sem_avaliacao
    data_abertura: date            # validador flexível de formato
    data_resolucao: Optional[date] = None
    tempo_resolucao_horas: Optional[float] = None
    agente_suporte: str; nota_avaliacao: Optional[int] = None
    status_ticket: str             # Aberto | Resolvido
    sla_estourado: bool
    nome_cliente: str; nome_produto: Optional[str] = None
    model_config = {"from_attributes": True}

class TicketCreate(BaseModel):
    id_cliente: str
    tipo_problema: Literal["Entrega", "Reembolso", "Produto", "Pagamento"]
    agente_suporte: str; nome_cliente: str
```

---

## Schemas de Avaliação (`schemas/review.py`)

```python
class ReviewOut(BaseModel):
    id_avaliacao: str; id_cliente: str; id_pedido: str; id_produto: str
    nota_produto: Optional[int] = None   # 1–5
    nota_nps: Optional[int] = None       # 0–10
    recomenda: bool; comentario: Optional[str] = None
    sentimento: Optional[str] = None     # positivo | neutro | negativo
    data_avaliacao: date                 # validador flexível de formato
    nome_produto: str; categoria_produto: Optional[str] = None
    nome_cliente: str
    model_config = {"from_attributes": True}

class ReviewCreate(BaseModel):
    nota_produto: int = Field(..., ge=1, le=5)
    nota_nps: int = Field(..., ge=0, le=10)
    recomenda: bool
    sentimento: Optional[Literal["positivo", "neutro", "negativo"]] = None
```

---

## Schemas de Dashboard (`schemas/dashboard.py`)

```python
class VendasKPIMes(BaseModel):
    ano: int; mes: int; ano_mes: str
    qtd_pedidos: int; qtd_pedidos_aprovados: int
    qtd_pedidos_recusados: int; qtd_pedidos_reembolsados: int
    qtd_pedidos_processando: int
    receita_bruta: float; ticket_medio: float
    qtd_clientes_unicos: int; qtd_clientes_novos: int
    taxa_aprovacao: float; taxa_recusa: float; taxa_reembolso: float
    categoria_mais_vendida: str; estado_maior_receita: str
    data_referencia_calculo: date
    model_config = {"from_attributes": True}

class KPIsResponse(BaseModel):
    periodo: str
    meses: list[VendasKPIMes]

class TopRegiao(BaseModel):
    estado: str; receita: float; percentual: float

class TopCategoria(BaseModel):
    categoria: str; qtd_vendida: int; percentual: float
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [modelos.md](modelos.md) | ← usa | Schemas serializam campos dos modelos ORM |
| [repositorios.md](repositorios.md) | → alimenta | Repositórios retornam modelos; schemas convertem |
| [endpoints.md](endpoints.md) | ← usa | Routers declaram schemas nas assinaturas de função |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/schemas/auth.py` | LoginRequest, TokenResponse, UserOut |
| `app/schemas/product.py` | ProductOut, ProductPerformance, ProductCreate, ProductListResponse |
| `app/schemas/customer.py` | CustomerOut, Customer360, CustomerCreate, CustomerStats, CustomerListResponse |
| `app/schemas/order.py` | OrderOut, OrderCreate, OrderListResponse |
| `app/schemas/support_ticket.py` | TicketOut, TicketCreate, TicketListResponse |
| `app/schemas/review.py` | ReviewOut, ReviewCreate, ReviewListResponse |
| `app/schemas/dashboard.py` | VendasKPIMes, KPIsResponse, TopRegiao, TopCategoria |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
