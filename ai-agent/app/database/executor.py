from __future__ import annotations

from typing import Any


class QueryExecutor:

    async def execute(self, conn: Any, sql: str) -> list[dict[str, Any]]:
        if hasattr(conn, "fetch"):
            rows = await conn.fetch(sql)
            return [dict(row) for row in rows]

        cursor = conn.cursor()
        cursor.execute(sql.strip().rstrip(";"))
        colnames = [description[0] for description in (cursor.description or [])]
        return [dict(zip(colnames, row)) for row in cursor.fetchall()]
