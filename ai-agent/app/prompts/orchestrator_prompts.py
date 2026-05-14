"""Prompts auxiliares usados pelo orquestrador (ex.: recuperação após erro)."""


def format_sql_recovery_after_validation_error(
    *,
    original_question: str,
    failed_sql: str,
    validation_error: str,
) -> str:
    """Reformula o pedido para o gerador SQL corrigir consulta rejeitada."""

    return (
        f"{original_question}\n\n"
        "# CORREÇÃO NECESSÁRIA\n"
        "A consulta abaixo foi rejeitada pelo validador determinístico da aplicação. "
        "Gere um novo SQL que responda à pergunta original usando apenas SELECT, "
        "tabelas e colunas do schema fornecido no prompt.\n\n"
        f"Erro do validador: {validation_error}\n\n"
        "SQL rejeitado:\n```sql\n"
        f"{failed_sql.strip()}\n"
        "```"
    )


def format_sql_recovery_after_exec_error(
    *,
    original_question: str,
    failed_sql: str,
    db_error: str,
) -> str:
    """Reformula o pedido para o gerador SQL corrigir consulta que falhou no banco."""

    return (
        f"{original_question}\n\n"
        "# CORREÇÃO NECESSÁRIA\n"
        "A consulta abaixo foi validada na aplicação, mas falhou na execução no banco. "
        "Gere um novo SQL que responda à pergunta original usando apenas tabelas e colunas "
        "do schema fornecido no prompt.\n\n"
        f"Erro do banco: {db_error}\n\n"
        "SQL que falhou:\n```sql\n"
        f"{failed_sql.strip()}\n"
        "```"
    )
