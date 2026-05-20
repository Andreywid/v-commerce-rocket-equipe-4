import os
import sqlite3
import asyncpg
from pathlib import Path
from typing import Union

DB_TYPE = os.getenv("DB_TYPE", "sqlite")
_SQLITE_PATH = Path(__file__).resolve().parent / "mock_gold.sqlite"


async def get_connection():
    if DB_TYPE == "sqlite":
        return sqlite3.connect(str(_SQLITE_PATH))
    
    else:
        return await asyncpg.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "5432")),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "postgres"),
        )