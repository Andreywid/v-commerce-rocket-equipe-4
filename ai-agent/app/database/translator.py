import sqlglot
from sqlglot import exp, parse_one


class SQLTranslationError(ValueError):
    """Raised when a validated SQL cannot be safely translated to SQLite."""


def translate_to_sqlite(sql_postgres: str) -> str:
    """
    Traduz o SQL de PostgreSQL (gerado pela IA) para SQLite (seu Mock).
    Também atua como Guardrail de segurança.
    """
    try:
        sql_translated = sqlglot.transpile(sql_postgres, read="postgres", write="sqlite")[0]

        parsed = parse_one(sql_translated, read="sqlite")
        if not isinstance(parsed, exp.Select):
            raise SQLTranslationError(
                "Comando não permitido. Apenas consultas (SELECT) são autorizadas."
            )

        return sql_translated
    except SQLTranslationError:
        raise
    except Exception as e:
        raise SQLTranslationError(
            f"Não foi possível traduzir a consulta para SQLite: {e}"
        ) from e
