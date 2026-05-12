import os
import sys
from dataclasses import dataclass
from typing import Annotated, Literal

import asyncpg
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from pydantic_ai import Agent

from datetime import datetime

from app.database.schema_registry import get_schema_prompt
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES

load_dotenv()

# ============================================
# Corrige encoding no Windows
# ============================================

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(
                encoding="utf-8",
                errors="replace"
            )
        except Exception:
            pass

# ============================================
# DEPENDÊNCIAS
# ============================================

@dataclass
class Deps:
    conn: asyncpg.Connection | None

# ============================================
# RESPONSE MODELS
# ============================================

class Success(BaseModel):
    kind: Literal["success"] = "success"

    interpretation: str = Field(
        description="Interpretação objetiva da pergunta"
    )

    reasoning: list[str] = Field(
        default_factory=list,
        description="Passos lógicos utilizados"
    )

    sql: str = Field(
        description="SQL PostgreSQL seguro"
    )

    assumptions: list[str] = Field(
        default_factory=list,
        description="Premissas assumidas"
    )


class InvalidRequest(BaseModel):
    kind: Literal["invalid"] = "invalid"

    error_message: str = Field(
        description="Erro de segurança ou solicitação inválida"
    )


Response = Annotated[
    Success | InvalidRequest,
    Field(discriminator="kind")
]

# ============================================
# SYSTEM PROMPT
# ============================================

SYSTEM_PROMPT = """
Você é um especialista em Text-to-SQL para PostgreSQL.

Sua função é converter perguntas
em linguagem natural para SQL seguro.

Você deve agir como um compilador SQL determinístico.

REGRAS OBRIGATÓRIAS:

- Gere apenas SELECT
- Nunca gere:
  INSERT
  UPDATE
  DELETE
  DROP
  ALTER
  CREATE
  TRUNCATE
  PRAGMA

- Nunca invente:
  - tabelas
  - colunas
  - relacionamentos

- Utilize apenas o schema fornecido

- Utilize JOIN explícito

- Use aliases claros

- SQL deve ser compatível com PostgreSQL

- Em consultas amplas use LIMIT 100

- Pense passo a passo antes de gerar SQL
"""

# ============================================
# PROMPT BUILDER
# ============================================

def build_prompt(
    question: str,
    schema: str,
    examples: list[str],
    values: list[str],
    current_date: str,
) -> str:
    current_date = current_date

    examples_text = "\n\n".join(examples)

    values_text = "\n".join(
        f"- {v}" for v in values
    )

    return f"""
# DATABASE SCHEMA

{schema}

# VALUE EXAMPLES

{values_text}

# FEW SHOT EXAMPLES

{examples_text}

# USER QUESTION

{question}

# CURRENT DATE

{current_date}

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
   - se SQL é PostgreSQL válido

4. Gere SQL final seguro
"""

# ============================================
# SQL VALIDATION
# ============================================

FORBIDDEN_COMMANDS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "PRAGMA",
}

def validate_sql(sql: str):

    sql_upper = sql.upper()

    for command in FORBIDDEN_COMMANDS:

        if command in sql_upper:

            raise ValueError(
                f"Comando proibido detectado: {command}"
            )

# ============================================
# TEXT TO SQL AGENT
# ============================================

class AgentTextToSQLClient:

    def __init__(
        self,
        model_name: str = "llama-3.1-8b-instant",
        max_retries: int = 3,
    ):

        model = f"groq:{model_name}"

        self.agent = Agent(
            model=model,
            deps_type=Deps,
            output_type=Response,
            retries=max_retries,
            system_prompt=SYSTEM_PROMPT,
        )

    def generate_sql(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:

        prompt = build_prompt(
            question=question,
            schema=get_schema_prompt(),
            examples=SQL_EXAMPLES,
            values=VALUE_EXAMPLES,
            current_date=datetime.now().strftime("%Y-%m-%d"),
        )

        result = self.agent.run_sync(
            prompt,
            deps=deps,
        )

        output = result.output

        # valida SQL se sucesso
        if isinstance(output, Success):
            validate_sql(output.sql)

        return output

# ============================================
# MAIN
# ============================================

if __name__ == "__main__":

    client = AgentTextToSQLClient()

    deps = Deps(conn=None)

    question = "Qual foi o total faturado no mês passado?"

    try:

        response = client.generate_sql(
            question=question,
            deps=deps,
        )

        if isinstance(response, InvalidRequest):

            print("\n⚠️ Solicitação inválida")
            print(response.error_message)

        else:

            print("\n✅ SQL gerado com sucesso\n")

            print("INTERPRETAÇÃO:")
            print(response.interpretation)

            print("\nREASONING:")
            for step in response.reasoning:
                print(f"- {step}")

            print("\nSQL:")
            print(response.sql)

            print("\nPREMISSAS:")
            for item in response.assumptions:
                print(f"- {item}")

    except Exception as e:

        print(f"\n❌ Erro fatal: {e}")