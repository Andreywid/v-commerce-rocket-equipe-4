"""Reconstrói mock_gold.sqlite com os CSVs reais da camada Gold.

Tabelas sem CSV disponível mantêm os dados de amostra do mock,
garantindo que o agente tenha algo para consultar em todas as tabelas.

Uso (a partir de ai-agent/):
    python -m app.database.load_gold_csv
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

from app.database.mock_gold import _create_tables, _seed
from app.database.schema_registry import GOLD_SCHEMA

# Pasta com os CSVs Gold exportados do pipeline (raiz do monorepo/data/gold)
_GOLD_DIR = Path(__file__).resolve().parents[3] / "data" / "gold"
_SQLITE = Path(__file__).resolve().parent / "mock_gold.sqlite"


def _csv_path(table: str) -> Path | None:
    """Retorna o caminho do CSV se existir, None caso contrário."""
    p = _GOLD_DIR / f"{table}.csv"
    return p if p.exists() else None


def build(output: Path | None = None) -> Path:
    """Reconstrói o SQLite priorizando CSVs reais sobre dados mock."""
    out = output or _SQLITE

    if out.exists():
        out.unlink()

    conn = sqlite3.connect(out)
    try:
        cur = conn.cursor()

        # Cria schema apenas — os CSVs vão popular todas as tabelas a seguir.
        _create_tables(cur)
        conn.commit()

        loaded: list[tuple[str, int]] = []
        mocked: list[str] = []

        for table in GOLD_SCHEMA:
            csv = _csv_path(table)

            if csv is None:
                mocked.append(table)
                continue

            # Remove os dados mock e carrega os dados reais do CSV
            cur.execute(f'DELETE FROM "{table}"')

            df = pd.read_csv(csv, low_memory=False)
            df.columns = [c.strip().lower() for c in df.columns]

            # Usa apenas colunas declaradas no schema (ignora colunas extras do CSV)
            schema_cols = list(GOLD_SCHEMA[table]["colunas"].keys())
            cols = [c for c in schema_cols if c in df.columns]

            df[cols].to_sql(table, conn, if_exists="append", index=False)
            conn.commit()

            loaded.append((table, len(df)))

    finally:
        conn.close()

    print("=== Gold SQLite reconstruido ===\n")
    for table, n in loaded:
        print(f"  OK {table}: {n:,} linhas")
    if mocked:
        print("\n  ~ dados mock mantidos (CSV ausente):")
        for t in mocked:
            print(f"      {t}")
    print(f"\nArquivo: {out.resolve()}")

    return out


if __name__ == "__main__":
    build()
