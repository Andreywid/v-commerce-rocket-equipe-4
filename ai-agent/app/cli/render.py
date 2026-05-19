"""Renderização de respostas e tabelas no terminal."""

from __future__ import annotations

from pathlib import Path

from app.models.responses import OrchestratorResult


_REJECTION_TITLES: dict[str, str] = {
    "question_policy": "Pergunta não aceita (política ou escopo)",
    "invalid_request": "Pedido fora do contexto dos dados",
    "sql_validation": "Consulta não permitida pelo validador",
    "sql_policy": "Consulta bloqueada por regras de acesso",
    "execution": "Falha ao executar no banco",
    "sql_agent": "Falha ao gerar a consulta",
}


def print_bulleted_section(title: str, items: list[str]) -> None:
    """Imprime listas opcionais mantendo a saída de CLI legível."""

    print(f"\n{title}")
    if not items:
        print("  (nenhuma)")
        return
    for item in items:
        print(f"- {item}")


def print_mock_rows(rows: list[dict], db_path: Path) -> None:
    """Imprime linhas retornadas pelo executor mock em formato tabular simples."""

    print(f"\n--- Execução no mock ({db_path.name}) ---")
    if not rows:
        print("(sem resultados)")
        print("Total de linhas: 0")
        return

    colnames = list(rows[0].keys())
    print(" | ".join(colnames))
    limit = 20
    for row in rows[:limit]:
        print(" | ".join(str(row.get(column)) for column in colnames))
    if len(rows) > limit:
        print(f"... e mais {len(rows) - limit} linha(s)")
    print(f"Total de linhas: {len(rows)}")


def print_agent_response(
    response: OrchestratorResult,
    mock_db_path: Path | None,
    *,
    show_mock_rows: bool,
) -> None:
    """Renderiza a resposta completa do agente no terminal."""

    if response.error:
        kind = response.error_kind or "unknown"
        title = _REJECTION_TITLES.get(kind, "Não foi possível concluir o pedido")
        print(f"\n=== {title} ===")
        print(response.explanation)
        if response.sql:
            label = (
                "SQL que não pôde ser executado:"
                if kind == "execution"
                else "SQL envolvido:"
            )
            print(f"\n{label}")
            print(response.sql)
        return

    print("\nEXPLAINER:")
    print(response.explanation)

    if response.interpretation:
        print("\nINTERPRETAÇÃO:")
        print(response.interpretation)

    print_bulleted_section(
        "RACIOCÍNIO ESTRUTURADO:",
        response.reasoning,
    )

    if response.sql:
        print("\nSQL:")
        print(response.sql)

    print_bulleted_section("PREMISSAS:", response.assumptions)

    if show_mock_rows and response.sql:
        print_mock_rows(response.rows, mock_db_path or Path("mock"))


def print_mock_skip_message() -> None:
    print(
        "\n--- Execução no mock ---\n"
        "Pulada: nenhum SQL ou mock_gold.sqlite disponível (rode sem --skip-mock ou gere o arquivo)."
    )
