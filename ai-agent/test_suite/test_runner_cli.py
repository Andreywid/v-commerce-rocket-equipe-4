#!/usr/bin/env python3
"""
Test runner alternativo usando a CLI existente (mais robusto).

Uso:
    python test_runner_cli.py                    # Testa tudo
    python test_runner_cli.py --quick            # Testa 1 pergunta por categoria
    python test_runner_cli.py --category "KPIs de vendas"  # Filtra categoria
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import time


class TestResult:
    def __init__(self, category: str, question: str):
        self.category = category
        self.question = question
        self.status = "pending"  # pending, success, error, timeout, blocked
        self.sql = None
        self.error_message = None
        self.execution_time = 0
        self.timestamp = datetime.now()
        self.explainer_output = None
        self.full_stdout = None

    def to_dict(self):
        return {
            "category": self.category,
            "question": self.question,
            "status": self.status,
            "sql": self.sql,
            "explainer_output": self.explainer_output,
            "error": self.error_message,
            "time_s": round(self.execution_time, 2),
            "timestamp": self.timestamp.isoformat(),
        }


class CliTestRunner:
    def __init__(self, debug: bool = False, quick: bool = False, timeout: int = 50):
        self.debug = debug
        self.quick = quick
        self.timeout = timeout
        self.results: list[TestResult] = []
        self.test_suite_root = Path(__file__).resolve().parent
        self.ai_agent_root = self.test_suite_root.parent

    def test_question(self, category: str, question: str) -> TestResult:
        """Testa uma pergunta usando a CLI."""
        result = TestResult(category, question)
        
        start_time = time.time()
        try:
            # Monta comando: python -m app.main --question "..."
            cmd = [
                sys.executable,
                "-m",
                "app.main",
                "--question",
                question,
                "--skip-mock",  # Não recria o mock a cada pergunta (economiza tempo)
            ]

            if self.debug:
                cmd.append("--debug-memory")

            # Executa com timeout
            result_proc = subprocess.run(
                cmd,
                cwd=self.ai_agent_root,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )

            execution_time = time.time() - start_time
            result.execution_time = execution_time

            # Analisa output para detectar sucesso/erro/bloqueio
            stdout = result_proc.stdout
            stderr = result_proc.stderr
            
            # Guarda saída completa para análise
            result.full_stdout = stdout

            # Heurísticas para determinar status
            if result_proc.returncode == 0:
                if "SELECT" in stdout or "SQL" in stdout:
                    result.status = "success"
                    # Tenta extrair SQL
                    for line in stdout.split("\n"):
                        if line.strip().startswith("SELECT"):
                            result.sql = line.strip()
                            break
                    # Captura TUDO o que vem depois do SQL (resposta do explainer)
                    result.explainer_output = stdout
                elif "rejected" in stdout.lower() or "blocked" in stdout.lower():
                    result.status = "blocked"
                    result.error_message = "Pergunta foi rejeitada por validação de segurança"
                    result.explainer_output = stdout
                else:
                    result.status = "success"
                    result.explainer_output = stdout
            else:
                result.status = "error"
                result.error_message = stderr[:200] if stderr else "Exit code: " + str(result_proc.returncode)
                result.explainer_output = stdout if stdout else stderr

        except subprocess.TimeoutExpired:
            result.status = "timeout"
            result.error_message = f"Timeout após {self.timeout}s"
            result.execution_time = self.timeout

        except Exception as e:
            result.status = "error"
            result.error_message = str(e)
            result.execution_time = time.time() - start_time

        return result

    def run_tests(self, category_filter: Optional[str] = None, max_workers: int = 1):
        """Executa todos os testes."""
        questions_file = self.test_suite_root / "test_questions.json"
        
        if not questions_file.exists():
            print(f"✗ Arquivo não encontrado: {questions_file}")
            sys.exit(1)

        with open(questions_file) as f:
            all_questions = json.load(f)

        # Prepara lista de testes
        test_queue = []
        for category, questions in all_questions.items():
            if category_filter and category.lower() != category_filter.lower():
                continue

            questions_to_test = questions if not self.quick else questions[:1]
            
            for question in questions_to_test:
                test_queue.append((category, question))

        total_tests = len(test_queue)
        tested_count = 0

        print(f"🚀 Iniciando {total_tests} testes...")
        print("─" * 70)

        # Executa testes (sequencial para não sobrecarregar o agente)
        for category, question in test_queue:
            tested_count += 1
            print(f"[{tested_count:3d}/{total_tests}] Testing: {question[:55]}...", end=" ", flush=True)
            
            result = self.test_question(category, question)
            self.results.append(result)

            # Status compacto
            if result.status == "success":
                print(f"✓ ({result.execution_time:.1f}s)")
            elif result.status == "blocked":
                print(f"🔒 (Bloqueado)")
            elif result.status == "timeout":
                print(f"⏱️  (Timeout)")
            else:
                print(f"✗ (Erro)")

            if self.debug and result.error_message:
                print(f"    └─ {result.error_message[:100]}")

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
        timeout_count = sum(1 for r in self.results if r.status == "timeout")
        total = len(self.results)

        print(f"\nTotal de testes: {total}")
        print(f"✓ Sucesso:      {success_count} ({success_count/total*100:.1f}%)")
        print(f"✗ Erro:         {error_count} ({error_count/total*100:.1f}%)")
        print(f"🔒 Bloqueado:   {blocked_count} ({blocked_count/total*100:.1f}%)")
        if timeout_count > 0:
            print(f"⏱️  Timeout:     {timeout_count} ({timeout_count/total*100:.1f}%)")

        # Tempo total
        total_time = sum(r.execution_time for r in self.results)
        avg_time = total_time / total if total > 0 else 0
        print(f"\n⏱️  Tempo total: {total_time:.1f}s | Média: {avg_time:.1f}s/pergunta")

        # Agrupa por categoria
        by_category = {}
        for result in self.results:
            if result.category not in by_category:
                by_category[result.category] = {"success": 0, "error": 0, "blocked": 0, "timeout": 0}
            by_category[result.category][result.status] += 1

        print("\n📈 Por Categoria:")
        for category in sorted(by_category.keys()):
            stats = by_category[category]
            total_cat = sum(stats.values())
            success_pct = stats['success'] / total_cat * 100 if total_cat > 0 else 0
            print(f"  {category}: {stats['success']}/{total_cat} ✓ ({success_pct:.0f}%)")

        # Erros encontrados
        errors = [r for r in self.results if r.status == "error"]
        if errors:
            print(f"\n⚠️  Erros encontrados ({len(errors)}):")
            for err in errors[:5]:
                print(f"  • {err.question[:50]}...")
                if err.error_message:
                    print(f"    → {err.error_message[:70]}")

        # Bloqueados
        blocked = [r for r in self.results if r.status == "blocked"]
        if blocked:
            print(f"\n🔒 Bloqueados por segurança ({len(blocked)}):")
            for blk in blocked[:3]:
                print(f"  • {blk.question[:60]}...")

    def save_report(self, filename: str = "test_report.json"):
        """Salva relatório em JSON."""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.results),
            "summary": {
                "success": sum(1 for r in self.results if r.status == "success"),
                "error": sum(1 for r in self.results if r.status == "error"),
                "blocked": sum(1 for r in self.results if r.status == "blocked"),
                "timeout": sum(1 for r in self.results if r.status == "timeout"),
            },
            "results": [r.to_dict() for r in self.results],
        }
        
        output_file = self.ai_agent_root / filename
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Relatório salvo em: {output_file}")
        return output_file


def main():
    parser = argparse.ArgumentParser(
        description="Test runner CLI para validar perguntas contra o AI Agent"
    )
    parser.add_argument(
        "--category",
        type=str,
        help="Filtra testes para uma categoria específica",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Testa apenas 1 pergunta por categoria (rápido)",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Ativa modo debug com mais detalhes",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=30,
        help="Timeout em segundos por pergunta (padrão: 30)",
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

    runner = CliTestRunner(debug=args.debug, quick=args.quick, timeout=args.timeout)
    runner.run_tests(category_filter=args.category)

    if not args.no_save:
        runner.save_report(args.save_report)


if __name__ == "__main__":
    main()
