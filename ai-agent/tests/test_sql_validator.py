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

    def test_rejects_limit_above_policy(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql("SELECT ano_mes FROM gold_vendas_kpis LIMIT 1000")

    def test_rejects_multiple_statements(self) -> None:
        with self.assertRaises(SQLValidationError):
            validate_sql("SELECT ano_mes FROM gold_vendas_kpis; SELECT 1")


if __name__ == "__main__":
    unittest.main()
