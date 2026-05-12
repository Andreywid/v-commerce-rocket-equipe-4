"""
Fluxo: pergunta → SQL (AgentTextToSQLClient) → validate_sql → execução → explainer → OrchestratorResult.
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING

from app.database.executor import QueryExecutor
from app.models.deps import Deps
from app.models.responses import InvalidRequest, OrchestratorResult, Success
from app.security.guardrails import PolicyViolation, QueryPolicy
from app.security.sql_validator import validate_sql

if TYPE_CHECKING:
    from app.agents.explainer import ResultExplainer
    from app.agents.sql_generator import AgentTextToSQLClient


class AgentOrchestrator:
    """Coordena guardrails, geração SQL, execução opcional e explicação final."""

    def __init__(
        self,
        sql_client: AgentTextToSQLClient | None = None,
        executor: QueryExecutor | None = None,
        explainer: ResultExplainer | None = None,
        policy: QueryPolicy | None = None,
        debug: bool = True,
    ) -> None:
        self._sql = sql_client
        self._executor = executor or QueryExecutor()
        self._explainer = explainer
        self._policy = policy or QueryPolicy()
        self._debug = debug

    @property
    def _sql_client(self) -> AgentTextToSQLClient:
        """Carrega o cliente LLM apenas quando o fluxo realmente precisa dele."""

        if self._sql is None:
            from app.agents.sql_generator import AgentTextToSQLClient

            self._sql = AgentTextToSQLClient()

        return self._sql

    @property
    def _result_explainer(self) -> ResultExplainer:
        """Inicializa o explainer sob demanda para facilitar testes com fakes."""

        if self._explainer is None:
            from app.agents.explainer import ResultExplainer

            self._explainer = ResultExplainer()

        return self._explainer

    def _trace(self, message: str, started_at: float | None = None) -> None:
        """Emite logs simples de progresso quando o modo debug está ativo."""

        if not self._debug:
            return

        elapsed = ""
        if started_at is not None:
            elapsed = f" ({time.perf_counter() - started_at:.2f}s)"

        print(f"[orchestrator] {message}{elapsed}", flush=True)

    async def ask(self, question: str, deps: Deps) -> OrchestratorResult:
        """Executa o fluxo completo de Text-to-SQL para uma pergunta do usuário."""

        flow_start = time.perf_counter()
        self._trace("início do fluxo")

        policy_result = self._validate_question_policy(question, deps, flow_start)
        if policy_result is not None:
            return policy_result

        generated = await self._generate_sql(question, deps)
        if isinstance(generated, OrchestratorResult):
            return generated

        if isinstance(generated, InvalidRequest):
            return self._invalid_request_result(generated, flow_start)

        validated = self._validate_generated_sql(generated)
        if isinstance(validated, OrchestratorResult):
            return validated
        generated = validated

        policy_result = self._validate_execution_policy(generated, deps)
        if policy_result is not None:
            return policy_result

        rows, execution_skipped, execution_error = await self._execute_sql(
            generated,
            deps,
        )
        if execution_error is not None:
            return execution_error

        explanation = await self._explain_result(
            question=question,
            generated=generated,
            rows=rows,
            execution_skipped=execution_skipped,
        )

        self._trace("fluxo finalizado", flow_start)
        return OrchestratorResult(
            explanation=explanation,
            sql=generated.sql,
            rows=rows,
            interpretation=generated.interpretation,
            reasoning=generated.reasoning,
            assumptions=generated.assumptions,
        )

    def _validate_question_policy(
        self,
        question: str,
        deps: Deps,
        flow_start: float,
    ) -> OrchestratorResult | None:
        """Bloqueia perguntas fora de política antes de chamar o LLM."""

        try:
            self._policy.validate_question(question, deps)
        except PolicyViolation as exc:
            msg = f"Pergunta rejeitada pela política: {exc}"
            self._trace(msg, flow_start)
            return OrchestratorResult(
                explanation=msg,
                error=str(exc),
            )

        return None

    async def _generate_sql(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest | OrchestratorResult:
        """Solicita SQL ao agente gerador e encapsula falhas inesperadas."""

        sql_start = time.perf_counter()
        self._trace("iniciando agente SQL")
        try:
            generated = await self._sql_client.generate_sql_async(question, deps)
        except Exception as exc:
            self._trace(f"agente SQL falhou: {exc}", sql_start)
            return OrchestratorResult(
                explanation=f"Agente SQL falhou: {exc}",
                error=str(exc),
            )

        self._trace(f"agente SQL finalizado: {type(generated).__name__}", sql_start)
        return generated

    def _invalid_request_result(
        self,
        generated: InvalidRequest,
        flow_start: float,
    ) -> OrchestratorResult:
        """Converte a rejeição estruturada do LLM em resposta do orquestrador."""

        self._trace("fluxo encerrado por solicitação inválida", flow_start)
        return OrchestratorResult(
            explanation=generated.error_message,
            error=generated.error_message,
        )

    def _validate_generated_sql(
        self,
        generated: Success,
    ) -> Success | OrchestratorResult:
        """Revalida o SQL gerado e substitui pela versão normalizada."""

        self._trace(f"SQL gerado: {generated.sql}")
        validation_start = time.perf_counter()
        self._trace("iniciando validação SQL")
        try:
            validated_sql = validate_sql(generated.sql)
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
        generated = generated.model_copy(update={"sql": validated_sql})
        self._trace("validação SQL concluída", validation_start)
        return generated

    def _validate_execution_policy(
        self,
        generated: Success,
        deps: Deps,
    ) -> OrchestratorResult | None:
        """Aplica regras de acesso a tabelas, colunas e PII antes da execução."""

        policy_start = time.perf_counter()
        self._trace("iniciando política de execução")
        try:
            self._policy.validate_sql(generated.sql, deps)
        except PolicyViolation as exc:
            msg = f"SQL rejeitado pela política: {exc}"
            self._trace(msg, policy_start)
            return OrchestratorResult(
                explanation=msg,
                sql=generated.sql,
                interpretation=generated.interpretation,
                reasoning=generated.reasoning,
                assumptions=generated.assumptions,
                error=str(exc),
            )
        self._trace("política de execução concluída", policy_start)

        return None

    async def _execute_sql(
        self,
        generated: Success,
        deps: Deps,
    ) -> tuple[list[dict], bool, OrchestratorResult | None]:
        """Executa a consulta quando há conexão disponível; caso contrário, pula."""

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
                error = OrchestratorResult(
                    explanation=msg,
                    sql=generated.sql,
                    interpretation=generated.interpretation,
                    reasoning=generated.reasoning,
                    assumptions=generated.assumptions,
                    error=str(exc),
                )
                return rows, execution_skipped, error
            self._trace(f"execução no banco concluída: {len(rows)} linha(s)", execution_start)
        else:
            self._trace("execução no banco pulada: deps.conn=None")

        return rows, execution_skipped, None

    async def _explain_result(
        self,
        *,
        question: str,
        generated: Success,
        rows: list[dict],
        execution_skipped: bool,
    ) -> str:
        """Gera a resposta em linguagem natural usando o explainer."""

        explainer_start = time.perf_counter()
        self._trace("iniciando agente explainer")
        try:
            explanation = await self._result_explainer.explain_async(
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

        return explanation
