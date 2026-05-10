"""
Fluxo: pergunta → SQL (AgentTextToSQLClient) → validate_sql → execução → explainer → OrchestratorResult.
"""

from __future__ import annotations

from app.agents.explainer import ResultExplainer
from app.agents.sql_generator import AgentTextToSQLClient
from app.database.executor import QueryExecutor
from app.models.deps import Deps
from app.models.responses import InvalidRequest, OrchestratorResult, Success
from app.security.sql_validator import validate_sql


class AgentOrchestrator:
    def __init__(
        self,
        sql_client: AgentTextToSQLClient | None = None,
        executor: QueryExecutor | None = None,
        explainer: ResultExplainer | None = None,
    ) -> None:
        self._sql = sql_client or AgentTextToSQLClient()
        self._executor = executor or QueryExecutor()
        self._explainer = explainer or ResultExplainer()

    async def ask(self, question: str, deps: Deps) -> OrchestratorResult:
        generated = self._sql.generate_sql(question, deps)

        if isinstance(generated, InvalidRequest):
            return OrchestratorResult(
                explanation=generated.error_message,
                error=generated.error_message,
            )

        try:
            validate_sql(generated.sql)
        except ValueError as exc:
            msg = f"SQL rejeitado na validação: {exc}"
            return OrchestratorResult(
                explanation=msg,
                sql=generated.sql,
                interpretation=generated.interpretation,
                reasoning=generated.reasoning,
                assumptions=generated.assumptions,
                error=str(exc),
            )

        rows: list[dict] = []
        execution_skipped = deps.conn is None

        if deps.conn is not None:
            try:
                rows = await self._executor.execute(deps.conn, generated.sql)
            except Exception as exc:
                msg = f"Erro ao executar a consulta no banco: {exc}"
                return OrchestratorResult(
                    explanation=msg,
                    sql=generated.sql,
                    interpretation=generated.interpretation,
                    reasoning=generated.reasoning,
                    assumptions=generated.assumptions,
                    error=str(exc),
                )

        explanation = self._explainer.explain(
            question=question,
            sql_result=generated,
            rows=rows,
            execution_skipped=execution_skipped,
        )

        return OrchestratorResult(
            explanation=explanation,
            sql=generated.sql,
            rows=rows,
            interpretation=generated.interpretation,
            reasoning=generated.reasoning,
            assumptions=generated.assumptions,
        )
