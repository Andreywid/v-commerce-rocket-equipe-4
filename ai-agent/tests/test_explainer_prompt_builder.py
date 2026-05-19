"""Testes do prompt usado pelo explainer de resultados SQL."""

from pathlib import Path
import json
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.models.responses import Success
from app.prompts.explainer_prompt_builder import ExplainerPromptBuilder


class ExplainerPromptBuilderTest(unittest.TestCase):
    def test_build_prompt_includes_query_summary_for_data_citation(self) -> None:
        builder = ExplainerPromptBuilder()
        sql_result = Success(
            interpretation="Receita por mês",
            reasoning=[],
            sql=(
                "SELECT ano_mes, SUM(receita_bruta) AS receita_total "
                "FROM gold_vendas_kpis "
                "GROUP BY ano_mes "
                "ORDER BY receita_total DESC "
                "LIMIT 100"
            ),
            assumptions=[],
        )

        prompt = builder.build_prompt(
            question="Qual foi a receita por mês?",
            sql_result=sql_result,
            rows=[{"ano_mes": "2026-04", "receita_total": 1000}],
            execution_skipped=False,
        )

        json_text = prompt.split("# CONTEXTO (JSON)\n\n", 1)[1].split("\n\n# TAREFA", 1)[0]
        payload = json.loads(json_text)

        self.assertEqual(payload["dados_consultados"]["tabelas"], ["gold_vendas_kpis"])
        self.assertIn("ano_mes", payload["dados_consultados"]["campos_ou_metricas"])
        self.assertIn("receita_total", payload["dados_consultados"]["campos_ou_metricas"])
        self.assertIn('começando com "Dados consultados:"', prompt)


if __name__ == "__main__":
    unittest.main()
