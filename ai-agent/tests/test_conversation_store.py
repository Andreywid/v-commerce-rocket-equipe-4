"""Testes do store in-memory de conversa."""

from pathlib import Path
import sys
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.memory.conversation_store import (
    InMemoryConversationStore,
    build_question_with_memory,
)
from app.models.responses import OrchestratorResult


def _result(sql: str | None = "SELECT 1") -> OrchestratorResult:
    return OrchestratorResult(
        explanation="não deve ser persistida no store",
        sql=sql,
        interpretation="interpretação segura",
        reasoning=["passo"],
        assumptions=["premissa"],
    )


class InMemoryConversationStoreTest(unittest.TestCase):
    def test_appends_and_lists_turns_by_isolated_key(self) -> None:
        store = InMemoryConversationStore()

        store.append_result(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
            question="pergunta 1",
            result=_result(),
        )
        store.append_result(
            conversation_id="conv-1",
            tenant_id="tenant-2",
            user_id="user-1",
            question="pergunta 2",
            result=_result(),
        )

        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )

        self.assertEqual(len(turns), 1)
        self.assertEqual(turns[0].question, "pergunta 1")
        self.assertEqual(turns[0].sql, "SELECT 1")

    def test_keeps_only_max_turns_per_conversation(self) -> None:
        store = InMemoryConversationStore(max_turns_per_conversation=2)

        for index in range(3):
            store.append_result(
                conversation_id="conv-1",
                tenant_id="tenant-1",
                user_id="user-1",
                question=f"pergunta {index}",
                result=_result(),
            )

        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )

        self.assertEqual([turn.question for turn in turns], ["pergunta 1", "pergunta 2"])

    def test_prunes_expired_conversation(self) -> None:
        store = InMemoryConversationStore(ttl_seconds=0)
        store.append_result(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
            question="pergunta",
            result=_result(),
        )

        time.sleep(0.001)
        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )

        self.assertEqual(turns, [])

    def test_build_question_with_memory_includes_safe_previous_context(self) -> None:
        store = InMemoryConversationStore()
        store.append_result(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
            question="Qual foi a receita em 2024-11?",
            result=_result(
                "SELECT receita_bruta FROM gold_vendas_kpis WHERE ano_mes = '2024-11' LIMIT 100"
            ),
        )
        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )

        prompt = build_question_with_memory("E em 2024-10?", turns)

        self.assertIn("CONTEXTO CONVERSACIONAL SEGURO", prompt)
        self.assertIn("Qual foi a receita em 2024-11?", prompt)
        self.assertIn("2024-11", prompt)
        self.assertIn("PERGUNTA ATUAL", prompt)
        self.assertIn("E em 2024-10?", prompt)
        self.assertNotIn("RESOLUÇÃO OBRIGATÓRIA (PIPELINE)", prompt)

    def test_build_question_with_memory_preserves_aggregate_semantics(self) -> None:
        store = InMemoryConversationStore()
        store.append_result(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
            question="Qual a quantidade de vendas e valor total por ano?",
            result=OrchestratorResult(
                explanation="resposta",
                sql=(
                    "SELECT ano, SUM(qtd_pedidos_aprovados) AS quantidade_vendas, "
                    "SUM(receita_bruta) AS valor_total "
                    "FROM gold_vendas_kpis GROUP BY ano ORDER BY ano LIMIT 100"
                ),
                interpretation=(
                    "Quantidade de vendas e valor total agregados por ano."
                ),
                reasoning=[
                    "valor_total significa SUM(receita_bruta) agrupado por ano",
                ],
                assumptions=[
                    "vendas significa qtd_pedidos_aprovados",
                ],
            ),
        )
        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )

        prompt = build_question_with_memory(
            "qual o ano de maior venda no valor total",
            turns,
        )

        self.assertIn("REGRAS PARA FOLLOW-UP ANALÍTICO", prompt)
        self.assertIn("preserve a mesma definição de métrica", prompt)
        self.assertIn("Não ordene linhas brutas", prompt)
        self.assertIn("SUM(receita_bruta) AS valor_total", prompt)
        self.assertIn("GROUP BY ano", prompt)
        self.assertIn("valor_total significa SUM(receita_bruta)", prompt)

    def test_build_question_with_memory_includes_demonstrative_rules(self) -> None:
        store = InMemoryConversationStore()
        store.append_result(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
            question="Quantos clientes estão em risco?",
            result=_result(
                "SELECT COUNT(id_cliente) FROM gold_cliente_360 "
                "WHERE is_em_risco = 1 LIMIT 100"
            ),
        )
        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )

        prompt = build_question_with_memory("Quem são esses clientes?", turns)

        self.assertIn("REFERÊNCIAS PRONOMINAIS E DEMONSTRATIVOS", prompt)
        self.assertIn("esses clientes", prompt)
        self.assertIn("COUNT", prompt)
        self.assertIn("is_em_risco", prompt)


if __name__ == "__main__":
    unittest.main()
