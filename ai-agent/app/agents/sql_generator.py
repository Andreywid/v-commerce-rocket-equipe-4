from datetime import datetime

from pydantic_ai import Agent

from app.database.schema_registry import GOLD_SCHEMA as DB_SCHEMA
from app.models.deps import Deps
from app.models.responses import InvalidRequest, Response, Success
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
from app.prompts.sql_prompt_builder import build_prompt
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.security.sql_validator import validate_sql


class AgentTextToSQLClient:
    def __init__(
        self,
        model_name: str = "llama-3.3-70b-versatile",
        max_retries: int = 3,
    ):
        model = f"groq:{model_name}"

        self.agent = Agent(
            model=model,
            deps_type=Deps,
            output_type=Response,
            retries=max_retries,
            system_prompt=SYSTEM_PROMPT,
        )

    # Antes era um método síncrono: def generate_sql(...)
    # Agora é assíncrono: async def generate_sql(...)
    async def generate_sql(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:

        prompt = build_prompt(
            question=question,
            schema=DB_SCHEMA,
            examples=SQL_EXAMPLES,
            values=VALUE_EXAMPLES,
            current_date=datetime.now(),
        )

        # Antes usava self.agent.run_sync(...)
        # Agora usa await self.agent.run(...)
        # Isso evita bloquear o fluxo durante a chamada ao modelo.
        result = await self.agent.run(
            prompt,
            deps=deps,
        )

        output = result.output

        if isinstance(output, Success):
            validate_sql(output.sql)

        return output