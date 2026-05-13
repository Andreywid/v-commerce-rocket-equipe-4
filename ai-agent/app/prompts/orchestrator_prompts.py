"""Prompts auxiliares usados pelo orquestrador (ex.: recuperação após erro de execução)."""


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
