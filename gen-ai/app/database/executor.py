from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from asyncpg import Connection


class QueryExecutor:

    async def execute(self, conn: Connection, sql: str) -> list[dict[str, Any]]:  # type: ignore[name-defined]
        rows = await conn.fetch(sql)
        return [dict(row) for row in rows]
