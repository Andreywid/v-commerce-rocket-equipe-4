"""Fluxos executáveis da CLI: pergunta única, chat e API."""

from __future__ import annotations

from dataclasses import replace
from pathlib import Path
from typing import Any

from app.agents.orchestrator import AgentOrchestrator
from app.cli.context import CliAskResult, CliRunContext
from app.cli.mock import open_mock_connection
from app.cli.render import (
    print_agent_response,
    print_mock_skip_message,
)
from app.memory.conversation_store import (
    build_question_with_memory,
    get_default_conversation_store,
)
from app.models.deps import Deps
from app.models.responses import OrchestratorResult


def run_api_server(*, host: str, port: int, reload: bool) -> None:
    """Sobe a API FastAPI via Uvicorn."""

    import uvicorn

    uvicorn.run(
        "app.api.app:app",
        host=host,
        port=port,
        reload=reload,
    )


def _deps_from_cli_context(
    *,
    context: CliRunContext,
    conversation_id: str,
    conn: Any,
) -> Deps:
    return Deps(
        conn=conn,
        conversation_id=conversation_id,
        user_id=context.user_id,
        tenant_id=context.tenant_id,
        roles=context.roles,
        allowed_tables=context.allowed_tables,
        allowed_columns=context.allowed_columns,
        allow_all_schema_access=context.allow_all_schema_access,
        allow_sensitive_pii=context.allow_sensitive_pii,
        require_tenant=context.require_tenant,
    )


def _print_memory_debug(
    *,
    question_for_agent: str,
    previous_turn_count: int,
) -> None:
    print("\n--- DEBUG MEMORY ---")
    print(f"Turnos carregados: {previous_turn_count}")
    if previous_turn_count == 0:
        print("Nenhum contexto conversacional foi injetado.")
    else:
        print("Prompt contextual enviado ao agente:")
    print(question_for_agent)
    print("--- FIM DEBUG MEMORY ---\n")


async def _ask_with_memory(
    *,
    orchestrator: AgentOrchestrator,
    question: str,
    context: CliRunContext,
    conn: Any,
) -> CliAskResult:
    """Executa uma pergunta com memória conversacional e persiste o turno."""

    conversation_store = get_default_conversation_store()
    conversation_id = context.conversation_id or conversation_store.new_conversation_id()
    previous_turns = conversation_store.list_turns(
        conversation_id=conversation_id,
        tenant_id=context.tenant_id,
        user_id=context.user_id,
    )
    deps = _deps_from_cli_context(
        context=context,
        conversation_id=conversation_id,
        conn=conn,
    )
    question_for_agent = build_question_with_memory(question, previous_turns)

    if context.debug_memory:
        _print_memory_debug(
            question_for_agent=question_for_agent,
            previous_turn_count=len(previous_turns),
        )

    response = await orchestrator.ask(
        question=question_for_agent,
        deps=deps,
    )
    conversation_store.append_result(
        conversation_id=conversation_id,
        tenant_id=context.tenant_id,
        user_id=context.user_id,
        question=question,
        result=response,
    )

    return CliAskResult(
        conversation_id=conversation_id,
        previous_turn_count=len(previous_turns),
        response=response,
    )


def _should_show_mock_rows(
    *,
    response: OrchestratorResult,
    exec_on_mock: bool,
    mock_db_path: Path | None,
) -> bool:
    return (
        exec_on_mock
        and mock_db_path is not None
        and response.sql is not None
        and not response.error
    )


async def run_orchestrator_text_to_sql(
    question: str,
    *,
    mock_db_path: Path | None = None,
    exec_on_mock: bool = True,
    context: CliRunContext,
) -> None:
    """Executa o orquestrador e renderiza a resposta no terminal."""

    orchestrator = AgentOrchestrator()
    conn = open_mock_connection(
        exec_on_mock=exec_on_mock,
        mock_db_path=mock_db_path,
    )

    try:
        result = await _ask_with_memory(
            orchestrator=orchestrator,
            question=question,
            context=context,
            conn=conn,
        )
    finally:
        if conn is not None:
            conn.close()

    print(f"\nMEMÓRIA CARREGADA: {result.previous_turn_count} turno(s)")
    print(f"\nCONVERSATION_ID: {result.conversation_id}")

    if not result.response.error:
        print("\nOrquestrador executado com sucesso")
    show_mock_rows = _should_show_mock_rows(
        response=result.response,
        exec_on_mock=exec_on_mock,
        mock_db_path=mock_db_path,
    )
    print_agent_response(
        result.response,
        mock_db_path,
        show_mock_rows=show_mock_rows,
    )
    if exec_on_mock and not result.response.error and not show_mock_rows:
        print_mock_skip_message()


async def run_terminal_chat(
    *,
    mock_db_path: Path | None,
    exec_on_mock: bool,
    context: CliRunContext,
) -> None:
    """Loop interativo de chat mantendo memória no mesmo processo."""

    orchestrator = AgentOrchestrator()
    conversation_store = get_default_conversation_store()
    conversation_id = context.conversation_id or conversation_store.new_conversation_id()
    context = replace(context, conversation_id=conversation_id)

    conn = open_mock_connection(
        exec_on_mock=exec_on_mock,
        mock_db_path=mock_db_path,
    )

    print("\n=== Chat Text-to-SQL ===")
    print(f"CONVERSATION_ID: {conversation_id}")
    print("Digite sua pergunta. Use /sair para encerrar.\n")

    try:
        while True:
            question = input("Você: ").strip()
            if not question:
                continue
            if question.casefold() in {"/sair", "sair", "exit", "quit", "/exit", "/quit"}:
                print("Encerrando chat.")
                return

            result = await _ask_with_memory(
                orchestrator=orchestrator,
                question=question,
                context=context,
                conn=conn,
            )

            print(f"\nMemória carregada: {result.previous_turn_count} turno(s)")
            print_agent_response(
                result.response,
                mock_db_path,
                show_mock_rows=_should_show_mock_rows(
                    response=result.response,
                    exec_on_mock=exec_on_mock,
                    mock_db_path=mock_db_path,
                ),
            )
            print()
    finally:
        if conn is not None:
            conn.close()
