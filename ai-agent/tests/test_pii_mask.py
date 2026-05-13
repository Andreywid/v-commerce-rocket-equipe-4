"""Testes do mascaramento de CPF na saída do executor."""

from pathlib import Path
import sqlite3
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.executor import QueryExecutor
from app.security.pii_mask import (
    MASKED_CPF_DISPLAY,
    is_cpf_column_name,
    mask_cpf_in_rows,
)


class PiiMaskTest(unittest.TestCase):
    """Colunas de CPF são mascaradas; demais campos permanecem."""

    def test_is_cpf_column_name(self) -> None:
        self.assertTrue(is_cpf_column_name("cpf"))
        self.assertTrue(is_cpf_column_name("id_cpf"))
        self.assertTrue(is_cpf_column_name("nr_cpf"))
        self.assertTrue(is_cpf_column_name("CPF"))
        self.assertTrue(is_cpf_column_name('"cli_cpf"'))
        self.assertFalse(is_cpf_column_name("nome"))
        self.assertFalse(is_cpf_column_name("email"))

    def test_mask_cpf_in_rows(self) -> None:
        rows = [
            {"nome": "Maria", "cpf": "12345678909", "email": "m@ex.com"},
            {"nome": "João", "cpf": None, "id_cpf": "00011122233"},
        ]
        out = mask_cpf_in_rows(rows)
        self.assertEqual(out[0]["nome"], "Maria")
        self.assertEqual(out[0]["email"], "m@ex.com")
        self.assertEqual(out[0]["cpf"], MASKED_CPF_DISPLAY)
        self.assertIsNone(out[1]["cpf"])
        self.assertEqual(out[1]["id_cpf"], MASKED_CPF_DISPLAY)


class QueryExecutorMaskingTest(unittest.IsolatedAsyncioTestCase):
    """Executor aplica mascaramento após leitura do SQLite."""

    async def test_masks_cpf_after_sqlite_execute(self) -> None:
        conn = sqlite3.connect(":memory:")
        try:
            conn.execute("CREATE TABLE cliente (nome TEXT, cpf TEXT)")
            conn.execute(
                "INSERT INTO cliente VALUES ('Ana', '52998224725')",
            )
            conn.commit()
            executor = QueryExecutor()
            rows = await executor.execute(conn, "SELECT nome, cpf FROM cliente")
        finally:
            conn.close()

        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["nome"], "Ana")
        self.assertEqual(rows[0]["cpf"], MASKED_CPF_DISPLAY)


if __name__ == "__main__":
    unittest.main()
