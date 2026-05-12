"""
Ponto de entrada para testes locais do AI Agent.

Usa módulos em ``app/``: prompt, validação, orquestrador e mock da camada Gold.

Execute a partir do diretório ``ai-agent``::

    python main.py
    python main.py --mock-only
    python main.py --dry-prompt
    python main.py --schema-info
    python -m app.main --question "..."
    python -m app.main --no-exec-mock

**Code Runner:** execute o arquivo
 inteiro ou use ``run_main.py`` / ``main.py`` na raiz.

``GROQ_API_KEY`` no ``.env`` (pasta ``ai-agent``) ou no ambiente para chamadas ao modelo.

Nota: o fluxo principal usa ``app.agents.orchestrator.AgentOrchestrator``.
As opções de inspeção continuam usando o prompt modular para pré-visualização.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

_AI_AGENT_ROOT = Path(__file__).resolve().parent.parent
if str(_AI_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_AGENT_ROOT))

load_dotenv(_AI_AGENT_ROOT / ".env")

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

from app.database.mock_gold import build_mock_sqlite
from app.database.schema_registry import GOLD_SCHEMA, get_schema_prompt
from app.models.deps import Deps
from app.prompts.examples import SQL_EXAMPLES, VALUE_EXAMPLES
from app.prompts.sql_prompt_builder import build_prompt as build_user_prompt_modular
from app.prompts import system_prompt as system_prompt_module


def _print_bulleted_section(title: str, items: list[str]) -> None:
    print(f"\n{title}")
    if not items:
        print("  (nenhuma)")
        return
    for item in items:
        print(f"- {item}")


def _normalize_sql_literal_escapes(sql: str) -> str:
    """
    O modelo às vezes devolve quebras como a sequência de dois caracteres ``\\`` + ``n``
    (texto literal), o que quebra o SQLite. Converte para whitespace real.
    """
    return (
        sql.replace("\\n", "\n")
        .replace("\\r\\n", "\n")
        .replace("\\r", "\n")
        .replace("\\t", " ")
    )


def _try_run_sql_on_mock(sql: str, db_path: Path) -> None:
    text = _normalize_sql_literal_escapes(sql.strip()).rstrip(";")
    if not text.upper().lstrip().startswith("SELECT"):
        print("\nExecução no mock: ignorada (apenas SELECT é tentado automaticamente).")
        return
    if not db_path.is_file():
        print(f"\nExecução no mock: arquivo não encontrado: {db_path}")
        return
    print(f"\n--- Execução no mock ({db_path.name}) ---")
    conn = sqlite3.connect(db_path)
    try:
        cur = conn.cursor()
        cur.execute(text)
        rows = cur.fetchall()
        colnames = [d[0] for d in (cur.description or [])]
        if not colnames:
            print("(sem colunas / sem resultado)")
            return
        print(" | ".join(colnames))
        limit = 20
        for row in rows[:limit]:
            print(" | ".join(str(v) for v in row))
        if len(rows) > limit:
            print(f"... e mais {len(rows) - limit} linha(s)")
        print(f"Total de linhas: {len(rows)}")
    except Exception as exc:
        print(f"Falhou (SQL pode ser específico do Postgres): {exc}")
    finally:
        conn.close()


def _print_mock_rows(rows: list[dict], db_path: Path) -> None:
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


def run_mock_sqlite_smoke() -> Path:
    """Recria o SQLite de exemplo e imprime contagens rápidas."""
    path = build_mock_sqlite()
    conn = sqlite3.connect(path)
    try:
        cur = conn.cursor()
        print("Tabelas (amostra):")
        for name in list(GOLD_SCHEMA)[:5]:
            n = cur.execute(f'SELECT COUNT(*) FROM "{name}"').fetchone()[0]
            print(f"  {name}: {n} linhas")
        if len(GOLD_SCHEMA) > 5:
            print(f"  ... e mais {len(GOLD_SCHEMA) - 5} tabela(s)")
        sp = cur.execute(
            'SELECT COUNT(*) FROM "gold_cliente_360" WHERE cidade = ?',
            ("São Paulo",),
        ).fetchone()[0]
        print(f"Consulta exemplo: clientes em São Paulo = {sp}")
    finally:
        conn.close()
    return path


def run_schema_info() -> None:
    """Usa ``get_schema_prompt`` do registry (documentação viva)."""
    blob = get_schema_prompt()
    print("=== Schema Gold (registry) ===\n")
    print(f"Tabelas no GOLD_SCHEMA: {len(GOLD_SCHEMA)}")
    print(f"Tamanho do texto de schema para o LLM: {len(blob)} caracteres")
    print("\nTrecho inicial (800 chars):\n")
    print(blob[:800] + ("…" if len(blob) > 800 else ""))


def run_dry_prompt(question: str) -> None:
    """Monta o prompt do usuário com ``app.prompts.sql_prompt_builder`` (sem Groq)."""
    body = build_user_prompt_modular(
        question=question,
        schema=get_schema_prompt(),
        examples=SQL_EXAMPLES,
        values=VALUE_EXAMPLES,
        current_date=datetime.now(),
    )
    sys_prompt_len = len(system_prompt_module.SYSTEM_PROMPT.strip())
    print("=== Dry-run: prompt modular (usuário) ===\n")
    print(f"Tamanho system prompt (app.prompts.system_prompt): {sys_prompt_len} chars")
    print(f"Tamanho corpo (sql_prompt_builder + schema + few-shot): {len(body)} chars\n")
    print("--- Corpo do prompt ---\n")
    print(body)


async def run_orchestrator_text_to_sql(
    question: str,
    *,
    mock_db_path: Path | None = None,
    exec_on_mock: bool = True,
) -> None:
    from app.agents.orchestrator import AgentOrchestrator

    orchestrator = AgentOrchestrator()
    conn: sqlite3.Connection | None = None
    if exec_on_mock and mock_db_path is not None and mock_db_path.is_file():
        conn = sqlite3.connect(mock_db_path)
    deps = Deps(conn=conn)

    try:
        response = await orchestrator.ask(question=question, deps=deps)
    finally:
        if conn is not None:
            conn.close()

    if response.error:
        print("\nSolicitação inválida ou rejeitada pelo fluxo")
        print(response.explanation)
        if response.sql:
            print("\nSQL rejeitado:")
            print(response.sql)
        return

    print("\nOrquestrador executado com sucesso\n")
    print("RESULTADO DO EXPLAINER:")
    print(response.explanation)
    if response.interpretation:
        print("\nINTERPRETAÇÃO:")
        print(response.interpretation)
    _print_bulleted_section("RACIOCÍNIO:", response.reasoning)
    if response.sql:
        print("\nSQL:")
        print(response.sql)
    _print_bulleted_section("PREMISSAS:", response.assumptions)

    if exec_on_mock and mock_db_path is not None and response.sql and conn is not None:
        _print_mock_rows(response.rows, mock_db_path)
    elif exec_on_mock:
        print(
            "\n--- Execução no mock ---\n"
            "Pulada: nenhum SQL ou mock_gold.sqlite disponível (rode sem --skip-mock ou gere o arquivo)."
        )


def main() -> None:
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
        help="Apenas recria e valida o SQLite mock (sem chamada ao Groq)",
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
    args = parser.parse_args()

    if args.schema_info:
        run_schema_info()
        if not args.dry_prompt and not args.mock_only:
            return

    mock_db_path: Path | None = None
    if not args.skip_mock:
        print("=== Mock SQLite (camada Gold) ===\n")
        out = run_mock_sqlite_smoke()
        mock_db_path = out
        print(f"\nArquivo: {out.resolve()}\n")
    else:
        fallback = Path(__file__).resolve().parent / "database" / "mock_gold.sqlite"
        if fallback.is_file():
            mock_db_path = fallback

    if args.dry_prompt:
        run_dry_prompt(args.question)
        print()
        if args.mock_only:
            return

    if args.mock_only:
        return

    if not os.getenv("GROQ_API_KEY"):
        print(
            "GROQ_API_KEY não definida; defina no ambiente ou em .env para testar o modelo.\n"
            "Use --dry-prompt ou --schema-info para inspecionar o app sem API."
        )
        return

    print("=== Orquestrador Text-to-SQL (Groq / app.agents.orchestrator) ===\n")
    print("Pergunta:", args.question)
    try:
        asyncio.run(
            run_orchestrator_text_to_sql(
                args.question,
                mock_db_path=mock_db_path,
                exec_on_mock=not args.no_exec_mock,
            )
        )
    except Exception as exc:
        print(f"\nErro na chamada ao modelo: {exc}")


if __name__ == "__main__":
    main()
