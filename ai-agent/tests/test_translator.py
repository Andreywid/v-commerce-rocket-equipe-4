"""Testes da tradução segura de SQL PostgreSQL para SQLite local."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.translator import SQLTranslationError, translate_to_sqlite


class SQLTranslatorTest(unittest.TestCase):
    def test_translates_valid_select_to_sqlite(self) -> None:
        sql = translate_to_sqlite(
            "SELECT ano_mes FROM gold_vendas_kpis LIMIT 100"
        )

        self.assertEqual(
            sql,
            "SELECT ano_mes FROM gold_vendas_kpis LIMIT 100",
        )

    def test_rejects_non_select_instead_of_returning_original_sql(self) -> None:
        with self.assertRaises(SQLTranslationError):
            translate_to_sqlite("DELETE FROM gold_vendas_kpis")

    def test_rejects_unparseable_sql_instead_of_returning_original_sql(self) -> None:
        with self.assertRaises(SQLTranslationError):
            translate_to_sqlite("SELECT FROM")


if __name__ == "__main__":
    unittest.main()
