# Módulo de Banco de Dados (Backend)

## Visão Geral

O banco de dados é **SQLite**, armazenado no arquivo `backend/vcommerce.db`. A configuração de conexão usa SQLAlchemy 2.0 com `check_same_thread=False` (necessário para SQLite com FastAPI). Os dados são carregados de CSVs gerados pelo pipeline de Data Engineering (prefixo `gold_*`).

## Responsabilidades

1. Prover a conexão SQLAlchemy e o ciclo de vida da sessão
2. Criar tabelas via `Base.metadata.create_all(engine)` na inicialização
3. Injetar sessões nas rotas via `Depends(get_db)`
4. Inicializar o usuário admin via `seed.py`
5. Popular todas as tabelas Gold via `load_gold_data.py`

## Arquitetura Interna

### `database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
# Padrão: "sqlite:///./vcommerce.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
    # check_same_thread=False: necessário para SQLite com múltiplas threads (FastAPI/Uvicorn)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db         # injeta a sessão na rota
    finally:
        db.close()       # sempre fecha, mesmo em exceção
```

### Uso em rotas com `Depends(get_db)`

```python
# Usado em auth.py onde a sessão precisa ser injetada externamente:
@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, body.email, body.password)
```

Os repositórios criam suas próprias sessões com `SessionLocal()` diretamente,
sem depender de `Depends(get_db)`.

---

## Tabelas e Origens dos Dados

| Tabela SQLite | Modelo Python | Origem |
|---|---|---|
| `users` | `User` | `seed.py` |
| `gold_produto_performance` | `Product` | `data/gold/gold_produto_performance.csv` |
| `gold_cliente_360` | `Customer` | `data/gold/gold_cliente_360.csv` |
| `gold_pedidos_enriquecidos` | `Order` | `data/gold/gold_pedidos_enriquecidos.csv` |
| `gold_tickets` | `SupportTicket` | `data/gold/gold_tickets.csv` |
| `gold_avaliacoes` | `Review` | `data/gold/gold_avaliacoes.csv` |
| `gold_clickstream_resumo` | `Clickstream` | `data/gold/gold_clickstream_resumo.csv` |
| `gold_vendas_kpis` | `DashboardKPI` | `data/gold/gold_vendas_kpis.csv` |

## Volume de Dados (Dataset de Referência)

| Tabela | Registros |
|---|---|
| Produtos | 517 |
| Clientes | ~58.000 |
| Pedidos | ~284.000 |
| Tickets | ~34.000 |
| Avaliações | ~100.000 |
| Clickstream | ~100.000 |
| KPIs mensais | 41 |

---

## Script `seed.py`

Cria o usuário admin no banco. Lê as variáveis `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` do `.env`.

```bash
python seed.py
# "Usuário admin criado: admvcommerce@gmail.com"
# ou: "Usuário admin já existe." (idempotente)
```

**Comportamento:** verifica se o e-mail já existe antes de inserir. Seguro para executar múltiplas vezes.

---

## Script `load_gold_data.py`

Importa todos os CSVs da pasta `data/gold/` para o SQLite.

```bash
python load_gold_data.py
# Trunca e re-insere cada tabela Gold com os dados do CSV
```

**Comportamento:** faz `DELETE FROM <tabela>` antes de inserir. Os CSVs devem estar em `data/gold/` relativamente ao diretório `backend/`.

---

## Ordem de Inicialização

```
1. python seed.py
   └── Cria tabela `users` + insere admin
       (Base.metadata.create_all cria todas as tabelas do ORM)

2. python load_gold_data.py
   └── Trunca e popula as 7 tabelas Gold com os CSVs

3. python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   └── API disponível em :8000
```

Se `vcommerce.db` for apagado, execute os três passos novamente na ordem acima.

---

## Configuração via `.env`

```env
DATABASE_URL=sqlite:///./vcommerce.db
# Caminho relativo ao diretório de execução (backend/)
# Em produção: pode ser um PostgreSQL: postgresql://user:pass@host/db
```

A variável `DATABASE_URL` é lida por `pydantic-settings` na classe `Settings` do `config.py`.

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [modelos.md](modelos.md) | ← usa | Modelos definem as tabelas criadas pelo engine |
| [repositorios.md](repositorios.md) | ← usa | Repositórios usam `SessionLocal()` para sessões |
| [arquitetura.md](arquitetura.md) | contexto | Posição do banco na arquitetura em camadas |

## Tratamento de Erros

| Situação | Comportamento |
|---|---|
| `vcommerce.db` inexistente | Criado automaticamente pelo SQLAlchemy na primeira execução |
| CSV ausente em `data/gold/` | `load_gold_data.py` lança `FileNotFoundError` |
| Tabela vazia (sem seed/load) | Endpoints retornam `total: 0, items: []` sem erro |
| Sessão de DB não fechada | `get_db()` garante `db.close()` no `finally` |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/database.py` | engine, SessionLocal, Base, get_db() |
| `app/config.py` | DATABASE_URL via pydantic-settings |
| `seed.py` | Criação idempotente do usuário admin |
| `load_gold_data.py` | Importação bulk dos CSVs Gold |

## Glossário

| Termo | Significado |
|---|---|
| `SessionLocal` | Factory SQLAlchemy que cria sessões com `autocommit=False, autoflush=False` |
| `Base` | Classe base declarativa SQLAlchemy; todos os modelos herdam dela |
| `check_same_thread` | Flag SQLite que permite uso da conexão em múltiplas threads |
| `vcommerce.db` | Arquivo binário do banco SQLite; todo o estado do sistema |
| Tabela Gold | Tabela populada pelos CSVs do pipeline de Data Engineering |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
