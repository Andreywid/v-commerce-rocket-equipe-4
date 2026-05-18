"""Mascaramento de dados pessoais nas linhas retornadas pelo agente."""

from __future__ import annotations

import re
from typing import Any


MASKED_CPF_DISPLAY = "***.***.***-**"

_CPF_COLUMN = re.compile(r"(^|_)cpf($|_)", re.IGNORECASE)

_PHONE_COLUMN = re.compile(
    r"(telefone|phone|celular|whatsapp|numero_telefone|número_telefone)",
    re.IGNORECASE,
)

_EMAIL_COLUMN = re.compile(
    r"(^|_)(email|e_mail|mail)($|_)",
    re.IGNORECASE,
)

_NAME_COLUMNS = {
    "nome",
    "nome_cliente",
    "cliente_nome",
    "name",
    "customer_name",
}

_ADDRESS_COLUMN = re.compile(
    r"(endereco|endereço|logradouro|rua|numero_endereco|número_endereço|complemento|cep)",
    re.IGNORECASE,
)


def _normalize_column_name(column_name: str) -> str:
    """Normaliza o nome da coluna para comparação."""

    return column_name.strip().strip('"').strip("'").casefold()


def is_cpf_column_name(column_name: str) -> bool:
    normalized = _normalize_column_name(column_name)
    return bool(normalized and _CPF_COLUMN.search(normalized))


def is_phone_column_name(column_name: str) -> bool:
    normalized = _normalize_column_name(column_name)
    return bool(_PHONE_COLUMN.search(normalized))


def is_email_column_name(column_name: str) -> bool:
    normalized = _normalize_column_name(column_name)
    return bool(_EMAIL_COLUMN.search(normalized))


def is_name_column_name(column_name: str) -> bool:
    normalized = _normalize_column_name(column_name)
    return normalized in _NAME_COLUMNS


def is_address_column_name(column_name: str) -> bool:
    normalized = _normalize_column_name(column_name)
    return bool(_ADDRESS_COLUMN.search(normalized))


def mask_cpf(value: Any) -> Any:
    """
    CPF nunca aparece completo.

    Exemplo:
    12345678900 -> ***.***.***-**
    """

    if value is None:
        return None

    return MASKED_CPF_DISPLAY


def mask_phone(value: Any) -> Any:
    """
    Telefone segue o padrão decidido:
    81987654321 -> (**)*******21

    Mantém apenas os 2 últimos dígitos.
    """

    if value is None:
        return None

    raw = str(value).strip()
    digits = re.sub(r"\D", "", raw)

    if len(digits) < 2:
        if raw.startswith("+"):
            return "+** (**)*******"
        return "(**)*******"

    last_two = digits[-2:]

    if raw.startswith("+"):
        return f"+** (**)*******{last_two}"

    return f"(**)*******{last_two}"


def _mask_email_local(local: str) -> str:
    """
    Mascara a parte antes do @.

    Exemplos:
    diegonery -> d***y
    ana -> a***a
    a -> a***
    """

    if not local:
        return "***"

    if len(local) == 1:
        return f"{local[0]}***"

    first_char = local[0]
    last_char = local[-1]

    return f"{first_char}***{last_char}"


def _mask_email_domain(domain: str) -> str:
    """
    Mascara o domínio do e-mail preservando a extensão final.

    Exemplos:
    gmail.com -> g***l.com
    hotmail.com -> h***l.com
    empresa.com.br -> e***a.com.br
    x.com -> x***.com
    """

    if not domain:
        return "***"

    domain = domain.strip()

    if "." not in domain:
        if len(domain) == 1:
            return f"{domain}***"
        return f"{domain[0]}***{domain[-1]}"

    domain_name, extension = domain.split(".", 1)

    if not domain_name:
        return f"***.{extension}"

    if len(domain_name) == 1:
        masked_domain_name = f"{domain_name}***"
    else:
        masked_domain_name = f"{domain_name[0]}***{domain_name[-1]}"

    return f"{masked_domain_name}.{extension}"


def mask_email(value: Any) -> Any:
    """
    E-mail segue o padrão decidido:
    mantém primeiro e último caractere antes do @
    e também mascara o domínio.

    Exemplo:
    diegonery@gmail.com -> d***y@g***l.com
    """

    if value is None:
        return None

    email = str(value).strip()

    if "@" not in email:
        return "***"

    local, domain = email.split("@", 1)

    masked_local = _mask_email_local(local)
    masked_domain = _mask_email_domain(domain)

    return f"{masked_local}@{masked_domain}"


def mask_name(value: Any) -> Any:
    """
    Nome segue a regra decidida:

    - O primeiro nome fica visível.
    - O segundo nome vira apenas inicial.

    Exemplos:
    Diego Nery -> Diego N.
    Ana Souza -> Ana S.

    A engenharia de dados informou que os nomes já chegam reduzidos
    para dois nomes na Silver/Gold.
    """

    if value is None:
        return None

    name = str(value).strip()

    if not name:
        return name

    parts = name.split()

    first_name = parts[0]

    if len(parts) == 1:
        return first_name

    second_initial = parts[1][0]

    return f"{first_name} {second_initial}."


def mask_address(value: Any) -> Any:
    """
    Endereço completo não deve aparecer.

    Cidade e estado continuam aparecendo, porque não entram nessa regra.
    """

    if value is None:
        return None

    return "[endereço ocultado]"


def mask_sensitive_value(
    column_name: str,
    value: Any,
) -> Any:
    """Aplica a regra correta conforme o nome da coluna."""

    if is_cpf_column_name(column_name):
        return mask_cpf(value)

    if is_phone_column_name(column_name):
        return mask_phone(value)

    if is_email_column_name(column_name):
        return mask_email(value)

    if is_address_column_name(column_name):
        return mask_address(value)

    if is_name_column_name(column_name):
        return mask_name(value)

    return value


def mask_sensitive_fields_in_rows(
    rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Aplica a política de privacidade nas linhas retornadas ao usuário.

    Política:
    - CPF: ***.***.***-**
    - Telefone: (**)*******XX
    - E-mail: primeiro e último caractere antes do @ + domínio mascarado
    - Nome: primeiro nome + inicial do segundo nome
    - Endereço completo: [endereço ocultado]
    - Cidade e estado: mantidos
    """

    if not rows:
        return rows

    masked_rows: list[dict[str, Any]] = []

    for row in rows:
        masked_row: dict[str, Any] = {}

        for column_name, value in row.items():
            masked_row[column_name] = mask_sensitive_value(
                str(column_name),
                value,
            )

        masked_rows.append(masked_row)

    return masked_rows


def mask_cpf_in_rows(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return mask_sensitive_fields_in_rows(rows)