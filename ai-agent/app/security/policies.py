from app.database.schema_registry import (
    GOLD_SCHEMA,
)

SQL_DIALECT = "postgres"

MAX_SQL_LENGTH = 10_000

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

COMPLEXITY_WEIGHTS = {
    "base_select": 5,
    "table": 4,
    "join": 12,
    "nested_select": 20,
    "function": 4,
    "aggregate": 6,
    "predicate": 2,
    "group": 8,
    "having": 8,
    "order": 6,
    "distinct": 10,
    "projection": 1,
    "star": 10,
}