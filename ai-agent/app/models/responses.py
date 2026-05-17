"""Modelos Pydantic usados como contrato entre agentes e orquestrador."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field

OrchestratorErrorKind = Literal[
    "question_policy",
    "invalid_request",
    "sql_validation",
    "sql_policy",
    "execution",
    "sql_agent",
]

class Success(BaseModel):
    """Saída estruturada quando o modelo conseguiu gerar uma consulta segura."""

    kind: Literal["success"] = "success"

    interpretation: str = Field(
        description="Interpretação objetiva da pergunta"
    )

    reasoning: list[str] = Field(
        default_factory=list,
        description="Passos lógicos utilizados"
    )

    sql: str = Field(
        description="SQL PostgreSQL seguro"
    )

    assumptions: list[str] = Field(
        default_factory=list,
        description="Premissas assumidas"
    )


class InvalidRequest(BaseModel):
    """Saída estruturada quando a pergunta deve ser rejeitada antes da execução."""

    kind: Literal["invalid"] = "invalid"

    error_message: str = Field(
        description="Erro de segurança ou solicitação inválida"
    )


Response = Annotated[
    Success | InvalidRequest,
    Field(discriminator="kind")
]


class OrchestratorResult(BaseModel):
    """Resposta agregada do fluxo pergunta → SQL → validação → execução → explicação."""

    explanation: str = Field(description="Texto final em linguagem natural para o usuário")
    sql: str | None = None
    rows: list[dict] = Field(default_factory=list)
    interpretation: str | None = None
    reasoning: list[str] = Field(default_factory=list)
    assumptions: list[str] = Field(default_factory=list)
    error: str | None = Field(
        default=None,
        description="Detalhe técnico quando o fluxo falhou antes da explicação final",
    )
    error_kind: OrchestratorErrorKind | None = Field(
        default=None,
        description="Classificação do bloqueio para UI e API (rejeição, política, execução, etc.)",
    )