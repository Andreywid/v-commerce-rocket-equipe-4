"""Builder de prompt para o agente que explica resultados SQL."""

import json
from typing import Any

from app.models.responses import Success
from app.prompts.explainer_prompts import (
    EXPLAINER_USER_JSON_HEADER,
    EXPLAINER_USER_TASK_SECTION,
)


class ExplainerPromptBuilder:
    """Monta contexto JSON limitado para o explainer responder sem inventar dados."""

    def __init__(self, max_rows: int = 10) -> None:
        self._max_rows = max_rows

    def build_prompt(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict[str, Any]],
        execution_skipped: bool,
    ) -> str:
        """Serializa pergunta, SQL e amostra de linhas em um prompt controlado."""

        truncated, total = self._truncate_rows(rows)
        payload = {
            "pergunta_original": question,
            "interpretacao": sql_result.interpretation,
            "sql_executado": sql_result.sql,
            "execucao_no_banco": not execution_skipped,
            "total_linhas_retornadas": total,
            "amostra_truncada": total > len(truncated),
            "linhas_na_amostra": len(truncated),
            "amostra_linhas_json": truncated,
        }

        return (
            f"{EXPLAINER_USER_JSON_HEADER}"
            f"{json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
            f"{EXPLAINER_USER_TASK_SECTION}"
        )

    def _truncate_rows(
        self, rows: list[dict[str, Any]]
    ) -> tuple[list[dict[str, Any]], int]:
        """Limita linhas no prompt para reduzir custo e exposição de dados."""

        total = len(rows)
        if total <= self._max_rows:
            return rows, total
        return rows[: self._max_rows], total
