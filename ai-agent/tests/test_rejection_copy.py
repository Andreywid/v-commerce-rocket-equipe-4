"""Testes dos textos amigáveis de rejeição."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.messages.rejection_copy import (
    format_invalid_request,
    format_question_policy,
)


class RejectionCopyTest(unittest.TestCase):
    def test_question_policy_out_of_scope_explains_supported_topics(self) -> None:
        text = format_question_policy(
            "Assunto fora do escopo dos dados disponíveis: clima e previsão do tempo."
        )

        self.assertIn("Não consigo responder", text)
        self.assertIn("Posso responder perguntas analíticas sobre", text)
        self.assertIn("vendas, receita, pedidos", text)
        self.assertIn("Exemplos que funcionam", text)

    def test_invalid_request_gives_actionable_examples(self) -> None:
        text = format_invalid_request("Pergunta ambígua para o schema disponível.")

        self.assertIn("Não consegui transformar", text)
        self.assertIn("Motivo informado pelo agente", text)
        self.assertIn("Quais regiões tiveram maior crescimento de receita?", text)


if __name__ == "__main__":
    unittest.main()
