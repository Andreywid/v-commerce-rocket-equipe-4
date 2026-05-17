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

OUT_OF_DOMAIN_RULES = (
    (
        "clima e previsão do tempo",
        (
            r"\bprevisao do tempo\b",
            r"\bprevisao\b.*\btempo\b",
            r"\bclima\b",
            r"\btemperatura\b",
            r"\bchuva\b",
        ),
    ),
    (
        "notícias, esportes e entretenimento",
        (
            r"\bfutebol\b",
            r"\bplacar\b",
            r"\bjogo de hoje\b",
            r"\bfilme\b",
            r"\bserie\b",
            r"\bmusica\b",
            r"\bnoticia\b",
        ),
    ),
    (
        "conhecimento geral",
        (
            r"\bcapital da\b",
            r"\bcapital de\b",
            r"\bhistoria do\b",
            r"\bhoroscopo\b",
        ),
    ),
    (
        "mercado financeiro externo aos dados do CRM",
        (
            r"\bcotacao\b",
            r"\bdolar\b",
            r"\beuro\b",
            r"\bbolsa de valores\b",
            r"\bibovespa\b",
            r"\bbitcoin\b",
            r"\bcriptomoeda\b",
            r"\btaxa de cambio\b",
        ),
    ),
    (
        "geração ou edição de conteúdo fora dos dados",
        (
            r"\btraduza\b",
            r"\btraduzir\b",
            r"\bresuma\b",
            r"\bresumir\b",
            r"\bescreva\b",
            r"\bcrie um texto\b",
            r"\bpiada\b",
            r"\bpoema\b",
            r"\bcurriculo\b",
            r"\bcodigo\b",
            r"\bprograma em\b",
        ),
    ),
    (
        "pedidos operacionais fora da consulta analítica",
        (
            r"\benvie\b.*\bemail\b",
            r"\bmande\b.*\bemail\b",
            r"\bagende\b",
            r"\bmarque\b.*\breuniao\b",
            r"\babra um chamado\b",
            r"\bcrie uma imagem\b",
        ),
    ),
    (
        "assuntos não analíticos",
        (
            r"\bquanto e\b.*\d",
            r"\breceita de bolo\b",
            r"\bcomida\b",
            r"\bviagem\b",
            r"\bhospedagem\b",
        ),
    ),
    (
        "informações de identificação pessoal (PII)",
        (
            r"\bemail\b",
            r"\btelefone\b",
            r"\bcpf\b",
            r"\bdocumento\b",
            r"\brg\b",
            r"\bendereco\b",
            r"\bcep\b",
        ),
    ),
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
        self._reject_out_of_domain(normalized_question)

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

    @staticmethod
    def _reject_out_of_domain(text: str) -> None:
        for category, patterns in OUT_OF_DOMAIN_RULES:
            if any(re.search(pattern, text) for pattern in patterns):
                raise PolicyViolation(
                    "Assunto fora do escopo dos dados disponíveis: "
                    f"{category}. O assistente responde apenas perguntas analíticas "
                    "sobre vendas, clientes, pedidos, produtos, suporte, avaliações "
                    "e comportamento digital da V-Commerce."
                )

    def _extract_access(self, sql: str) -> SQLAccess:
        """Usa AST do sqlglot para mapear tabelas e colunas referenciadas."""

        try:
            tree = sqlglot.parse_one(sql, dialect=SQL_DIALECT)
        except Exception as exc:
            raise PolicyViolation("SQL inválido para avaliação de política") from exc

        alias_to_table: dict[str, str] = {}
        tables: list[str] = []
        cte_names = self._cte_names(tree)

        for table in tree.find_all(exp.Table):
            table_name = self._normalize_identifier(table.name)

            if table_name in cte_names:
                continue

            tables.append(table_name)

            alias = table.alias_or_name
            if alias:
                alias_to_table[self._normalize_identifier(alias)] = table_name

        unique_tables = frozenset(tables)
        columns_by_table: dict[str, set[str]] = {table: set() for table in unique_tables}

        for column in tree.find_all(exp.Column):
            column_name = self._normalize_identifier(column.name)
            table_ref = self._normalize_identifier(column.table) if column.table else None

            if table_ref in cte_names:
                continue

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

    @classmethod
    def _cte_names(cls, tree: exp.Expression) -> frozenset[str]:
        """Retorna aliases de CTEs para política validar só tabelas físicas."""

        return frozenset(
            cls._normalize_identifier(cte.alias)
            for cte in tree.find_all(exp.CTE)
            if cte.alias
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
        """Aplica allowlist e denylist de colunas."""

        if access.has_star and not deps.allow_all_schema_access:
            if deps.allowed_columns:
                raise PolicyViolation(
                    "SELECT * não permitido quando há política de colunas"
                )

        denied_columns = {
            "email",
            "telefone",
            "cpf",
            "rg",
            "documento",
            "endereco",
            "cep",
        }
        for table, columns in access.columns_by_table.items():
            found_denied = sorted(columns.intersection(denied_columns))
            if found_denied:
                raise PolicyViolation(
                    f"Acesso negado à coluna sensível em {table}: "
                    + ", ".join(found_denied)
                )

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
