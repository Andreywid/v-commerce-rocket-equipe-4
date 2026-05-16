"""Testes do builder de prompt Text-to-SQL."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.prompts.sql_prompt_builder import build_prompt


class SqlPromptBuilderTest(unittest.TestCase):
    def test_sqlite_dialect_mentions_sqlite_and_forbids_interval(self) -> None:
        text = build_prompt(
            question="teste",
            schema="CREATE TABLE t (x TEXT);",
            examples=[],
            values=[],
            current_date=datetime(2026, 5, 12),
            dialect="sqlite",
        )

        self.assertIn("TARGET DATABASE ENGINE", text)
        self.assertIn("SQLite 3", text)
        self.assertIn("Não use INTERVAL", text)

    def test_postgresql_dialect_mentions_postgresql(self) -> None:
        text = build_prompt(
            question="teste",
            schema="CREATE TABLE t (x TEXT);",
            examples=[],
            values=[],
            current_date=datetime(2026, 5, 12),
            dialect="postgresql",
        )

        self.assertIn("TARGET DATABASE ENGINE", text)
        self.assertIn("PostgreSQL", text)


if __name__ == "__main__":
    unittest.main()
