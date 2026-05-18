#!/usr/bin/env python3
"""
Test runner para validar todas as perguntas contra o AI Agent.

Uso:
    cd ai-agent
    python test_runner.py                  # Testa tudo
    python test_runner.py --category "KPIs de vendas"  # Testa uma categoria
    python test_runner.py --limit 5        # Testa primeiras 5 perguntas
"""

import asyncio
import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import argparse

# Adiciona ai-agent ao path
_TEST_SUITE_ROOT = Path(__file__).resolve().parent
_AI_AGENT_ROOT = _TEST_SUITE_ROOT.parent
if str(_AI_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_AGENT_ROOT))

from dotenv import load_dotenv
load_dotenv(_AI_AGENT_ROOT / ".env")

from app.agents.orchestrator import AgentOrchestrator
from app.cli.context import CliRunContext
from app.models.responses import InvalidRequest, Success


class TestResult:
    def __init__(self, category: str, question: str):
        self.category = category
        self.question = question
        self.status = "pending"  # pending, success, error, blocked
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
        """Inicializa o orquestrador."""
        try:
            # Contexto padrão sem restrições
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
                debug_memory=debug,
            )
            self.orchestrator = AgentOrchestrator(ctx)
            print("✓ Orquestrador inicializado com sucesso")
        except Exception as e:
            print(f"✗ Erro ao inicializar orquestrador: {e}")
            sys.exit(1)

    async def test_question(self, category: str, question: str) -> TestResult:
        """Testa uma pergunta individual."""
        result = TestResult(category, question)
        
        try:
            start_time = datetime.now()
            
            # Chama o orquestrador
            response = await self.orchestrator.run(question)
            
            result.execution_time = (datetime.now() - start_time).total_seconds()
            
            if isinstance(response, Success):
                result.status = "success"
                result.sql = response.sql
            elif isinstance(response, InvalidRequest):
                result.status = "blocked"
                result.error_message = response.rejection_reason
            else:
                result.status = "error"
                result.error_message = str(response)
                
        except Exception as e:
            result.status = "error"
            result.error_message = str(e)
            result.execution_time = (datetime.now() - start_time).total_seconds()

        return result

    async def run_tests(self, category_filter: Optional[str] = None):
        """Executa todos os testes."""
        questions_file = _TEST_SUITE_ROOT / "test_questions.json"
        
        if not questions_file.exists():
            print(f"✗ Arquivo não encontrado: {questions_file}")
            sys.exit(1)

        with open(questions_file) as f:
            all_questions = json.load(f)

        await self.setup()

        total_tests = 0
        tested_count = 0

        for category, questions in all_questions.items():
            if category_filter and category.lower() != category_filter.lower():
                continue

            print(f"\n📋 {category}")
            print("─" * 70)

            for question in questions:
                if self.limit and tested_count >= self.limit:
                    break

                total_tests += 1
                tested_count += 1
                
                print(f"  [{tested_count:3d}] Testing: {question[:60]}...", end=" ", flush=True)
                
                result = await self.test_question(category, question)
                self.results.append(result)

                # Mostra status compacto
                if result.status == "success":
                    print(f"✓ ({result.execution_time:.2f}s)")
                elif result.status == "blocked":
                    print(f"🚫 (Bloqueado)")
                else:
                    print(f"✗ (Erro)")

                if self.debug and result.error_message:
                    print(f"    └─ {result.error_message[:100]}")

            if self.limit and tested_count >= self.limit:
                break

        self.print_summary()
        return self.results

    def print_summary(self):
        """Imprime resumo dos testes."""
        if not self.results:
            print("Nenhum teste foi executado.")
            return

        print("\n" + "=" * 70)
        print("📊 RESUMO DOS TESTES")
        print("=" * 70)

        success_count = sum(1 for r in self.results if r.status == "success")
        error_count = sum(1 for r in self.results if r.status == "error")
        blocked_count = sum(1 for r in self.results if r.status == "blocked")
        total = len(self.results)

        print(f"\nTotal de testes: {total}")
        print(f"✓ Sucesso:      {success_count} ({success_count/total*100:.1f}%)")
        print(f"✗ Erro:         {error_count} ({error_count/total*100:.1f}%)")
        print(f"🚫 Bloqueado:   {blocked_count} ({blocked_count/total*100:.1f}%)")

        # Agrupa por categoria
        by_category = {}
        for result in self.results:
            if result.category not in by_category:
                by_category[result.category] = {"success": 0, "error": 0, "blocked": 0}
            by_category[result.category][result.status] += 1

        print("\n📈 Por Categoria:")
        for category in sorted(by_category.keys()):
            stats = by_category[category]
            total_cat = sum(stats.values())
            print(f"  {category}: {stats['success']}/{total_cat} ✓")

        # Erros encontrados
        errors = [r for r in self.results if r.status == "error"]
        if errors:
            print(f"\n⚠️  Erros encontrados ({len(errors)}):")
            for err in errors[:5]:  # Mostra primeiros 5
                print(f"  • {err.question[:50]}...")
                print(f"    → {err.error_message[:80]}")
            if len(errors) > 5:
                print(f"  ... e mais {len(errors) - 5} erros")

        # Bloqueados (validação de segurança)
        blocked = [r for r in self.results if r.status == "blocked"]
        if blocked:
            print(f"\n🔒 Bloqueados por segurança ({len(blocked)}):")
            for blk in blocked[:5]:
                print(f"  • {blk.question[:50]}...")
            if len(blocked) > 5:
                print(f"  ... e mais {len(blocked) - 5}")

    def save_report(self, filename: str = "test_report.json"):
        """Salva relatório em JSON."""
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
        
        print(f"\n💾 Relatório salvo em: {output_file}")
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
