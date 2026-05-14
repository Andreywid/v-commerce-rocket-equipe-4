"""Testes leves do cliente Text-to-SQL sem instanciar o provedor LLM."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.agents.sql_generator import AgentTextToSQLClient


class AgentTextToSQLClientTest(unittest.TestCase):
    def test_select_examples_returns_prompt_examples(self) -> None:
        examples = AgentTextToSQLClient._select_examples()

        self.assertGreater(len(examples), 0)
        self.assertLessEqual(len(examples), 2)

    def test_select_examples_prioritizes_region_revenue_growth(self) -> None:
        examples_text = "\n".join(AgentTextToSQLClient._select_examples())

        self.assertIn("maior crescimento de receita", examples_text)
        self.assertIn("gold_pedidos_enriquecidos", examples_text)
        self.assertIn("estado_cliente IN", examples_text)

    def test_select_examples_for_sqlite_avoid_postgres_only_syntax(self) -> None:
        examples_text = "\n".join(AgentTextToSQLClient._select_examples("sqlite"))

        self.assertNotIn("DATE_TRUNC", examples_text.upper())
        self.assertNotIn("INTERVAL", examples_text.upper())
        self.assertNotIn("ILIKE", examples_text.upper())
        self.assertNotIn("::", examples_text)


if __name__ == "__main__":
    unittest.main()
