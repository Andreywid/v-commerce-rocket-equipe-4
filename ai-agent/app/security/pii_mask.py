"""Mascaramento de CPF nas linhas retornadas ao usuário (pós-execução)."""

from __future__ import annotations

import re
from typing import Any

# Valor fixo exibido no lugar do documento (não revela dígitos).
MASKED_CPF_DISPLAY = "***.***.***-**"

_CPF_COLUMN = re.compile(r"(^|_)cpf($|_)", re.IGNORECASE)


def is_cpf_column_name(column_name: str) -> bool:
    """Indica se o nome da coluna se refere a CPF (ex.: cpf, id_cpf, cpf_hash)."""

    normalized = column_name.strip().strip('"').strip("'")
    if not normalized:
        return False
    return bool(_CPF_COLUMN.search(normalized))


def mask_cpf_in_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Devolve uma cópia das linhas com valores mascarados em colunas de CPF."""

    if not rows:
        return rows
    out: list[dict[str, Any]] = []
    for row in rows:
        new_row: dict[str, Any] = {}
        for key, value in row.items():
            if is_cpf_column_name(str(key)):
                new_row[key] = None if value is None else MASKED_CPF_DISPLAY
            else:
                new_row[key] = value
        out.append(new_row)
    return out
