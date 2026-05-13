from __future__ import annotations

import sqlite3
import pandas as pd
from typing import TYPE_CHECKING, Any

from app.database.connection import DB_TYPE
from app.database.translator import translate_to_sqlite

if TYPE_CHECKING:
    from asyncpg import Connection


class QueryExecutor:
    # Antes não havia construtor.
    # Agora o executor guarda o tipo de banco configurado no ambiente.
    def __init__(self):
        self.db_type = DB_TYPE

    # Antes conn era tipado como Connection do asyncpg.
    # Agora usa Any porque pode receber conexão SQLite ou PostgreSQL.
    async def execute(self, conn: Any, sql: str) -> list[dict[str, Any]]:
        """
        Executa a query no banco de dados atual.
        Se for SQLite, traduz o dialeto antes de executar.
        """

        # Novo fluxo para ambiente SQLite/mock local.
        if self.db_type == "sqlite":
            # Traduz SQL PostgreSQL gerado pela IA para sintaxe compatível com SQLite.
            sql_traduzido = translate_to_sqlite(sql)

            try:
                # SQLite é executado com pandas.read_sql_query,
                # retornando DataFrame convertido para lista de dicionários.
                df = pd.read_sql_query(sql_traduzido, conn)
                return df.to_dict(orient="records")
            except Exception as e:
                # Tratamento básico de erro para facilitar debug local.
                print(f"Erro ao executar no SQLite: {e}")
                raise e

        else:
            rows = await conn.fetch(sql)
            return [dict(row) for row in rows]