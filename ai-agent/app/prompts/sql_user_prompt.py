"""Corpo do prompt de usuário do agente Text-to-SQL (schema + motor + pergunta)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

SqlDialect = Literal["postgresql", "sqlite"]

SQLITE_TARGET_ENGINE_SECTION = """
# TARGET DATABASE ENGINE

SQLite 3 — a consulta será executada neste processo (mock local).

Regras obrigatórias de sintaxe:
- Não use INTERVAL, DATE_TRUNC nem funções exclusivas do PostgreSQL.
- Datas relativas: date('now'), datetime('now') e modificadores como '-6 months', 'start of month'.
- Colunas ano_mes nas tabelas gold são TEXT no formato 'YYYY-MM'. Para "últimos N meses", compare com
  strftime('%Y-%m', date('now', '-6 months')) (ajuste o modificador conforme N e a pergunta).
- "Último mês" = mês completo anterior ao mês atual. Use data >= date('now','start of month','-1 month')
    AND data < date('now','start of month'), ou ano_mes = strftime('%Y-%m', date('now','start of month','-1 month')).
- Não use ILIKE; para ignorar maiúsculas use lower(coluna) LIKE lower('%padrão%') ou LIKE ... COLLATE NOCASE.
""".strip()

POSTGRES_TARGET_ENGINE_SECTION = """
# TARGET DATABASE ENGINE

PostgreSQL. Use sintaxe e funções habituais do PostgreSQL (por exemplo DATE_TRUNC, INTERVAL, ILIKE, CURRENT_DATE).
""".strip()

SQL_TEXT_TO_SQL_USER_TEMPLATE = """
# DATABASE SCHEMA

{schema}

{engine}

# VALUE EXAMPLES

{values_text}

# FEW SHOT EXAMPLES

{examples_text} 

# USER QUESTION

{question}

# CURRENT DATE

{current_date}

# DEFAULT RESOLUTION RULES

- Se a pergunta pedir crescimento, variação, evolução, maior aumento ou maior queda
  de receita/KPIs sem período explícito, não rejeite por falta de período.
- Use a data corrente acima e assuma os últimos 12 meses completos anteriores ao mês
  corrente como janela padrão; registre essa premissa em assumptions.
- Se a pergunta pedir crescimento por região, derive macro-região brasileira a partir
  de estado_cliente/estado com CASE e compare o primeiro mês contra o último mês da
  janela.
- Ao derivar macro-região, use ELSE NULL para valores que não são estados válidos e
  filtre regiao IS NOT NULL antes de ordenar/ranquear; não retorne "Indefinida".

# EXECUTION STRATEGY

Antes de gerar SQL:

1. Identifique:
   - entidades
   - métricas
   - filtros
   - agregações

2. Determine:
   - tabelas necessárias
   - joins necessários

3. Verifique:
   - se colunas existem
   - se joins fazem sentido
   - se o SQL é válido para o motor descrito em TARGET DATABASE ENGINE

4. Gere SQL final seguro

5. Sempre responda em português brasileiro.
""".strip()


def target_database_engine_section(dialect: SqlDialect) -> str:
    """Bloco de instruções do motor alvo (SQLite mock ou PostgreSQL)."""

    if dialect == "sqlite":
        return SQLITE_TARGET_ENGINE_SECTION
    return POSTGRES_TARGET_ENGINE_SECTION


def build_sql_text_to_sql_user_prompt(
    *,
    schema: str,
    examples_text: str,
    values_text: str,
    question: str,
    current_date: datetime,
    dialect: SqlDialect = "postgresql",
) -> str:
    """Monta o prompt de usuário enviado ao agente Text-to-SQL."""

    engine = target_database_engine_section(dialect)
    current_date_str = current_date.strftime("%Y-%m-%d")
    return SQL_TEXT_TO_SQL_USER_TEMPLATE.format(
        schema=schema,
        engine=engine,
        values_text=values_text,
        examples_text=examples_text,
        question=question,
        current_date=current_date_str,
    )
