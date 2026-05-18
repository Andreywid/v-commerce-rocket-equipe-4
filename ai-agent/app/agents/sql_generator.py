"""Cliente LLM responsável por transformar perguntas de negócio em SQL seguro."""

import sqlite3
from datetime import datetime

from pydantic_ai import Agent

from app.database.schema_registry import get_schema_prompt
from app.agents.model_config import configure_provider_api_keys, create_agent_with_fallback, get_model_chain
from app.models.deps import Deps
from app.models.responses import InvalidRequest, Response, Success
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
from app.prompts.sql_prompt_builder import SqlDialect, build_prompt
from app.prompts.system_prompt import SYSTEM_PROMPT


class AgentTextToSQLClient:
    """Envelopa o ``pydantic_ai.Agent`` configurado para respostas Text-to-SQL."""

    def __init__(
        self,
        model_name: str | None = None,
        max_retries: int = 3,
    ):

        configure_provider_api_keys()
        self._max_retries = max_retries
        
        # Armazena a cadeia de modelos para eventual fallback em runtime
        self._models_chain = get_model_chain(model_name)
        
        def create_sql_agent(model: str) -> Agent:
            """Factory para criar agent SQL com modelo especificado."""
            return Agent(
                model=model,
                deps_type=Deps,
                output_type=Response,
                retries=max_retries,
                system_prompt=SYSTEM_PROMPT,
            )
        
        self._create_sql_agent = create_sql_agent
        
        self.agent = create_agent_with_fallback(
            agent_name="sql_generator",
            model_name=model_name,
            agent_factory=create_sql_agent,
        )

    @staticmethod
    def _sql_dialect(deps: Deps) -> SqlDialect:
        """SQLite no mock local; caso contrário assume PostgreSQL."""

        if isinstance(deps.conn, sqlite3.Connection):
            return "sqlite"
        return "postgresql"

    def _build_prompt(self, question: str, deps: Deps) -> str:
        """Monta o prompt com schema, exemplos e data atual."""

        dialect = self._sql_dialect(deps)
        return build_prompt(
            question=question,
            schema=get_schema_prompt(),
            examples=self._select_examples(dialect),
            values=VALUE_EXAMPLES,
            current_date=datetime.now(),
            dialect=dialect,
        )

    @staticmethod
    def _select_examples(dialect: SqlDialect = "postgresql") -> list[str]:
        """Seleciona poucos exemplos para manter o prompt compacto."""

        if dialect == "sqlite":
            blocked_tokens = ("DATE_TRUNC", "INTERVAL", "ILIKE", "::")
            return [
                example
                for example in SQL_EXAMPLES
                if not any(token in example.upper() for token in blocked_tokens)
            ][:2]

        blocked_tokens = ("STRFTIME", "DATE('NOW'")
        return [
            example
            for example in SQL_EXAMPLES
            if not any(token in example.upper() for token in blocked_tokens)
        ][:2]

    def generate_sql(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:
        """Versão síncrona usada por scripts e testes locais com fallback automático."""

        prompt = self._build_prompt(question, deps)
        
        for idx, model in enumerate(self._models_chain):
            try:
                result = self.agent.run_sync(prompt, deps=deps)
                return result.output
            except Exception as e:
                print(f"[sql_generator] Erro ao executar com {model}: {e}", flush=True)
                # Se for o último modelo da cadeia, relança a exceção
                if idx == len(self._models_chain) - 1:
                    raise
                # Caso contrário, tenta recriar o agent com o próximo modelo
                try:
                    next_model = self._models_chain[idx + 1]
                    self.agent = self._create_sql_agent(next_model)
                    print(f"[sql_generator] Retentando com modelo: {next_model}", flush=True)
                except Exception as retry_err:
                    print(f"[sql_generator] Falha ao reconfigurar agente: {retry_err}", flush=True)
                    raise
        
        # Nunca deve chegar aqui, mas por segurança
        raise RuntimeError("Nenhum modelo disponível para generate_sql")

    async def generate_sql_async(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:
        """Versão assíncrona usada pelo orquestrador e pela API com fallback automático."""

        prompt = self._build_prompt(question, deps)
        
        for idx, model in enumerate(self._models_chain):
            try:
                result = await self.agent.run(prompt, deps=deps)
                return result.output
            except Exception as e:
                print(f"[sql_generator] Erro ao executar com {model}: {e}", flush=True)
                # Se for o último modelo da cadeia, relança a exceção
                if idx == len(self._models_chain) - 1:
                    raise
                # Caso contrário, tenta recriar o agent com o próximo modelo
                try:
                    next_model = self._models_chain[idx + 1]
                    self.agent = self._create_sql_agent(next_model)
                    print(f"[sql_generator] Retentando com modelo: {next_model}", flush=True)
                except Exception as retry_err:
                    print(f"[sql_generator] Falha ao reconfigurar agente: {retry_err}", flush=True)
                    raise
        
        # Nunca deve chegar aqui, mas por segurança
        raise RuntimeError("Nenhum modelo disponível para generate_sql_async")
