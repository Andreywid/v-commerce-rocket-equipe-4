"""Agente que transforma SQL e linhas retornadas em resposta de negócio."""

from typing import Any

from pydantic_ai import Agent

from app.agents.model_config import configure_provider_api_keys, create_agent_with_fallback, get_model_chain
from app.models.responses import Success
from app.prompts.explainer_prompt_builder import ExplainerPromptBuilder
from app.prompts.explainer_prompts import EXPLAINER_SYSTEM


class ResultExplainer:
    """Gera texto em linguagem natural a partir da pergunta, do plano SQL e das linhas retornadas."""

    def __init__(
        self,
        model_name: str | None = None,
        max_retries: int = 2,
        max_rows_in_prompt: int = 10,
    ) -> None:
        configure_provider_api_keys()
        self._max_retries = max_retries
        
        # Armazena a cadeia de modelos para eventual fallback em runtime
        self._models_chain = get_model_chain(model_name)
        
        def create_explainer_agent(model: str) -> Agent:
            """Factory para criar agent explainer com modelo especificado."""
            return Agent(
                model=model,
                output_type=str,
                retries=max_retries,
                system_prompt=EXPLAINER_SYSTEM,
            )
        
        self._create_explainer_agent = create_explainer_agent
        
        self._agent = create_agent_with_fallback(
            agent_name="explainer",
            model_name=model_name,
            agent_factory=create_explainer_agent,
        )
        self._prompt_builder = ExplainerPromptBuilder(max_rows=max_rows_in_prompt)

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
        """Gera explicação em modo síncrono com fallback automático."""

        prompt = self._build_prompt(
            question=question,
            sql_result=sql_result,
            rows=rows,
            execution_skipped=execution_skipped,
        )
        
        for idx, model in enumerate(self._models_chain):
            try:
                result = self._agent.run_sync(prompt)
                return result.output
            except Exception as e:
                print(f"[explainer] Erro ao executar com {model}: {e}", flush=True)
                # Se for o último modelo da cadeia, relança a exceção
                if idx == len(self._models_chain) - 1:
                    raise
                # Caso contrário, tenta recriar o agent com o próximo modelo
                try:
                    next_model = self._models_chain[idx + 1]
                    self._agent = self._create_explainer_agent(next_model)
                    print(f"[explainer] Retentando com modelo: {next_model}", flush=True)
                except Exception as retry_err:
                    print(f"[explainer] Falha ao reconfigurar agente: {retry_err}", flush=True)
                    raise
        
        # Nunca deve chegar aqui, mas por segurança
        raise RuntimeError("Nenhum modelo disponível para explain")

    async def explain_async(
        self,
        *,
        question: str,
        sql_result: Success,
        rows: list[dict[str, Any]],
        execution_skipped: bool,
    ) -> str:
        """Gera explicação em modo assíncrono para o fluxo da API com fallback automático."""

        prompt = self._build_prompt(
            question=question,
            sql_result=sql_result,
            rows=rows,
            execution_skipped=execution_skipped,
        )
        
        for idx, model in enumerate(self._models_chain):
            try:
                result = await self._agent.run(prompt)
                return result.output
            except Exception as e:
                print(f"[explainer] Erro ao executar com {model}: {e}", flush=True)
                # Se for o último modelo da cadeia, relança a exceção
                if idx == len(self._models_chain) - 1:
                    raise
                # Caso contrário, tenta recriar o agent com o próximo modelo
                try:
                    next_model = self._models_chain[idx + 1]
                    self._agent = self._create_explainer_agent(next_model)
                    print(f"[explainer] Retentando com modelo: {next_model}", flush=True)
                except Exception as retry_err:
                    print(f"[explainer] Falha ao reconfigurar agente: {retry_err}", flush=True)
                    raise
        
        # Nunca deve chegar aqui, mas por segurança
        raise RuntimeError("Nenhum modelo disponível para explain_async")
