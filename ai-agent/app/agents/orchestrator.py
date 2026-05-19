"""
Fluxo: pergunta → SQL (AgentTextToSQLClient) → validate_sql → execução → explainer → OrchestratorResult.

Se a validação ou execução falhar, o orquestrador pode chamar o gerador de novo com o erro e
o SQL falho (até max_regenerations_on_exec_error tentativas adicionais).
"""

from __future__ import annotations

import time
import unicodedata
from typing import TYPE_CHECKING

from app.database.executor import QueryExecutor
from app.prompts.orchestrator_prompts import (
    format_sql_recovery_after_exec_error,
    format_sql_recovery_after_validation_error,
)
from app.messages.rejection_copy import (
    format_execution,
    format_invalid_request,
    format_question_policy,
    format_sql_agent,
    format_sql_policy,
    format_sql_validation,
)
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
        max_regenerations_on_exec_error: int = 2,
        **kwargs,
    ) -> None:
        legacy_context = None

        if sql_client is not None and not hasattr(sql_client, "generate_sql_async"):
            legacy_context = sql_client
            sql_client = None

        self._sql = sql_client
        self._executor = executor or QueryExecutor()
        self._explainer = explainer
        self._policy = policy or QueryPolicy()
        self._debug = debug
        self._max_regenerations_on_exec_error = max(0, max_regenerations_on_exec_error)
        self._legacy_context = legacy_context

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

    @staticmethod
    def _recovery_prompt_after_exec_error(
        original_question: str,
        failed_sql: str,
        db_error: str,
    ) -> str:
        """Reformula o pedido para o gerador SQL corrigir consulta que falhou no banco."""

        return format_sql_recovery_after_exec_error(
            original_question=original_question,
            failed_sql=failed_sql,
            db_error=db_error,
        )

    @staticmethod
    def _recovery_prompt_after_validation_error(
        original_question: str,
        failed_sql: str,
        validation_error: str,
    ) -> str:
        """Reformula o pedido para corrigir consulta rejeitada pelo validador."""

        return format_sql_recovery_after_validation_error(
            original_question=original_question,
            failed_sql=failed_sql,
            validation_error=validation_error,
        )

    async def run(
        self,
        question: str,
        deps: Deps | None = None,
        **kwargs,
    ) -> OrchestratorResult:
        """Compatibilidade com runners antigos que chamam AgentOrchestrator.run()."""

        if deps is None:
            deps = kwargs.get("deps")

        legacy_context = kwargs.get("context") or getattr(self, "_legacy_context", None)

        if deps is not None and not isinstance(deps, Deps):
            legacy_context = deps
            deps = None

        if deps is None:
            import sqlite3

            from app.database.mock_gold import ensure_mock_sqlite

            conn = sqlite3.connect(ensure_mock_sqlite())

            try:
                if legacy_context is not None:
                    deps = Deps(
                        conn=conn,
                        conversation_id=getattr(legacy_context, "conversation_id", None),
                        user_id=getattr(legacy_context, "user_id", None),
                        tenant_id=getattr(legacy_context, "tenant_id", None),
                        roles=getattr(legacy_context, "roles", frozenset()),
                        allowed_tables=getattr(legacy_context, "allowed_tables", None),
                        allowed_columns=getattr(legacy_context, "allowed_columns", None),
                        allow_all_schema_access=getattr(
                            legacy_context,
                            "allow_all_schema_access",
                            True,
                        ),
                        allow_sensitive_pii=getattr(
                            legacy_context,
                            "allow_sensitive_pii",
                            False,
                        ),
                        require_tenant=getattr(legacy_context, "require_tenant", False),
                    )
                else:
                    deps = Deps(conn=conn)

                return await self.ask(question=question, deps=deps)
            finally:
                conn.close()

        return await self.ask(question=question, deps=deps)

    async def ask(self, question: str, deps: Deps) -> OrchestratorResult:
        """Executa o fluxo completo de Text-to-SQL para uma pergunta do usuário."""

        flow_start = time.perf_counter()
        self._trace("início do fluxo")

        policy_result = self._validate_question_policy(question, deps, flow_start)
        if policy_result is not None:
            return policy_result

        prompt = question
        prev_retry_error: OrchestratorResult | None = None
        generated: Success | None = None
        rows: list[dict] = []
        execution_skipped = False
        invalid_request_recovery_used = False

        for attempt_index in range(self._max_regenerations_on_exec_error + 1):
            if attempt_index > 0 and prev_retry_error is not None:
                err = prev_retry_error.error or ""
                sql_failed = prev_retry_error.sql or ""
                if prev_retry_error.error_kind == "sql_validation":
                    prompt = self._recovery_prompt_after_validation_error(
                        question,
                        sql_failed,
                        err,
                    )
                else:
                    prompt = self._recovery_prompt_after_exec_error(
                        question,
                        sql_failed,
                        err,
                    )
                self._trace(
                    f"nova geração SQL após erro {prev_retry_error.error_kind} "
                    f"({attempt_index}/{self._max_regenerations_on_exec_error})",
                    flow_start,
                )

            generated = await self._generate_sql(prompt, deps)
            if isinstance(generated, OrchestratorResult):
                return generated

            if isinstance(generated, InvalidRequest):
                if (
                    not invalid_request_recovery_used
                    and self._should_retry_invalid_request_for_default_growth_period(
                        question=question,
                        error_message=generated.error_message,
                    )
                ):
                    invalid_request_recovery_used = True
                    self._trace(
                        "recuperando InvalidRequest de crescimento sem período",
                        flow_start,
                    )
                    generated = await self._generate_sql(
                        self._default_growth_period_recovery_prompt(
                            question=question,
                            error_message=generated.error_message,
                        ),
                        deps,
                    )
                    if isinstance(generated, OrchestratorResult):
                        return generated
                    if isinstance(generated, InvalidRequest):
                        return self._invalid_request_result(generated, flow_start)
                else:
                    return self._invalid_request_result(generated, flow_start)

            assert isinstance(generated, Success)
            validated = self._validate_generated_sql(generated)
            if isinstance(validated, OrchestratorResult):
                prev_retry_error = validated
                if attempt_index >= self._max_regenerations_on_exec_error:
                    return validated
                continue
            generated = validated

            policy_result = self._validate_execution_policy(generated, deps)
            if policy_result is not None:
                return policy_result

            rows, execution_skipped, execution_error = await self._execute_sql(
                generated,
                deps,
            )
            if execution_error is None:
                break

            prev_retry_error = execution_error
            if attempt_index >= self._max_regenerations_on_exec_error:
                return execution_error

        assert generated is not None

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
                explanation=format_question_policy(str(exc)),
                error=str(exc),
                error_kind="question_policy",
            )

        return None

    @staticmethod
    def _normalize_text(text: str) -> str:
        """Normaliza texto curto para heurísticas determinísticas."""

        normalized = unicodedata.normalize("NFKD", text or "")
        normalized = "".join(
            character for character in normalized if not unicodedata.combining(character)
        )
        return normalized.casefold()

    @classmethod
    def _should_retry_invalid_request_for_default_growth_period(
        cls,
        *,
        question: str,
        error_message: str,
    ) -> bool:
        """Recupera o caso em que o LLM ignora a regra de período padrão."""

        normalized_question = cls._normalize_text(question)
        normalized_error = cls._normalize_text(error_message)
        growth_terms = (
            "crescimento",
            "variacao",
            "evolucao",
            "maior aumento",
            "maior queda",
        )
        metric_terms = ("receita", "faturamento", "kpi", "vendas", "pedidos")

        return (
            "periodo" in normalized_error
            and any(term in normalized_question for term in growth_terms)
            and any(term in normalized_question for term in metric_terms)
        )

    @staticmethod
    def _default_growth_period_recovery_prompt(
        *,
        question: str,
        error_message: str,
    ) -> str:
        """Reforça a resolução padrão para crescimento sem período explícito."""

        return (
            "# CORREÇÃO NECESSÁRIA\n"
            "A tentativa anterior retornou InvalidRequest, mas isso viola as regras "
            "do agente para crescimento/variação sem período explícito.\n\n"
            f"Pergunta original: {question}\n"
            f"Erro anterior: {error_message}\n\n"
            "# RESOLUÇÃO OBRIGATÓRIA (CRESCIMENTO SEM PERÍODO)\n"
            "Não retorne InvalidRequest por falta de período. Assuma os últimos 12 "
            "meses completos anteriores ao mês corrente informado no prompt como "
            "janela padrão e registre essa premissa em assumptions. Se a pergunta "
            "for por região, derive macro-região brasileira a partir de estado_cliente "
            "ou estado com CASE/IN, use ELSE NULL para valores que não são estados "
            "válidos, filtre regiao IS NOT NULL e compare a receita do primeiro mês "
            "contra a do último mês da janela. Gere apenas SELECT seguro."
        )

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
                explanation=format_sql_agent(str(exc)),
                error=str(exc),
                error_kind="sql_agent",
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
            explanation=format_invalid_request(generated.error_message),
            error=generated.error_message,
            error_kind="invalid_request",
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
                explanation=format_sql_validation(str(exc)),
                sql=generated.sql,
                interpretation=generated.interpretation,
                reasoning=generated.reasoning,
                assumptions=generated.assumptions,
                error=str(exc),
                error_kind="sql_validation",
            )
        generated = generated.model_copy(update={"sql": validated_sql})
        self._trace("validação SQL concluída", validation_start)
        return generated

    def _validate_execution_policy(
        self,
        generated: Success,
        deps: Deps,
    ) -> OrchestratorResult | None:
        """Aplica regras de acesso a tabelas e colunas declaradas antes da execução."""

        policy_start = time.perf_counter()
        self._trace("iniciando política de execução")
        try:
            self._policy.validate_sql(generated.sql, deps)
        except PolicyViolation as exc:
            msg = f"SQL rejeitado pela política: {exc}"
            self._trace(msg, policy_start)
            return OrchestratorResult(
                explanation=format_sql_policy(str(exc)),
                sql=generated.sql,
                interpretation=generated.interpretation,
                reasoning=generated.reasoning,
                assumptions=generated.assumptions,
                error=str(exc),
                error_kind="sql_policy",
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
                    explanation=format_execution(str(exc)),
                    sql=generated.sql,
                    interpretation=generated.interpretation,
                    reasoning=generated.reasoning,
                    assumptions=generated.assumptions,
                    error=str(exc),
                    error_kind="execution",
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