import json
from typing import Any

from pydantic import BaseModel, Field
from pydantic_ai import Agent

from app.models.responses import Success

_EXPLAINER_SYSTEM = """
Você explica resultados de consultas SQL em português claro, para um usuário de negócio.

Regras:
- Responda de forma direta à pergunta original usando apenas os dados fornecidos (linhas JSON).
- Se não houver linhas, diga explicitamente que não houve resultados ou que a consulta não foi executada, conforme o contexto.
- Não invente números, nomes ou totais que não apareçam nos dados.
- Se os dados forem uma amostra (primeiras linhas), deixe isso claro.
- Não exponha chaves de API nem detalhes de infraestrutura.
"""


class _ExplanationOut(BaseModel):
    text: str = Field(description="Resposta final em português para o usuário")


class ResultExplainer:
    """Gera texto em linguagem natural a partir da pergunta, do plano SQL e das linhas retornadas."""

    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        max_retries: int = 2,
        max_rows_in_prompt: int = 80,
    ) -> None:
        self._max_rows = max_rows_in_prompt
        self._agent = Agent(
            model=f"groq:{model_name}",
            output_type=_ExplanationOut,
            retries=max_retries,
            system_prompt=_EXPLAINER_SYSTEM,
        )

    def explain(
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
        prompt = (
            "# CONTEXTO (JSON)\n\n"
            f"{json.dumps(payload, ensure_ascii=False, default=str)}\n\n"
            "# TAREFA\n\n"
            "Escreva a resposta final ao usuário com base apenas no contexto acima."
        )
        result = self._agent.run_sync(prompt)
        return result.output.text

    def _truncate_rows(
        self, rows: list[dict[str, Any]]
    ) -> tuple[list[dict[str, Any]], int]:
        total = len(rows)
        if total <= self._max_rows:
            return rows, total
        return rows[: self._max_rows], total
