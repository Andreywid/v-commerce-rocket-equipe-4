"""Testes da camada HTTP e do mapeamento entre payloads e dependências."""

from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app.api.app import create_app
from app.api.dependencies import get_orchestrator
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
        api.dependency_overrides[get_orchestrator] = lambda: fake
        client = TestClient(api)

        response = client.post(
            "/ask",
            json={
                "question": "Qual foi a receita do mês?",
                "user_id": "user-1",
                "tenant_id": "tenant-1",
                "roles": ["analyst"],
                "allowed_tables": ["gold_vendas_kpis"],
                "allowed_columns": {
                    "gold_vendas_kpis": ["ano_mes", "receita_bruta"],
                },
                "require_tenant": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
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
        self.assertTrue(fake.deps.require_tenant)
        self.assertIsNone(fake.deps.conn)

    def test_ask_endpoint_rejects_execute_until_db_is_configured(self) -> None:
        api = create_app()
        client = TestClient(api)

        response = client.post(
            "/ask",
            json={
                "question": "Qual foi a receita do mês?",
                "execute": True,
            },
        )

        self.assertEqual(response.status_code, 501)
        self.assertIn("Database execution is not configured", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
