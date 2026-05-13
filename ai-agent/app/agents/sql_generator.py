"""Cliente LLM responsável por transformar perguntas de negócio em SQL seguro."""

import sqlite3
from datetime import datetime

from pydantic_ai import Agent

from app.database.schema_registry import get_schema_prompt
from app.agents.model_config import configure_provider_api_keys, get_model_name
from app.models.deps import Deps
from app.models.responses import InvalidRequest, Response, Success
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
from app.prompts.sql_prompt_builder import SqlDialect, build_prompt
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.security.sql_validator import validate_sql


class AgentTextToSQLClient:
    """Envelopa o ``pydantic_ai.Agent`` configurado para respostas Text-to-SQL."""

    def __init__(
        self,
        model_name: str | None = None,
        max_retries: int = 3,
    ):

        configure_provider_api_keys()
        model = model_name or get_model_name()

        self.agent = Agent(
            model=model,
            deps_type=Deps,
            output_type=Response,
            retries=max_retries,
            system_prompt=SYSTEM_PROMPT,
        )

    @staticmethod
    def _sql_dialect(deps: Deps) -> SqlDialect:
        """SQLite no mock local; caso contrário assume PostgreSQL."""

        if isinstance(deps.conn, sqlite3.Connection):
            return "sqlite"
        return "postgresql"

    def _build_prompt(self, question: str, deps: Deps) -> str:
        """Monta o prompt com schema, exemplos e data atual."""

        return build_prompt(
            question=question,
            schema=get_schema_prompt(),
            examples=self._select_examples(),
            values=VALUE_EXAMPLES,
            current_date=datetime.now(),
            dialect=self._sql_dialect(deps),
        )

    @staticmethod
    def _select_examples() -> list[str]:
        """Seleciona poucos exemplos para manter o prompt compacto."""

        return SQL_EXAMPLES[:2]

    @staticmethod
    def _validate_output(output: Success | InvalidRequest) -> Success | InvalidRequest:
        """Garante que respostas de sucesso passem novamente pelo validador SQL."""

        if isinstance(output, Success):
            validated_sql = validate_sql(output.sql)
            return output.model_copy(update={"sql": validated_sql})

        return output

    def generate_sql(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:
        """Versão síncrona usada por scripts e testes locais."""

        result = self.agent.run_sync(
            self._build_prompt(question, deps),
            deps=deps,
        )

        return self._validate_output(result.output)

    async def generate_sql_async(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:
        """Versão assíncrona usada pelo orquestrador e pela API."""

        result = await self.agent.run(
            self._build_prompt(question, deps),
            deps=deps,
        )

        return self._validate_output(result.output)
