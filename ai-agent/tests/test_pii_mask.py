"""Testes do mascaramento de dados pessoais na saída do executor."""

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
    """Campos sensíveis são mascarados; campos não sensíveis permanecem."""

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
            {
                "nome": "Maria Lopes",
                "cpf": "12345678909",
                "email": "m@ex.com",
                "telefone": "81987654321",
                "cidade": "Recife",
                "estado": "PE",
                "nome_produto": "Fone Bluetooth",
            },
            {
                "nome": "João Neves",
                "cpf": None,
                "id_cpf": "00011122233",
                "email": "joaoneves@gmail.com",
                "telefone": "11912345678",
                "cidade": "São Paulo",
                "estado": "SP",
                "nome_produto": "Mouse Gamer",
            },
        ]

        out = mask_cpf_in_rows(rows)

        self.assertEqual(out[0]["nome"], "Maria L.")
        self.assertEqual(out[0]["cpf"], MASKED_CPF_DISPLAY)
        self.assertEqual(out[0]["email"], "m***@e***x.com")
        self.assertEqual(out[0]["telefone"], "(**)*******21")
        self.assertEqual(out[0]["cidade"], "Recife")
        self.assertEqual(out[0]["estado"], "PE")
        self.assertEqual(out[0]["nome_produto"], "Fone Bluetooth")

        self.assertEqual(out[1]["nome"], "João N.")
        self.assertIsNone(out[1]["cpf"])
        self.assertEqual(out[1]["id_cpf"], MASKED_CPF_DISPLAY)
        self.assertEqual(out[1]["email"], "j***s@g***l.com")
        self.assertEqual(out[1]["telefone"], "(**)*******78")
        self.assertEqual(out[1]["cidade"], "São Paulo")
        self.assertEqual(out[1]["estado"], "SP")
        self.assertEqual(out[1]["nome_produto"], "Mouse Gamer")


class QueryExecutorMaskingTest(unittest.IsolatedAsyncioTestCase):
    """Executor aplica mascaramento após leitura do SQLite."""

    async def test_masks_sensitive_fields_after_sqlite_execute(self) -> None:
        conn = sqlite3.connect(":memory:")

        try:
            conn.execute(
                """
                CREATE TABLE cliente (
                    nome TEXT,
                    cpf TEXT,
                    email TEXT,
                    telefone TEXT,
                    cidade TEXT,
                    estado TEXT
                )
                """
            )

            conn.execute(
                """
                INSERT INTO cliente VALUES (
                    'Ana Souza',
                    '52998224725',
                    'anasouza@gmail.com',
                    '81987654321',
                    'Recife',
                    'PE'
                )
                """
            )

            conn.commit()

            executor = QueryExecutor()

            rows = await executor.execute(
                conn,
                "SELECT nome, cpf, email, telefone, cidade, estado FROM cliente",
            )

        finally:
            conn.close()

        self.assertEqual(len(rows), 1)

        self.assertEqual(rows[0]["nome"], "Ana S.")
        self.assertEqual(rows[0]["cpf"], MASKED_CPF_DISPLAY)
        self.assertEqual(rows[0]["email"], "a***a@g***l.com")
        self.assertEqual(rows[0]["telefone"], "(**)*******21")
        self.assertEqual(rows[0]["cidade"], "Recife")
        self.assertEqual(rows[0]["estado"], "PE")


if __name__ == "__main__":
    unittest.main()