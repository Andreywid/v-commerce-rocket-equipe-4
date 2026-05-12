import json
from typing import Any

from app.models.responses import Success

EXPLAINER_SYSTEM = """
Você explica resultados de consultas SQL em português claro, para um usuário de negócio.

Regras:
- Responda de forma direta à pergunta original usando apenas os dados fornecidos (linhas JSON).
- Se não houver linhas, diga explicitamente que não houve resultados ou que a consulta não foi executada, conforme o contexto.
- Não invente números, nomes ou totais que não apareçam nos dados.
- Se os dados forem uma amostra (primeiras linhas), deixe isso claro.
- Não exponha chaves de API nem detalhes de infraestrutura.
"""


class ExplainerPromptBuilder:
    def __init__(self, max_rows: int = 80) -> None:
        self._max_rows = max_rows

    def build_prompt(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict[str, Any]],
        execution_skipped: bool,
    ) -> str:
        truncated, total = self._truncate_rows(rows)
        payload = {
            "pergunta_original": question,
            "interpretacao": sql_result.interpretation,
            "raciocinio": sql_result.reasoning,
            "premissas": sql_result.assumptions,
            "sql_executado": sql_result.sql,
            "execucao_no_banco": not execution_skipped,
            "total_linhas_retornadas": total,
            "amostra_truncada": total > len(truncated),
            "linhas_na_amostra": len(truncated),
            "amostra_linhas_json": truncated,
        }

        return (
            "# CONTEXTO (JSON)\n\n"
            f"{json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
            "# TAREFA\n\n"
            "Escreva a resposta final ao usuário com base apenas no contexto acima."
        )

    def _truncate_rows(
        self, rows: list[dict[str, Any]]
    ) -> tuple[list[dict[str, Any]], int]:
        total = len(rows)
        if total <= self._max_rows:
            return rows, total
        return rows[: self._max_rows], total