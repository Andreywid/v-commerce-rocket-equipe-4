"""Testes da camada HTTP e do mapeamento entre payloads e dependências."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.api.app import create_app
from app.api.dependencies import get_conversation_store, get_orchestrator
from app.memory.conversation_store import InMemoryConversationStore
from app.models.deps import Deps
from app.models.responses import OrchestratorResult


class FakeOrchestrator:
    """Dublê do orquestrador para isolar os testes da API do LLM."""

    def __init__(self) -> None:
        self.question: str | None = None
        self.deps: Deps | None = None

    async def ask(self, question: str, deps: Deps) -> OrchestratorResult:
        self.question = question
        self.deps = deps
        return OrchestratorResult(
            explanation="resposta de teste",
            sql="SELECT ano_mes FROM gold_vendas_kpis LIMIT 100",
            rows=[],
            interpretation="interpretação",
            reasoning=["passo"],
            assumptions=[],
        )


class APITest(unittest.TestCase):
    """Cobre healthcheck, contrato do /ask e bloqueio de execução via API."""

    def test_health_endpoint(self) -> None:
        api = create_app()
        client = TestClient(api)

        response = client.get("/health")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_ask_endpoint_maps_request_to_deps(self) -> None:
        api = create_app()
        fake = FakeOrchestrator()
        store = InMemoryConversationStore()
        api.dependency_overrides[get_orchestrator] = lambda: fake
        api.dependency_overrides[get_conversation_store] = lambda: store
        client = TestClient(api)

        response = client.post(
            "/ask",
            json={
                "question": "Qual foi a receita do mês?",
                "conversation_id": "conv-1",
                "user_id": "user-1",
                "tenant_id": "tenant-1",
                "roles": ["analyst"],
                "allowed_tables": ["gold_vendas_kpis"],
                "allowed_columns": {
                    "gold_vendas_kpis": ["ano_mes", "receita_bruta"],
                },
                "allow_all_schema_access": True,
                "require_tenant": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["conversation_id"], "conv-1")
        self.assertEqual(payload["explanation"], "resposta de teste")
        self.assertEqual(payload["sql"], "SELECT ano_mes FROM gold_vendas_kpis LIMIT 100")
        self.assertEqual(fake.question, "Qual foi a receita do mês?")
        self.assertIsNotNone(fake.deps)
        self.assertEqual(fake.deps.user_id, "user-1")
        self.assertEqual(fake.deps.tenant_id, "tenant-1")
        self.assertEqual(fake.deps.roles, frozenset({"analyst"}))
        self.assertEqual(fake.deps.allowed_tables, frozenset({"gold_vendas_kpis"}))
        self.assertEqual(
            fake.deps.allowed_columns,
            {"gold_vendas_kpis": frozenset({"ano_mes", "receita_bruta"})},
        )
        self.assertTrue(fake.deps.allow_all_schema_access)
        self.assertTrue(fake.deps.require_tenant)
        self.assertIsNone(fake.deps.conn)
        self.assertEqual(fake.deps.conversation_id, "conv-1")

        turns = store.list_turns(
            conversation_id="conv-1",
            tenant_id="tenant-1",
            user_id="user-1",
        )
        self.assertEqual(len(turns), 1)
        self.assertEqual(turns[0].question, "Qual foi a receita do mês?")
        self.assertEqual(turns[0].sql, "SELECT ano_mes FROM gold_vendas_kpis LIMIT 100")

    def test_ask_endpoint_generates_conversation_id_when_missing(self) -> None:
        api = create_app()
        fake = FakeOrchestrator()
        store = InMemoryConversationStore()
        api.dependency_overrides[get_orchestrator] = lambda: fake
        api.dependency_overrides[get_conversation_store] = lambda: store
        client = TestClient(api)

        response = client.post(
            "/ask",
            json={
                "question": "Qual foi a receita do mês?",
                "user_id": "user-1",
                "tenant_id": "tenant-1",
            },
        )

        self.assertEqual(response.status_code, 200)
        conversation_id = response.json()["conversation_id"]
        self.assertIsInstance(conversation_id, str)
        self.assertTrue(conversation_id)
        self.assertEqual(fake.deps.conversation_id, conversation_id)

    def test_ask_endpoint_injects_previous_turns_for_same_conversation(self) -> None:
        api = create_app()
        fake = FakeOrchestrator()
        store = InMemoryConversationStore()
        api.dependency_overrides[get_orchestrator] = lambda: fake
        api.dependency_overrides[get_conversation_store] = lambda: store
        client = TestClient(api)

        first = client.post(
            "/ask",
            json={
                "conversation_id": "conv-1",
                "question": "Qual foi a receita em 2024-11?",
                "user_id": "user-1",
                "tenant_id": "tenant-1",
            },
        )
        self.assertEqual(first.status_code, 200)

        second = client.post(
            "/ask",
            json={
                "conversation_id": "conv-1",
                "question": "E em 2024-10?",
                "user_id": "user-1",
                "tenant_id": "tenant-1",
            },
        )

        self.assertEqual(second.status_code, 200)
        self.assertIn("CONTEXTO CONVERSACIONAL SEGURO", fake.question or "")
        self.assertIn("Qual foi a receita em 2024-11?", fake.question or "")
        self.assertIn("E em 2024-10?", fake.question or "")

    def test_ask_endpoint_passes_mock_connection_when_execute_is_true(self) -> None:
        api = create_app()
        fake = FakeOrchestrator()
        api.dependency_overrides[get_orchestrator] = lambda: fake
        client = TestClient(api)

        response = client.post(
            "/ask",
            json={
                "question": "Qual foi a receita do mês?",
                "execute": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertIsNotNone(fake.deps)
        self.assertIsNotNone(fake.deps.conn)


if __name__ == "__main__":
    unittest.main()
