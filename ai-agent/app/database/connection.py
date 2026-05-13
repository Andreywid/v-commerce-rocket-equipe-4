import os
import sqlite3
import asyncpg
from typing import Union

DB_TYPE = os.getenv("DB_TYPE", "sqlite") 

async def get_connection():
    """
    Factory que retorna a conexão correta baseada no ambiente.
    """
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