"""Constantes de política usadas pelo validador SQL e pelos guardrails."""

from app.database.schema_registry import (
    GOLD_SCHEMA,
)

SQL_DIALECT = "postgres"

MAX_SQL_LENGTH = 10_000

# As tabelas permitidas vêm do registry para manter a política alinhada ao schema.
ALLOWED_TABLES = frozenset(GOLD_SCHEMA)

BLOCKED_FUNCTIONS = {
    "pg_sleep",
    "pg_read_file",
    "dblink",
}

BLOCKED_SET_OPERATION_NAMES = (
    "Union",
    "Except",
    "Intersect",
)

BLOCKED_MUTATION_EXPRESSION_NAMES = (
    "Alter",
    "Analyze",
    "Attach",
    "Cache",
    "Command",
    "Commit",
    "Copy",
    "Create",
    "Delete",
    "Describe",
    "Drop",
    "Execute",
    "Grant",
    "Insert",
    "LoadData",
    "Merge",
    "Pragma",
    "RenameTable",
    "Rollback",
    "Set",
    "TruncateTable",
    "Update",
    "Use",
    "Vacuum",
)

MAX_JOINS = 5

DEFAULT_LIMIT = 100

MAX_COMPLEXITY_SCORE = 100

# Pesos simples para impedir consultas geradas muito caras ou difíceis de auditar.
COMPLEXITY_WEIGHTS = {
    "base_select": 1,
    "table": 1,
    "join": 2,
    "nested_select": 2,
    "function": 1,
    "aggregate": 1,
    "predicate": 1,
    "group": 1,
    "having": 2,
    "order": 1,
    "projection": 0,
    "star": 2,
    "distinct": 2,
}