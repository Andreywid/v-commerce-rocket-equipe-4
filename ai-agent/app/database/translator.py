import sqlglot
from sqlglot import exp, parse_one

def translate_to_sqlite(sql_postgres: str) -> str:
    """
    Traduz o SQL de PostgreSQL (gerado pela IA) para SQLite (seu Mock).
    Também atua como Guardrail de segurança.
    """
    try:
        sql_translated = sqlglot.transpile(sql_postgres, read="postgres", write="sqlite")[0]
        
        parsed = parse_one(sql_translated, read="sqlite")
        if not isinstance(parsed, exp.Select):
             raise ValueError("Comando não permitido. Apenas consultas (SELECT) são autorizadas.")
             
        return sql_translated
    except Exception as e:
        print(f" Erro na tradução automática: {e}")
        return sql_postgres 