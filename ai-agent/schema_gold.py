"""Compatibilidade: o schema Gold vive em ``app.database.schema_registry``."""

from app.database.schema_registry import GOLD_SCHEMA, get_schema_prompt

__all__ = ["GOLD_SCHEMA", "get_schema_prompt"]
