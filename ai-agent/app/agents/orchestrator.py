"""
Fluxo: pergunta → SQL (AgentTextToSQLClient) → validate_sql → execução → explainer → OrchestratorResult.
"""

from __future__ import annotations

import time

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
        debug: bool = True,
    ) -> None:
        self._sql = sql_client or AgentTextToSQLClient()
        self._executor = executor or QueryExecutor()
        self._explainer = explainer or ResultExplainer()
        self._debug = debug

    def _trace(self, message: str, started_at: float | None = None) -> None:
        if not self._debug:
            return

        elapsed = ""
        if started_at is not None:
            elapsed = f" ({time.perf_counter() - started_at:.2f}s)"

        print(f"[orchestrator] {message}{elapsed}", flush=True)

    async def ask(self, question: str, deps: Deps) -> OrchestratorResult:
        flow_start = time.perf_counter()
        self._trace("início do fluxo")

        sql_start = time.perf_counter()
        self._trace("iniciando agente SQL")
        try:
            generated = await self._sql.generate_sql_async(question, deps)
        except Exception as exc:
            self._trace(f"agente SQL falhou: {exc}", sql_start)
            return OrchestratorResult(
                explanation=f"Agente SQL falhou: {exc}",
                error=str(exc),
            )

        self._trace(f"agente SQL finalizado: {type(generated).__name__}", sql_start)

        if isinstance(generated, InvalidRequest):
            self._trace("fluxo encerrado por solicitação inválida", flow_start)
            return OrchestratorResult(
                explanation=generated.error_message,
                error=generated.error_message,
            )

        self._trace(f"SQL gerado: {generated.sql}")
        validation_start = time.perf_counter()
        self._trace("iniciando validação SQL")
        try:
            validate_sql(generated.sql)
        except ValueError as exc:
            msg = f"SQL rejeitado na validação: {exc}"
            self._trace(msg, validation_start)
            return OrchestratorResult(
                explanation=msg,
                sql=generated.sql,
                interpretation=generated.interpretation,
                reasoning=generated.reasoning,
                assumptions=generated.assumptions,
                error=str(exc),
            )
        self._trace("validação SQL concluída", validation_start)

        rows: list[dict] = []
        execution_skipped = deps.conn is None

        if deps.conn is not None:
            execution_start = time.perf_counter()
            self._trace("iniciando execução no banco")
            try:
                rows = await self._executor.execute(deps.conn, generated.sql)
            except Exception as exc:
                msg = f"Erro ao executar a consulta no banco: {exc}"
                self._trace(msg, execution_start)
                return OrchestratorResult(
                    explanation=msg,
                    sql=generated.sql,
                    interpretation=generated.interpretation,
                    reasoning=generated.reasoning,
                    assumptions=generated.assumptions,
                    error=str(exc),
                )
            self._trace(f"execução no banco concluída: {len(rows)} linha(s)", execution_start)
        else:
            self._trace("execução no banco pulada: deps.conn=None")

        explainer_start = time.perf_counter()
        self._trace("iniciando agente explainer")
        try:
            explanation = await self._explainer.explain_async(
                question=question,
                sql_result=generated,
                rows=rows,
                execution_skipped=execution_skipped,
            )
        except Exception as exc:
            explanation = f"SQL gerado e validado, mas o explainer falhou: {exc}"
            self._trace(f"agente explainer falhou: {exc}", explainer_start)
        else:
            self._trace("agente explainer finalizado", explainer_start)

        self._trace("fluxo finalizado", flow_start)
        return OrchestratorResult(
            explanation=explanation,
            sql=generated.sql,
            rows=rows,
            interpretation=generated.interpretation,
            reasoning=generated.reasoning,
            assumptions=generated.assumptions,
        )
