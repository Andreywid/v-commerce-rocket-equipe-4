"""Builder de prompt para o agente que explica resultados SQL."""

import json
from typing import Any

import sqlglot
from sqlglot import exp

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
            "dados_consultados": self._query_summary(sql_result.sql),
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

    @staticmethod
    def _query_summary(sql: str) -> dict[str, list[str]]:
        """
        Extrai uma descrição curta e segura do SQL para o explainer citar.

        A execução e validação já aconteceram antes deste ponto; aqui o parse é
        apenas auxiliar para transparência na resposta final. Em caso de SQL que
        o parser não entenda, retorna listas vazias em vez de bloquear a resposta.
        """

        try:
            tree = sqlglot.parse_one(sql, dialect="postgres")
        except Exception:
            return {
                "tabelas": [],
                "campos_ou_metricas": [],
            }

        cte_names = {
            cte.alias.casefold()
            for cte in tree.find_all(exp.CTE)
            if cte.alias
        }
        tables = sorted(
            {
                table.name
                for table in tree.find_all(exp.Table)
                if table.name and table.name.casefold() not in cte_names
            }
        )

        outer_select = tree if isinstance(tree, exp.Select) else tree.find(exp.Select)
        metrics = []
        if outer_select is not None:
            for projection in outer_select.expressions:
                label = ExplainerPromptBuilder._projection_label(projection)
                if label and label not in metrics:
                    metrics.append(label)
                if len(metrics) >= 8:
                    break

        return {
            "tabelas": tables,
            "campos_ou_metricas": metrics,
        }

    @staticmethod
    def _projection_label(projection: exp.Expression) -> str | None:
        alias = projection.alias
        if alias:
            return alias

        if isinstance(projection, exp.Column):
            return projection.name

        if projection.find(exp.AggFunc):
            return projection.sql(dialect="postgres", pretty=False)

        return None
