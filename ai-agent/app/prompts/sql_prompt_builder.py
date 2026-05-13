"""Builder do prompt de usuário enviado ao agente Text-to-SQL."""

from datetime import datetime

from app.prompts.sql_user_prompt import (
    SqlDialect,
    build_sql_text_to_sql_user_prompt,
)

__all__ = ["SqlDialect", "build_prompt"]


def build_prompt(
    question: str,
    schema: str,
    examples: list[str],
    values: list[str],
    current_date: datetime,
    *,
    dialect: SqlDialect = "postgresql",
) -> str:
    """Combina schema, exemplos, valores válidos e pergunta em um único prompt."""

    examples_text = "\n\n".join(examples)
    values_text = "\n".join(f"- {v}" for v in values)
    return build_sql_text_to_sql_user_prompt(
        schema=schema,
        examples_text=examples_text,
        values_text=values_text,
        question=question,
        current_date=current_date,
        dialect=dialect,
    )
