"""Guardrails de pergunta e de acesso aplicados ao SQL gerado."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

import sqlglot
from sqlglot import exp

from app.models.deps import Deps
from app.security.policies import ALLOWED_TABLES, SQL_DIALECT


class PolicyViolation(ValueError):
    """Raised when a question or SQL violates execution policy."""


PROMPT_ATTACK_PATTERNS = (
    r"\bignore\b.*\binstru",
    r"\bignorar\b.*\binstru",
    r"\bdesconsidere\b.*\binstru",
    r"\bsystem prompt\b",
    r"\bprompt do sistema\b",
    r"\bdeveloper message\b",
    r"\bjailbreak\b",
    r"\bapi key\b",
    r"\bchave de api\b",
    r"\bsegredo\b",
    r"\bsenha\b",
)

OUT_OF_DOMAIN_PATTERNS = (
    r"\bprevisao do tempo\b",
    r"\bclima\b",
    r"\bfutebol\b",
    r"\bfilme\b",
    r"\bmusica\b",
    r"\bpiada\b",
    r"\bpoema\b",
    r"\bcurriculo\b",
    r"\bnoticia\b",
)


@dataclass(frozen=True)
class SQLAccess:
    """Resumo das tabelas, colunas e projeções detectadas em uma consulta."""

    tables: frozenset[str]
    columns_by_table: dict[str, frozenset[str]]
    has_star: bool


class QueryPolicy:
    """Guardrails determinísticos aplicados antes da execução de SQL gerado por LLM."""

    def validate_question(self, question: str, deps: Deps) -> None:
        """Rejeita perguntas vazias, fora do domínio ou com prompt injection."""

        normalized_question = self._normalize_text(question)

        if not normalized_question:
            raise PolicyViolation("Pergunta vazia não permitida")

        if deps.require_tenant and not deps.tenant_id:
            raise PolicyViolation("Tenant obrigatório não informado")

        self._reject_patterns(
            normalized_question,
            PROMPT_ATTACK_PATTERNS,
            "Pedido incompatível com o uso do assistente: tentativa de alterar ou expor instruções internas, chaves ou segredos.",
        )
        self._reject_patterns(
            normalized_question,
            OUT_OF_DOMAIN_PATTERNS,
            "Assunto fora do escopo: o assistente só responde perguntas analíticas sobre dados de comércio e vendas da V-Commerce.",
        )

    def validate_sql(self, sql: str, deps: Deps) -> SQLAccess:
        """Extrai acessos do SQL e aplica as políticas do usuário."""

        access = self._extract_access(sql)
        self._validate_tables(access, deps)
        self._validate_columns(access, deps)
        return access

    @staticmethod
    def _normalize_text(text: str) -> str:
        normalized = unicodedata.normalize("NFKD", text or "")
        normalized = "".join(char for char in normalized if not unicodedata.combining(char))
        return normalized.casefold().strip()

    @staticmethod
    def _reject_patterns(text: str, patterns: tuple[str, ...], message: str) -> None:
        if any(re.search(pattern, text) for pattern in patterns):
            raise PolicyViolation(message)

    def _extract_access(self, sql: str) -> SQLAccess:
        """Usa AST do sqlglot para mapear tabelas e colunas referenciadas."""

        try:
            tree = sqlglot.parse_one(sql, dialect=SQL_DIALECT)
        except Exception as exc:
            raise PolicyViolation("SQL inválido para avaliação de política") from exc

        alias_to_table: dict[str, str] = {}
        tables: list[str] = []

        for table in tree.find_all(exp.Table):
            table_name = self._normalize_identifier(table.name)
            tables.append(table_name)

            alias = table.alias_or_name
            if alias:
                alias_to_table[self._normalize_identifier(alias)] = table_name

        unique_tables = frozenset(tables)
        columns_by_table: dict[str, set[str]] = {table: set() for table in unique_tables}

        for column in tree.find_all(exp.Column):
            column_name = self._normalize_identifier(column.name)
            table_ref = self._normalize_identifier(column.table) if column.table else None
            table_name = alias_to_table.get(table_ref or "")

            if table_name is None and table_ref in unique_tables:
                table_name = table_ref

            if table_name is None and len(unique_tables) == 1:
                table_name = next(iter(unique_tables))

            if table_name is not None and column_name:
                columns_by_table.setdefault(table_name, set()).add(column_name)

        return SQLAccess(
            tables=unique_tables,
            columns_by_table={
                table: frozenset(columns)
                for table, columns in columns_by_table.items()
            },
            has_star=self._has_projection_star(tree),
        )

    @staticmethod
    def _has_projection_star(tree: exp.Expression) -> bool:
        """Identifica ``SELECT *`` sem confundir com agregações como COUNT(*)."""

        for select in tree.find_all(exp.Select):
            for projection in select.expressions:
                if isinstance(projection, exp.Star):
                    return True
                if (
                    isinstance(projection, exp.Column)
                    and isinstance(projection.this, exp.Star)
                ):
                    return True

        return False

    @staticmethod
    def _normalize_identifier(identifier: str | None) -> str:
        return (identifier or "").strip('"').casefold()

    @staticmethod
    def _validate_tables(access: SQLAccess, deps: Deps) -> None:
        """Confere se todas as tabelas acessadas estão no escopo permitido."""

        allowed_tables = (
            frozenset(ALLOWED_TABLES)
            if deps.allow_all_schema_access
            else deps.allowed_tables or frozenset(ALLOWED_TABLES)
        )
        normalized_allowed_tables = {
            table.casefold()
            for table in allowed_tables
        }

        denied_tables = sorted(access.tables - normalized_allowed_tables)
        if denied_tables:
            raise PolicyViolation(
                "Tabela não permitida pela política de acesso: "
                + ", ".join(denied_tables)
            )

    @staticmethod
    def _validate_columns(access: SQLAccess, deps: Deps) -> None:
        """Aplica allowlist de colunas quando o request informar restrições."""

        if deps.allow_all_schema_access or not deps.allowed_columns:
            return

        normalized_allowed_columns = {
            table.casefold(): {column.casefold() for column in columns}
            for table, columns in deps.allowed_columns.items()
        }

        if access.has_star:
            raise PolicyViolation(
                "SELECT * não permitido quando há política de colunas"
            )

        for table, columns in access.columns_by_table.items():
            allowed_columns = normalized_allowed_columns.get(table)
            if allowed_columns is None:
                continue

            denied_columns = sorted(columns - allowed_columns)
            if denied_columns:
                raise PolicyViolation(
                    f"Coluna não permitida em {table}: "
                    + ", ".join(denied_columns)
                )
