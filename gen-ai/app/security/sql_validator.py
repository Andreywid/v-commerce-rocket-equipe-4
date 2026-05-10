FORBIDDEN_COMMANDS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "CREATE",
    "TRUNCATE",
    "PRAGMA",
}

def validate_sql(sql: str):

    sql_upper = sql.upper()

    for command in FORBIDDEN_COMMANDS:

        if command in sql_upper:

            raise ValueError(
                f"Comando proibido detectado: {command}"
            )

