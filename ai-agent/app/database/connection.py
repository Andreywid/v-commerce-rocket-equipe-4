import os
import sqlite3
import asyncpg
from typing import Union

# Antes não existia escolha de tipo de banco.
# Agora DB_TYPE define se o ambiente usa SQLite ou PostgreSQL.
# O padrão é "sqlite", facilitando o uso local com mock.
DB_TYPE = os.getenv("DB_TYPE", "sqlite")


async def get_connection():
    """
    Factory que retorna a conexão correta baseada no ambiente.
    """

    # Antes a função sempre conectava no PostgreSQL.
    # Agora, se DB_TYPE for "sqlite", conecta no banco mock local.
    if DB_TYPE == "sqlite":
        return sqlite3.connect("ai-agent/app/database/mock_gold.sqlite")
    
    else:
        return await asyncpg.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "postgres"),
        )