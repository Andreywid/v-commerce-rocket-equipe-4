"""Exceções específicas da camada de validação SQL."""

class SQLValidationError(ValueError):
    """Raised when generated SQL violates the validation policy."""
