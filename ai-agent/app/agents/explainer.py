"""Agente que transforma SQL e linhas retornadas em resposta de negócio."""

from typing import Any

from pydantic_ai import Agent

from app.agents.model_config import configure_provider_api_keys, get_model_name
from app.models.responses import Success
from app.prompts.explainer_prompt_builder import (
    EXPLAINER_SYSTEM,
    ExplainerPromptBuilder,
)


class ResultExplainer:
    """Gera texto em linguagem natural a partir da pergunta, do plano SQL e das linhas retornadas."""

    def __init__(
        self,
        model_name: str | None = None,
        max_retries: int = 2,
        max_rows_in_prompt: int = 10,
    ) -> None:
        configure_provider_api_keys()
        model = model_name or get_model_name()
        self._prompt_builder = ExplainerPromptBuilder(max_rows=max_rows_in_prompt)
        self._agent = Agent(
            model=model,
            output_type=str,
            retries=max_retries,
            system_prompt=EXPLAINER_SYSTEM,
        )

    def _build_prompt(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict[str, Any]],
        execution_skipped: bool,
    ) -> str:
        """Delegação fina para manter a montagem do prompt testável."""

        return self._prompt_builder.build_prompt(
            question=question,
            sql_result=sql_result,
            rows=rows,
            execution_skipped=execution_skipped,
        )

    def explain(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict[str, Any]],
        execution_skipped: bool,
    ) -> str:
        """Gera explicação em modo síncrono."""

        result = self._agent.run_sync(
            self._build_prompt(
                question=question,
                sql_result=sql_result,
                rows=rows,
                execution_skipped=execution_skipped,
            )
        )

        return result.output

    async def explain_async(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict[str, Any]],
        execution_skipped: bool,
    ) -> str:
        """Gera explicação em modo assíncrono para o fluxo da API."""

        result = await self._agent.run(
            self._build_prompt(
                question=question,
                sql_result=sql_result,
                rows=rows,
                execution_skipped=execution_skipped,
            )
        )

        return result.output
