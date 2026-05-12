from datetime import datetime

from pydantic_ai import Agent

from app.database.schema_registry import get_schema_prompt
from app.models.deps import Deps
from app.models.responses import InvalidRequest, Response, Success
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
from app.prompts.sql_prompt_builder import build_prompt
from app.prompts.system_prompt import SYSTEM_PROMPT
from app.security.sql_validator import validate_sql


class AgentTextToSQLClient:

    def __init__(
        self,
        model_name: str = "llama-3.1-8b-instant",
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

    def _build_prompt(self, question: str) -> str:
        return build_prompt(
            question=question,
            schema=get_schema_prompt(),
            examples=SQL_EXAMPLES,
            values=VALUE_EXAMPLES,
            current_date=datetime.now(),
        )

    @staticmethod
    def _validate_output(output: Success | InvalidRequest) -> Success | InvalidRequest:
        if isinstance(output, Success):
            validate_sql(output.sql)

        return output

    def generate_sql(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:

        result = self.agent.run_sync(
            self._build_prompt(question),
            deps=deps,
        )

        return self._validate_output(result.output)

    async def generate_sql_async(
        self,
        question: str,
        deps: Deps,
    ) -> Success | InvalidRequest:

        result = await self.agent.run(
            self._build_prompt(question),
            deps=deps,
        )

        return self._validate_output(result.output)
