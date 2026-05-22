# Módulo de Modelos SQLAlchemy (Backend)

## Visão Geral

Os modelos ORM mapeiam as tabelas SQLite do banco `vcommerce.db`. Seis tabelas são populadas via `load_gold_data.py` (prefixo `gold_*`); uma tabela (`users`) é criada pelo `seed.py`. Todos os modelos herdam de `Base` (declarative base do SQLAlchemy 2.0).

## Responsabilidades

1. Definir o esquema físico das tabelas SQLite
2. Mapear colunas Python ↔ tipos SQL com SQLAlchemy Column
3. Servir como fonte da verdade para os repositórios
4. Refletir fielmente as colunas presentes nos CSVs Gold

## Modelo `User` (`users`)

```python
class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name            = Column(String, nullable=False)
    role            = Column(String, default="viewer")  # "admin" | "viewer"
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, server_default=func.now())
```

---

## Modelo `Product` (`gold_produto_performance`)

```python
class Product(Base):
    __tablename__ = "gold_produto_performance"

    id_produto              = Column(String, primary_key=True, index=True)
    nome_produto            = Column(String, index=True)
    categoria               = Column(String)
    preco_atual             = Column(Float)
    ativo                   = Column(Boolean, default=True)
    estoque                 = Column(Integer, nullable=True)
    descricao               = Column(String, nullable=True)
    imagem_url              = Column(String, nullable=True)

    # Métricas de vendas
    qtd_vendida_total       = Column(Integer, default=0)
    qtd_vendida_30d         = Column(Integer, default=0)
    qtd_vendida_90d         = Column(Integer, default=0)
    receita_total           = Column(Float, default=0.0)
    receita_30d             = Column(Float, default=0.0)

    # Métricas de suporte
    qtd_tickets_associados  = Column(Integer, default=0)
    qtd_tickets_30d         = Column(Integer, default=0)
    taxa_problema           = Column(Float, default=0.0)

    # Métricas de avaliações
    qtd_avaliacoes          = Column(Integer, default=0)
    nota_media              = Column(Float, nullable=True)
    pct_recomendam          = Column(Float, nullable=True)

    # Métricas de engajamento
    qtd_visualizacoes       = Column(Integer, default=0)
    qtd_carrinho            = Column(Integer, default=0)
    taxa_conversao          = Column(Float, default=0.0)

    # Classificação e referência
    classificacao           = Column(String, nullable=True)
    # Valores: "Top Vendedor" | "Estável" | "Problemático" | "Encalhado"
    data_referencia_calculo = Column(Date, nullable=True)
```

---

## Modelo `Customer` (`gold_cliente_360`)

```python
class Customer(Base):
    __tablename__ = "gold_cliente_360"

    id_cliente                  = Column(String, primary_key=True, index=True)
    nome                        = Column(String, index=True)
    email                       = Column(String, index=True)
    telefone                    = Column(String, nullable=True)
    data_cadastro               = Column(Date, nullable=True)
    cidade                      = Column(String, nullable=True)
    estado                      = Column(String(2), nullable=True)
    origem                      = Column(String, nullable=True)  # App | Web | Indicacao

    # Métricas de pedidos
    qtd_pedidos_total           = Column(Integer, default=0)
    qtd_pedidos_aprovados       = Column(Integer, default=0)
    qtd_pedidos_recusados       = Column(Integer, default=0)
    qtd_pedidos_reembolsados    = Column(Integer, default=0)
    qtd_pedidos_processando     = Column(Integer, default=0)
    valor_total_gasto           = Column(Float, default=0.0)
    ticket_medio                = Column(Float, default=0.0)
    data_primeiro_pedido        = Column(Date, nullable=True)
    data_ultimo_pedido          = Column(Date, nullable=True)

    # Métricas de suporte
    qtd_tickets_total           = Column(Integer, default=0)
    qtd_tickets_abertos         = Column(Integer, default=0)
    qtd_tickets_resolvidos      = Column(Integer, default=0)

    # Métricas de avaliações
    qtd_avaliacoes              = Column(Integer, default=0)
    nota_media_dada             = Column(Float, nullable=True)
    nps_medio_avaliacoes_cliente= Column(Float, nullable=True)

    # Métricas de comportamento
    qtd_eventos_clickstream     = Column(Integer, default=0)
    canal_preferido             = Column(String, nullable=True)  # Web | Mobile | App

    # Segmentação
    segmento_ltv                = Column(String, nullable=True)  # Alto | Medio | Baixo
    is_ativo_90d                = Column(Boolean, default=True)
    is_em_risco                 = Column(Boolean, default=False)
    data_referencia_calculo     = Column(Date, nullable=True)
```

---

## Modelo `Order` (`gold_pedidos_enriquecidos`)

```python
class Order(Base):
    __tablename__ = "gold_pedidos_enriquecidos"

    id_pedido         = Column(String, primary_key=True)
    id_cliente        = Column(String)
    id_produto        = Column(String)
    data_pedido       = Column(Date)
    quantidade        = Column(Integer)
    valor_unitario    = Column(Float)
    valor_total       = Column(Float)
    status            = Column(String)    # Aprovado | Recusado | Reembolsado | Processando
    metodo_pagamento  = Column(String)    # Cartao | PIX | Boleto | App
    nome_cliente      = Column(String)
    estado_cliente    = Column(String, nullable=True)
    nome_produto      = Column(String)
    categoria_produto = Column(String)
    ano               = Column(Integer)
    mes               = Column(Integer)
    trimestre         = Column(Integer)
```

---

## Modelo `SupportTicket` (`gold_tickets`)

```python
class SupportTicket(Base):
    __tablename__ = "gold_tickets"

    id_ticket               = Column(String, primary_key=True)
    id_cliente              = Column(String)
    id_pedido               = Column(String, nullable=True)
    id_produto              = Column(String, nullable=True)
    tipo_problema           = Column(String)  # Entrega | Reembolso | Produto | Pagamento
    satisfacao_atendimento  = Column(String)  # alta | media | baixa | sem_avaliacao
    data_abertura           = Column(Date)
    data_resolucao          = Column(Date, nullable=True)
    tempo_resolucao_horas   = Column(Float, nullable=True)
    agente_suporte          = Column(String)
    nota_avaliacao          = Column(Integer, nullable=True)
    status_ticket           = Column(String)  # Aberto | Resolvido
    sla_estourado           = Column(Boolean, default=False)
    nome_cliente            = Column(String)
    nome_produto            = Column(String, nullable=True)
    data_referencia_calculo = Column(Date, nullable=True)
```

---

## Modelo `Review` (`gold_avaliacoes`)

```python
class Review(Base):
    __tablename__ = "gold_avaliacoes"

    id_avaliacao      = Column(String, primary_key=True)
    id_cliente        = Column(String)
    id_pedido         = Column(String)
    id_produto        = Column(String)
    nota_produto      = Column(Integer, nullable=True)   # 1–5
    nota_nps          = Column(Integer, nullable=True)   # 0–10
    recomenda         = Column(Boolean)
    comentario        = Column(String, nullable=True)
    sentimento        = Column(String, nullable=True)    # positivo | neutro | negativo
    data_avaliacao    = Column(Date)
    nome_produto      = Column(String)
    categoria_produto = Column(String, nullable=True)
    nome_cliente      = Column(String)
```

---

## Modelo `DashboardKPI` (`gold_vendas_kpis`)

```python
class DashboardKPI(Base):
    __tablename__ = "gold_vendas_kpis"

    id                          = Column(Integer, primary_key=True, autoincrement=True)
    ano                         = Column(Integer)
    mes                         = Column(Integer)
    ano_mes                     = Column(String)    # "2025-01"
    qtd_pedidos                 = Column(Integer)
    qtd_pedidos_aprovados       = Column(Integer)
    qtd_pedidos_recusados       = Column(Integer)
    qtd_pedidos_reembolsados    = Column(Integer)
    qtd_pedidos_processando     = Column(Integer)
    receita_bruta               = Column(Float)
    ticket_medio                = Column(Float)
    qtd_clientes_unicos         = Column(Integer)
    qtd_clientes_novos          = Column(Integer)
    taxa_aprovacao              = Column(Float)
    taxa_recusa                 = Column(Float)
    taxa_reembolso              = Column(Float)
    categoria_mais_vendida      = Column(String)
    estado_maior_receita        = Column(String)
    data_referencia_calculo     = Column(Date)
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [repositorios.md](repositorios.md) | ← usa | Repositórios fazem queries sobre os modelos |
| [schemas.md](schemas.md) | ↔ | Schemas leem campos dos modelos (`from_attributes=True`) |
| [banco-de-dados.md](banco-de-dados.md) | contexto | Origem dos dados (CSVs Gold, seed.py) |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/models/user.py` | Modelo User (tabela users) |
| `app/models/product.py` | Modelo Product (gold_produto_performance) |
| `app/models/customer.py` | Modelo Customer (gold_cliente_360) |
| `app/models/order.py` | Modelo Order (gold_pedidos_enriquecidos) |
| `app/models/support_ticket.py` | Modelo SupportTicket (gold_tickets) |
| `app/models/review.py` | Modelo Review (gold_avaliacoes) |
| `app/models/dashboard_kpi.py` | Modelo DashboardKPI (gold_vendas_kpis) |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
