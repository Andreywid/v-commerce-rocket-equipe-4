"""Testes do validador SQL determinístico usado antes da execução."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.security.exceptions import SQLValidationError
from app.security.sql_validator import validate_sql


class SQLValidatorTest(unittest.TestCase):
    """Garante que só SELECTs seguros e limitados avancem no fluxo."""

    def test_adds_default_limit_to_valid_select(self) -> None:
        sql = validate_sql("SELECT ano_mes FROM gold_vendas_kpis")

        self.assertIn("FROM gold_vendas_kpis", sql)
        self.assertIn("LIMIT 100", sql)

    def test_rejects_mutation_statement(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql("DELETE FROM gold_vendas_kpis")

    def test_rejects_unknown_table(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql("SELECT * FROM silver_pedidos")

    def test_allows_cte_name_without_treating_it_as_physical_table(self) -> None:
        sql = validate_sql(
            """
            WITH ReceitaComVariacao AS (
                SELECT
                    ano_mes,
                    SUM(receita_bruta) AS receita
                FROM gold_vendas_kpis
                GROUP BY ano_mes
            )
            SELECT ano_mes, receita
            FROM ReceitaComVariacao
            ORDER BY receita DESC
            LIMIT 1
            """
        )

        self.assertIn("WITH ReceitaComVariacao AS", sql)
        self.assertIn("FROM gold_vendas_kpis", sql)
        self.assertIn("FROM ReceitaComVariacao", sql)

    def test_rejects_cte_without_allowed_physical_table(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql(
                """
                WITH ReceitaComVariacao AS (
                    SELECT 1 AS receita
                )
                SELECT receita
                FROM ReceitaComVariacao
                """
            )

    def test_rejects_limit_above_policy(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql("SELECT ano_mes FROM gold_vendas_kpis LIMIT 1000")

    def test_rejects_multiple_statements(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql("SELECT ano_mes FROM gold_vendas_kpis; SELECT 1")

    def test_normalizes_double_quoted_date_literal(self) -> None:
        sql = validate_sql(
            'SELECT receita_bruta FROM gold_vendas_kpis WHERE ano_mes = "2024-10"'
        )

        self.assertIn("ano_mes = '2024-10'", sql)

    def test_does_not_normalize_arbitrary_double_quoted_identifier(self) -> None:
        sql = validate_sql(
            'SELECT receita_bruta FROM gold_vendas_kpis WHERE ano_mes = "outra_coluna"'
        )

        self.assertIn('"outra_coluna"', sql)

    def test_allows_case_when_conditions_in_select(self) -> None:
        sql = validate_sql(
            """
            SELECT
                CASE
                    WHEN t1.estado_cliente IN ('São Paulo', 'Rio de Janeiro') THEN 1
                    ELSE 0
                END AS regiao_prioritaria
            FROM gold_pedidos_enriquecidos AS t1
            """
        )

        self.assertIn("CASE WHEN", sql)
        self.assertIn("estado_cliente IN", sql)

    def test_allows_date_function_inside_boolean_predicate(self) -> None:
        sql = validate_sql(
            "SELECT * FROM gold_pedidos_enriquecidos WHERE status = 'Aprovado' AND data_pedido >= date('now', '-30 day')"
        )

        self.assertIn("DATE('now', '-30 day')", sql)
        self.assertIn("status = 'Aprovado'", sql)

    def test_allows_join_on_multiple_qualified_column_predicates(self) -> None:
        sql = validate_sql(
            """
            WITH receita_mensal AS (
              SELECT
                estado_cliente AS regiao,
                strftime('%Y-%m', data_pedido) AS mes,
                SUM(valor_total) AS receita
              FROM gold_pedidos_enriquecidos
              WHERE status = 'Aprovado'
              GROUP BY regiao, mes
            ),
            extremos AS (
              SELECT
                regiao,
                MIN(mes) AS primeiro_mes,
                MAX(mes) AS ultimo_mes
              FROM receita_mensal
              GROUP BY regiao
            )
            SELECT
              e.regiao,
              r_inicial.receita AS receita_inicial
            FROM extremos e
            JOIN receita_mensal r_inicial
              ON r_inicial.regiao = e.regiao
             AND r_inicial.mes = e.primeiro_mes
            LIMIT 1
            """
        )

        self.assertIn("JOIN receita_mensal AS r_inicial ON", sql)
        self.assertIn("r_inicial.regiao = e.regiao", sql)
        self.assertIn("r_inicial.mes = e.primeiro_mes", sql)


if __name__ == "__main__":
    unittest.main()
