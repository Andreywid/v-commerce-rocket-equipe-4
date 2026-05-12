"""Argument parser e roteamento principal da CLI."""

from __future__ import annotations

import argparse
import asyncio
import os

from app.cli.context import CliRunContext
from app.cli.inspect import run_dry_prompt, run_schema_info
from app.cli.mock import resolve_existing_mock_path, run_mock_sqlite_smoke
from app.cli.runner import (
    run_api_server,
    run_orchestrator_text_to_sql,
    run_terminal_chat,
)


def _has_llm_api_key() -> bool:
    """Aceita GOOGLE_API_KEY ou o API_KEY legado usado como fallback."""

    return bool(os.getenv("GOOGLE_API_KEY") or os.getenv("API_KEY"))


def _parse_allowed_columns(
    raw_items: list[str] | None,
) -> dict[str, frozenset[str]] | None:
    """Converte argumentos ``tabela:coluna1,coluna2`` em policy de colunas."""

    if not raw_items:
        return None

    parsed: dict[str, set[str]] = {}
    for raw_item in raw_items:
        if ":" not in raw_item:
            raise ValueError(
                "--allowed-column deve usar o formato tabela:coluna1,coluna2"
            )

        table, columns_blob = raw_item.split(":", 1)
        table = table.strip()
        columns = {
            column.strip()
            for column in columns_blob.split(",")
            if column.strip()
        }

        if not table or not columns:
            raise ValueError(
                "--allowed-column deve informar tabela e ao menos uma coluna"
            )

        parsed.setdefault(table, set()).update(columns)

    return {
        table: frozenset(columns)
        for table, columns in parsed.items()
    }


def _build_cli_context(
    args: argparse.Namespace,
    allowed_columns: dict[str, frozenset[str]] | None,
) -> CliRunContext:
    """Agrupa os argumentos de autorização usados pelos fluxos locais."""

    allowed_tables = (
        frozenset(args.allowed_table)
        if args.allowed_table is not None
        else None
    )

    return CliRunContext(
        conversation_id=args.conversation_id,
        user_id=args.user_id,
        tenant_id=args.tenant_id,
        roles=frozenset(args.role),
        allowed_tables=allowed_tables,
        allowed_columns=allowed_columns,
        allow_all_schema_access=args.allow_all_schema_access,
        allow_sensitive_pii=args.allow_sensitive_pii,
        require_tenant=args.require_tenant,
        debug_memory=args.debug_memory,
    )


def build_parser() -> argparse.ArgumentParser:
    """Cria o parser de argumentos da CLI local."""

    parser = argparse.ArgumentParser(
        description="Testes locais: mock Gold, prompt modular, orquestrador Text-to-SQL e validação"
    )
    parser.add_argument(
        "--question",
        default="Qual a receita bruta total em 2024-11 na tabela de KPIs de vendas?",
        help="Pergunta em linguagem natural para o agente Text-to-SQL",
    )
    parser.add_argument(
        "--mock-only",
        action="store_true",
        help="Apenas recria e valida o SQLite mock (sem chamada ao LLM)",
    )
    parser.add_argument(
        "--skip-mock",
        action="store_true",
        help="Não recria o SQLite antes do restante",
    )
    parser.add_argument(
        "--dry-prompt",
        action="store_true",
        help="Imprime o prompt de usuário montado por app.prompts.sql_prompt_builder (sem LLM)",
    )
    parser.add_argument(
        "--schema-info",
        action="store_true",
        help="Mostra estatísticas do schema via get_schema_prompt()",
    )
    parser.add_argument(
        "--no-exec-mock",
        action="store_true",
        help="Não executa o SELECT gerado no SQLite mock (por padrão a consulta roda após validar)",
    )
    parser.add_argument(
        "--chat",
        action="store_true",
        help="Abre um chat interativo no terminal mantendo memória no mesmo processo",
    )
    parser.add_argument(
        "--conversation-id",
        default=None,
        help="ID da conversa para reutilizar memória curta no terminal",
    )
    parser.add_argument(
        "--user-id",
        default=None,
        help="ID do usuário usado pelos guardrails e memória",
    )
    parser.add_argument(
        "--tenant-id",
        default=None,
        help="ID do tenant usado pelos guardrails e memória",
    )
    parser.add_argument(
        "--role",
        action="append",
        default=[],
        help="Role do usuário; pode ser repetido. Ex: --role analyst",
    )
    parser.add_argument(
        "--allowed-table",
        action="append",
        default=None,
        help="Tabela permitida; pode ser repetido. Ex: --allowed-table gold_vendas_kpis",
    )
    parser.add_argument(
        "--allowed-column",
        action="append",
        default=None,
        help="Colunas permitidas no formato tabela:col1,col2. Pode ser repetido.",
    )
    parser.add_argument(
        "--allow-sensitive-pii",
        action="store_true",
        help="Permite colunas de PII sensível neste teste local",
    )
    parser.add_argument(
        "--allow-all-schema-access",
        action="store_true",
        help=(
            "Ignora --allowed-table/--allowed-column e permite qualquer tabela "
            "do schema Gold e qualquer coluna não bloqueada por PII"
        ),
    )
    parser.add_argument(
        "--require-tenant",
        action="store_true",
        help="Rejeita a pergunta se --tenant-id não for informado",
    )
    parser.add_argument(
        "--debug-memory",
        action="store_true",
        help="Imprime o contexto de memória enviado ao LLM antes de cada pergunta",
    )
    parser.add_argument(
        "--serve-api",
        action="store_true",
        help="Sobe a API FastAPI do AI Agent via Uvicorn",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host usado com --serve-api",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Porta usada com --serve-api",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Ativa reload automático do Uvicorn com --serve-api",
    )
    return parser


def main() -> None:
    """Processa argumentos de CLI e escolhe o fluxo local solicitado."""

    args = build_parser().parse_args()

    if args.serve_api:
        run_api_server(
            host=args.host,
            port=args.port,
            reload=args.reload,
        )
        return

    if args.schema_info:
        run_schema_info()
        if not args.dry_prompt and not args.mock_only:
            return

    mock_db_path = None
    if not args.skip_mock:
        print("=== Mock SQLite (camada Gold) ===\n")
        mock_db_path = run_mock_sqlite_smoke()
        print(f"\nArquivo: {mock_db_path.resolve()}\n")
    else:
        mock_db_path = resolve_existing_mock_path()

    if args.dry_prompt:
        run_dry_prompt(args.question)
        print()
        if args.mock_only:
            return

    if args.mock_only:
        return

    if not _has_llm_api_key():
        print(
            "GOOGLE_API_KEY não definida; defina no ambiente ou em .env para testar o modelo.\n"
            "Também é aceito API_KEY como fallback de compatibilidade.\n"
            "Use --dry-prompt ou --schema-info para inspecionar o app sem API."
        )
        return

    allowed_columns = _parse_allowed_columns(args.allowed_column)
    cli_context = _build_cli_context(args, allowed_columns)

    if args.chat:
        asyncio.run(
            run_terminal_chat(
                mock_db_path=mock_db_path,
                exec_on_mock=not args.no_exec_mock,
                context=cli_context,
            )
        )
        return

    print("=== Orquestrador Text-to-SQL (LLM / app.agents.orchestrator) ===\n")
    print("Pergunta:", args.question)
    try:
        asyncio.run(
            run_orchestrator_text_to_sql(
                args.question,
                mock_db_path=mock_db_path,
                exec_on_mock=not args.no_exec_mock,
                context=cli_context,
            )
        )
    except Exception as exc:
        print(f"\nErro na chamada ao modelo: {exc}")
