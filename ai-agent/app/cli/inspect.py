"""Comandos de inspeção local sem chamada ao LLM."""

from __future__ import annotations

from datetime import date

from app.config import DATA_REFERENCIA_CALCULO
from app.database.schema_registry import GOLD_SCHEMA, get_schema_prompt
from app.prompts import system_prompt as system_prompt_module
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
from app.prompts.sql_prompt_builder import build_prompt as build_user_prompt_modular


def run_schema_info() -> None:
    """Usa ``get_schema_prompt`` do registry como documentação viva."""

    blob = get_schema_prompt()
    print("=== Schema Gold (registry) ===\n")
    print(f"Tabelas no GOLD_SCHEMA: {len(GOLD_SCHEMA)}")
    print(f"Tamanho do texto de schema para o LLM: {len(blob)} caracteres")
    print("\nTrecho inicial (800 chars):\n")
    print(blob[:800] + ("..." if len(blob) > 800 else ""))


def run_dry_prompt(question: str) -> None:
    """Monta o prompt do usuário com ``sql_prompt_builder`` sem chamar o LLM."""

    body = build_user_prompt_modular(
        question=question,
        schema=get_schema_prompt(),
        examples=SQL_EXAMPLES,
        values=VALUE_EXAMPLES,
        current_date=date.fromisoformat(DATA_REFERENCIA_CALCULO),
    )
    sys_prompt_len = len(system_prompt_module.SYSTEM_PROMPT.strip())
    print("=== Dry-run: prompt modular (usuário) ===\n")
    print(f"Tamanho system prompt (app.prompts.system_prompt): {sys_prompt_len} chars")
    print(f"Tamanho corpo (sql_prompt_builder + schema + few-shot): {len(body)} chars\n")
    print("--- Corpo do prompt ---\n")
    print(body)
