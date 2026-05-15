"""Adaptador assíncrono para executar SQL em conexões reais ou mocks SQLite."""

from __future__ import annotations

from typing import Any

import pandas as pd

from app.database.connection import DB_TYPE
from app.database.translator import translate_to_sqlite
from app.security.pii_mask import mask_sensitive_fields_in_rows


class QueryExecutor:
    """Executa consultas SELECT validadas e normaliza linhas para dicionários."""

    def __init__(self) -> None:
        self.db_type = DB_TYPE

    async def execute(self, conn: Any, sql: str) -> list[dict[str, Any]]:
        """Suporta SQLite local (mock), asyncpg e conexões DB-API síncronas."""

        if self.db_type == "sqlite":
            sql_traduzido = translate_to_sqlite(sql)

            try:
                df = pd.read_sql_query(sql_traduzido, conn)
                return mask_sensitive_fields_in_rows(
                    df.to_dict(orient="records")
                )

            except Exception as exc:
                print(f"Erro ao executar no SQLite: {exc}")
                raise

        if hasattr(conn, "fetch"):
            rows = await conn.fetch(sql)
            return mask_sensitive_fields_in_rows(
                [dict(row) for row in rows]
            )

        cursor = conn.cursor()
        cursor.execute(sql.strip().rstrip(";"))

        colnames = [
            description[0]
            for description in (cursor.description or [])
        ]

        raw = [
            dict(zip(colnames, row))
            for row in cursor.fetchall()
        ]

        return mask_sensitive_fields_in_rows(raw)