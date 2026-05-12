import sqlglot

from sqlglot import exp

from app.security.exceptions import (
    SQLValidationError
)

from app.security.policies import (
    ALLOWED_TABLES,
    BLOCKED_FUNCTIONS,
    BLOCKED_MUTATION_EXPRESSION_NAMES,
    BLOCKED_SET_OPERATION_NAMES,
    COMPLEXITY_WEIGHTS,
    MAX_JOINS,
    DEFAULT_LIMIT,
    MAX_COMPLEXITY_SCORE,
    MAX_SQL_LENGTH,
    SQL_DIALECT,
)

PREDICATE_EXPRESSION_NAMES = (
    "And",
    "Between",
    "EQ",
    "GT",
    "GTE",
    "ILike",
    "In",
    "Is",
    "Like",
    "LT",
    "LTE",
    "NEQ",
    "Not",
    "Or",
)


class SQLValidator:

    def validate(self, sql: str) -> str:
        try:
            sql_text = self._normalize_input(sql)
            tree = self._parse_sql(sql_text)

            self._validate_statement(tree)
            self._validate_ctes(tree)
            self._block_set_operations(tree)
            self._block_dangerous_expressions(tree)
            self._validate_tables(tree)
            self._validate_functions(tree)
            self._validate_joins(tree)
            self._validate_complexity(tree)
            self._enforce_limit(tree)

            return tree.sql(dialect=SQL_DIALECT, pretty=False)

        except SQLValidationError:
            raise

        except Exception as e:
            raise SQLValidationError(
                "SQL inválido"
            ) from e

    @staticmethod
    def _normalize_input(sql: str) -> str:
        if not isinstance(sql, str):
            raise SQLValidationError(
                "SQL deve ser uma string"
            )

        sql_text = sql.strip()

        if not sql_text:
            raise SQLValidationError(
                "SQL vazio não permitido"
            )

        if "\x00" in sql_text:
            raise SQLValidationError(
                "SQL contém caractere inválido"
            )

        if len(sql_text) > MAX_SQL_LENGTH:
            raise SQLValidationError(
                "SQL excede o tamanho máximo permitido"
            )

        return sql_text

    @staticmethod
    def _parse_sql(sql: str) -> exp.Expression:
        try:
            parsed = [
                expression
                for expression in sqlglot.parse(
                    sql,
                    dialect=SQL_DIALECT
                )
                if expression is not None
            ]

        except Exception as e:
            raise SQLValidationError(
                "SQL inválido"
            ) from e

        if len(parsed) != 1:
            raise SQLValidationError(
                "Exatamente um statement SELECT é permitido"
            )

        return parsed[0]

    @staticmethod
    def _validate_statement(tree: exp.Expression) -> None:
        if not isinstance(tree, exp.Select):
            raise SQLValidationError(
                "Apenas SELECT é permitido"
            )

    @staticmethod
    def _validate_ctes(tree: exp.Expression) -> None:
        if tree.find(exp.With):
            raise SQLValidationError(
                "CTEs não permitidas"
            )

    def _block_set_operations(self, tree: exp.Expression) -> None:
        blocked_expression = self._find_expression_by_name(
            tree,
            BLOCKED_SET_OPERATION_NAMES
        )

        if blocked_expression:
            raise SQLValidationError(
                "Operações de conjunto não permitidas"
            )

    def _block_dangerous_expressions(self, tree: exp.Expression) -> None:
        blocked_expression = self._find_expression_by_name(
            tree,
            BLOCKED_MUTATION_EXPRESSION_NAMES
        )

        if blocked_expression:
            raise SQLValidationError(
                f"Operação não permitida: {blocked_expression}"
            )

    @staticmethod
    def _find_expression_by_name(
        tree: exp.Expression,
        expression_names: tuple[str, ...],
    ) -> str | None:
        for expression_name in expression_names:
            expression_type = getattr(exp, expression_name, None)

            if expression_type is not None and tree.find(expression_type):
                return expression_name

        return None

    def _validate_tables(self, tree: exp.Expression) -> None:
        allowed_tables = {
            table.lower()
            for table in ALLOWED_TABLES
        }
        referenced_tables = set()

        for table in tree.find_all(exp.Table):
            normalized_table_name = self._normalize_table_name(table)

            if normalized_table_name not in allowed_tables:
                raise SQLValidationError(
                    f"Tabela não permitida: {table.name}"
                )

            referenced_tables.add(normalized_table_name)

        if not referenced_tables:
            raise SQLValidationError(
                "Consultas sem tabela não são permitidas"
            )

    @staticmethod
    def _normalize_table_name(table: exp.Table) -> str:
        if table.args.get("catalog") or table.args.get("db"):
            raise SQLValidationError(
                "Referência qualificada de tabela não permitida"
            )

        table_name = table.name

        if not table_name:
            raise SQLValidationError(
                "Referência de tabela inválida"
            )

        table_identifier = table.this
        is_quoted = (
            isinstance(table_identifier, exp.Identifier)
            and table_identifier.args.get("quoted")
        )

        if is_quoted:
            return table_name

        return table_name.lower()

    def _validate_functions(self, tree: exp.Expression) -> None:
        blocked_functions = {
            function.lower()
            for function in BLOCKED_FUNCTIONS
        }

        for function in tree.find_all(exp.Func):
            function_head = self._normalize_function_head(function)
            function_name = function_head.rsplit(".", 1)[-1]

            if "." in function_head:
                raise SQLValidationError(
                    f"Função qualificada não permitida: {function_head}"
                )

            if function_name in blocked_functions:
                raise SQLValidationError(
                    f"Função não permitida: {function_name}"
                )

    @staticmethod
    def _normalize_function_head(function: exp.Func) -> str:
        return (
            function.sql(dialect=SQL_DIALECT)
            .split("(", 1)[0]
            .strip()
            .replace('"', "")
            .lower()
        )

    @staticmethod
    def _validate_joins(tree: exp.Expression) -> None:
        joins = list(tree.find_all(exp.Join))

        if len(joins) > MAX_JOINS:
            raise SQLValidationError(
                f"Máximo de {MAX_JOINS} joins permitidos"
            )

        for join in joins:
            if not join.args.get("on") and not join.args.get("using"):
                raise SQLValidationError(
                    "JOIN sem condição explícita não permitido"
                )

    def _validate_complexity(self, tree: exp.Expression) -> None:
        score = self._complexity_score(tree)

        if score > MAX_COMPLEXITY_SCORE:
            raise SQLValidationError(
                "Complexidade da consulta excede o limite permitido "
                f"({score}/{MAX_COMPLEXITY_SCORE})"
            )

    def _complexity_score(self, tree: exp.Expression) -> int:
        score = COMPLEXITY_WEIGHTS["base_select"]
        score += self._count_tables(tree) * COMPLEXITY_WEIGHTS["table"]
        score += self._count_joins(tree) * COMPLEXITY_WEIGHTS["join"]
        score += (
            self._count_nested_selects(tree)
            * COMPLEXITY_WEIGHTS["nested_select"]
        )
        score += self._count_functions(tree) * COMPLEXITY_WEIGHTS["function"]
        score += self._count_expressions_by_name(
            tree,
            ("AggFunc",)
        ) * COMPLEXITY_WEIGHTS["aggregate"]
        score += self._count_expressions_by_name(
            tree,
            PREDICATE_EXPRESSION_NAMES
        ) * COMPLEXITY_WEIGHTS["predicate"]
        score += self._count_expressions_by_name(
            tree,
            ("Group",)
        ) * COMPLEXITY_WEIGHTS["group"]
        score += self._count_expressions_by_name(
            tree,
            ("Having",)
        ) * COMPLEXITY_WEIGHTS["having"]
        score += self._count_expressions_by_name(
            tree,
            ("Order",)
        ) * COMPLEXITY_WEIGHTS["order"]
        score += (
            self._count_select_projections(tree)
            * COMPLEXITY_WEIGHTS["projection"]
        )
        score += self._count_expressions_by_name(
            tree,
            ("Star",)
        ) * COMPLEXITY_WEIGHTS["star"]

        if tree.args.get("distinct"):
            score += COMPLEXITY_WEIGHTS["distinct"]

        return score

    @staticmethod
    def _count_tables(tree: exp.Expression) -> int:
        return sum(1 for _ in tree.find_all(exp.Table))

    @staticmethod
    def _count_joins(tree: exp.Expression) -> int:
        return sum(1 for _ in tree.find_all(exp.Join))

    @staticmethod
    def _count_functions(tree: exp.Expression) -> int:
        return sum(1 for _ in tree.find_all(exp.Func))

    @staticmethod
    def _count_nested_selects(tree: exp.Expression) -> int:
        select_count = sum(1 for _ in tree.find_all(exp.Select))
        return max(0, select_count - 1)

    @staticmethod
    def _count_select_projections(tree: exp.Expression) -> int:
        return sum(
            len(select.expressions)
            for select in tree.find_all(exp.Select)
        )

    @staticmethod
    def _count_expressions_by_name(
        tree: exp.Expression,
        expression_names: tuple[str, ...],
    ) -> int:
        count = 0

        for expression_name in expression_names:
            expression_type = getattr(exp, expression_name, None)

            if expression_type is not None:
                count += sum(
                    1
                    for _ in tree.find_all(expression_type)
                )

        return count

    @staticmethod
    def _enforce_limit(tree: exp.Expression) -> None:
        if tree.args.get("offset"):
            raise SQLValidationError(
                "OFFSET não permitido"
            )

        limit = tree.args.get("limit")

        if limit is None:
            tree.set(
                "limit",
                exp.Limit(
                    expression=exp.Literal.number(
                        DEFAULT_LIMIT
                    )
                )
            )
            return

        limit_value = SQLValidator._literal_limit_value(limit)

        if limit_value < 1 or limit_value > DEFAULT_LIMIT:
            raise SQLValidationError(
                f"LIMIT deve estar entre 1 e {DEFAULT_LIMIT}"
            )

    @staticmethod
    def _literal_limit_value(limit: exp.Limit) -> int:
        limit_expression = limit.args.get("expression")

        if (
            not isinstance(limit_expression, exp.Literal)
            or limit_expression.args.get("is_string")
            or not str(limit_expression.this).isdecimal()
        ):
            raise SQLValidationError(
                "LIMIT deve ser um literal inteiro"
            )

        return int(limit_expression.this)


_DEFAULT_VALIDATOR = SQLValidator()


def validate_sql(sql: str) -> str:
    return _DEFAULT_VALIDATOR.validate(sql)
