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


if __name__ == "__main__":
    unittest.main()
