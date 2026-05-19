#!/usr/bin/env python3
"""
Test runner para validar todas as perguntas contra o AI Agent.

Uso:
    cd ai-agent
    python test_suite/test_runner.py
    python test_suite/test_runner.py --category "KPIs de vendas"
    python test_suite/test_runner.py --limit 5
"""

import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

_TEST_SUITE_ROOT = Path(__file__).resolve().parent
_AI_AGENT_ROOT = _TEST_SUITE_ROOT.parent

if str(_AI_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_AGENT_ROOT))

from dotenv import load_dotenv

load_dotenv(_AI_AGENT_ROOT / ".env")

from app.agents.orchestrator import AgentOrchestrator
from app.cli.context import CliRunContext
from app.models.responses import InvalidRequest, OrchestratorResult, Success


class TestResult:
    def __init__(self, category: str, question: str):
        self.category = category
        self.question = question
        self.status = "pending"
        self.sql = None
        self.error_message = None
        self.execution_time = 0
        self.timestamp = datetime.now()

    def to_dict(self):
        return {
            "category": self.category,
            "question": self.question,
            "status": self.status,
            "sql": self.sql,
            "error": self.error_message,
            "time_ms": round(self.execution_time * 1000, 2),
            "timestamp": self.timestamp.isoformat(),
        }


class TestRunner:
    def __init__(self, debug: bool = False, limit: Optional[int] = None):
        self.debug = debug
        self.limit = limit
        self.results: list[TestResult] = []
        self.orchestrator = None

    async def setup(self):
        try:
            ctx = CliRunContext(
                conversation_id="test_session",
                user_id="test_user",
                tenant_id="test_tenant",
                roles=frozenset(["analyst"]),
                allowed_tables=None,
                allowed_columns=None,
                allow_all_schema_access=True,
                allow_sensitive_pii=False,
                require_tenant=False,
                debug_memory=self.debug,
            )

            self.orchestrator = AgentOrchestrator(ctx, debug=self.debug)
            print("OK - Orquestrador inicializado com sucesso")

        except Exception as e:
            print(f"ERRO - Falha ao inicializar orquestrador: {e}")
            sys.exit(1)

    async def test_question(self, category: str, question: str) -> TestResult:
        result = TestResult(category, question)

        try:
            start_time = datetime.now()
            response = await self.orchestrator.run(question)
            result.execution_time = (datetime.now() - start_time).total_seconds()

            if isinstance(response, OrchestratorResult):
                result.sql = response.sql

                if response.error:
                    result.error_message = response.error

                    if response.error_kind in {
                        "question_policy",
                        "sql_policy",
                        "invalid_request",
                    }:
                        result.status = "blocked"
                    else:
                        result.status = "error"
                else:
                    result.status = "success"

                return result

            if isinstance(response, Success):
                result.status = "success"
                result.sql = response.sql
                return result

            if isinstance(response, InvalidRequest):
                result.status = "blocked"
                result.error_message = getattr(
                    response,
                    "rejection_reason",
                    getattr(response, "error_message", str(response)),
                )
                return result

            result.status = "error"
            result.error_message = str(response)

        except Exception as e:
            result.status = "error"
            result.error_message = str(e)
            result.execution_time = (datetime.now() - start_time).total_seconds()

        return result

    async def run_tests(self, category_filter: Optional[str] = None):
        questions_file = _TEST_SUITE_ROOT / "test_questions.json"

        if not questions_file.exists():
            print(f"ERRO - Arquivo não encontrado: {questions_file}")
            sys.exit(1)

        with open(questions_file, encoding="utf-8") as f:
            all_questions = json.load(f)

        await self.setup()

        total_tests = 0
        tested_count = 0

        for category, questions in all_questions.items():
            if category_filter and category.lower() != category_filter.lower():
                continue

            print(f"\nCategoria: {category}")
            print("-" * 70)

            for question in questions:
                if self.limit and tested_count >= self.limit:
                    break

                total_tests += 1
                tested_count += 1

                print(
                    f"  [{tested_count:3d}] Testing: {question[:60]}...",
                    end=" ",
                    flush=True,
                )

                result = await self.test_question(category, question)
                self.results.append(result)

                if result.status == "success":
                    print(f"OK ({result.execution_time:.2f}s)")
                elif result.status == "blocked":
                    print("BLOQUEADO")
                else:
                    print("ERRO")

                if self.debug and result.error_message:
                    print(f"    -> {result.error_message[:200]}")

            if self.limit and tested_count >= self.limit:
                break

        self.print_summary()
        return self.results

    def print_summary(self):
        if not self.results:
            print("Nenhum teste foi executado.")
            return

        print("\n" + "=" * 70)
        print("RESUMO DOS TESTES")
        print("=" * 70)

        success_count = sum(1 for r in self.results if r.status == "success")
        error_count = sum(1 for r in self.results if r.status == "error")
        blocked_count = sum(1 for r in self.results if r.status == "blocked")
        total = len(self.results)

        print(f"\nTotal de testes: {total}")
        print(f"Sucesso:    {success_count} ({success_count / total * 100:.1f}%)")
        print(f"Erro:       {error_count} ({error_count / total * 100:.1f}%)")
        print(f"Bloqueado:  {blocked_count} ({blocked_count / total * 100:.1f}%)")

        by_category = {}
        for item in self.results:
            if item.category not in by_category:
                by_category[item.category] = {
                    "success": 0,
                    "error": 0,
                    "blocked": 0,
                }
            by_category[item.category][item.status] += 1

        print("\nPor categoria:")
        for category in sorted(by_category.keys()):
            stats = by_category[category]
            total_cat = sum(stats.values())
            print(
                f"  {category}: "
                f"{stats['success']}/{total_cat} sucesso, "
                f"{stats['blocked']} bloqueado(s), "
                f"{stats['error']} erro(s)"
            )

        errors = [r for r in self.results if r.status == "error"]
        if errors:
            print(f"\nErros encontrados ({len(errors)}):")
            for err in errors[:5]:
                print(f"  - {err.question[:70]}...")
                print(f"    -> {str(err.error_message)[:200]}")
            if len(errors) > 5:
                print(f"  ... e mais {len(errors) - 5} erro(s)")

        blocked = [r for r in self.results if r.status == "blocked"]
        if blocked:
            print(f"\nBloqueados ({len(blocked)}):")
            for blk in blocked[:5]:
                print(f"  - {blk.question[:70]}...")
                if blk.error_message:
                    print(f"    -> {str(blk.error_message)[:200]}")
            if len(blocked) > 5:
                print(f"  ... e mais {len(blocked) - 5} bloqueado(s)")

    def save_report(self, filename: str = "test_report.json"):
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.results),
            "summary": {
                "success": sum(1 for r in self.results if r.status == "success"),
                "error": sum(1 for r in self.results if r.status == "error"),
                "blocked": sum(1 for r in self.results if r.status == "blocked"),
            },
            "results": [r.to_dict() for r in self.results],
        }

        output_file = _TEST_SUITE_ROOT / filename
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)

        print(f"\nRelatório salvo em: {output_file}")
        return output_file


async def main():
    parser = argparse.ArgumentParser(
        description="Test runner para validar perguntas contra o AI Agent"
    )
    parser.add_argument(
        "--category",
        type=str,
        help="Filtra testes para uma categoria específica",
    )
    parser.add_argument(
        "--limit",
        type=int,
        help="Limita o número de testes a executar",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Ativa modo debug com mais detalhes",
    )
    parser.add_argument(
        "--save-report",
        type=str,
        default="test_report.json",
        help="Salva o relatório em um arquivo JSON",
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Não salva o relatório",
    )

    args = parser.parse_args()

    runner = TestRunner(debug=args.debug, limit=args.limit)
    await runner.run_tests(category_filter=args.category)

    if not args.no_save:
        runner.save_report(args.save_report)


if __name__ == "__main__":
    asyncio.run(main())