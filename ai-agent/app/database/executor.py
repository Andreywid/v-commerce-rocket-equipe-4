"""Adaptador assíncrono para executar SQL em conexões reais ou mocks SQLite."""

from __future__ import annotations

from typing import Any

from app.security.pii_mask import mask_cpf_in_rows


class QueryExecutor:
    """Executa consultas SELECT validadas e normaliza linhas para dicionários."""

    async def execute(self, conn: Any, sql: str) -> list[dict[str, Any]]:
        """Suporta conexões async com ``fetch`` e conexões DB-API síncronas."""

        if hasattr(conn, "fetch"):
            rows = await conn.fetch(sql)
            return mask_cpf_in_rows([dict(row) for row in rows])

        cursor = conn.cursor()
        cursor.execute(sql.strip().rstrip(";"))
        colnames = [description[0] for description in (cursor.description or [])]
        raw = [dict(zip(colnames, row)) for row in cursor.fetchall()]
        return mask_cpf_in_rows(raw)
