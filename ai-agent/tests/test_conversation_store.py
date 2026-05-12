"""Testes do store in-memory de conversa."""

from pathlib import Path
import sys
import time
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.memory.conversation_store import InMemoryConversationStore
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


if __name__ == "__main__":
    unittest.main()
