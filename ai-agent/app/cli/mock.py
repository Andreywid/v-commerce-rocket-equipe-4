"""Helpers do SQLite mock usados pela CLI."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from app.database.mock_gold import build_mock_sqlite
from app.database.schema_registry import GOLD_SCHEMA


def open_mock_connection(
    *,
    exec_on_mock: bool,
    mock_db_path: Path | None,
) -> sqlite3.Connection | None:
    """Abre conexão com o mock apenas quando execução local está habilitada."""

    if exec_on_mock and mock_db_path is not None and mock_db_path.is_file():
        return sqlite3.connect(mock_db_path)
    return None


def resolve_existing_mock_path() -> Path | None:
    """Retorna o mock padrão se ele já existir."""

    fallback = Path(__file__).resolve().parents[1] / "database" / "mock_gold.sqlite"
    return fallback if fallback.is_file() else None


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
