from __future__ import annotations
import sqlite3
import pandas as pd
from typing import TYPE_CHECKING, Any
from app.database.connection import DB_TYPE
from app.database.translator import translate_to_sqlite

if TYPE_CHECKING:
    from asyncpg import Connection

class QueryExecutor:
    def __init__(self):
        self.db_type = DB_TYPE

    async def execute(self, conn: Any, sql: str) -> list[dict[str, Any]]:
        """
        Executa a query no banco de dados atual. 
        Se for SQLite, traduz o dialeto antes de executar.
        """
        if self.db_type == "sqlite":
            sql_traduzido = translate_to_sqlite(sql)
            
            try:
                df = pd.read_sql_query(sql_traduzido, conn)
                return df.to_dict(orient="records")
            except Exception as e:
                print(f"Erro ao executar no SQLite: {e}")
                raise e
        
        else:
            rows = await conn.fetch(sql)
            return [dict(row) for row in rows]