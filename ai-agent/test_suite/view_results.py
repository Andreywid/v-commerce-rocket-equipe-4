#!/usr/bin/env python3
"""
Visualizador de resultados de testes - mostra SQL e saída do explainer

Uso:
    python view_results.py              # Ver tudo
    python view_results.py --success    # Só sucessos
    python view_results.py --error      # Só erros
    python view_results.py --question "Qual foi..."  # Buscar pergunta
"""

import json
import sys
from pathlib import Path
import argparse

def view_results():
    parser = argparse.ArgumentParser(description="Visualizador de resultados de testes")
    parser.add_argument(
        "--success",
        action="store_true",
        help="Mostra apenas testes com sucesso"
    )
    parser.add_argument(
        "--error",
        action="store_true",
        help="Mostra apenas testes com erro"
    )
    parser.add_argument(
        "--blocked",
        action="store_true",
        help="Mostra apenas testes bloqueados"
    )
    parser.add_argument(
        "--question",
        type=str,
        help="Busca por pergunta (parcial)"
    )
    parser.add_argument(
        "--category",
        type=str,
        help="Filtra por categoria"
    )
    parser.add_argument(
        "--file",
        type=str,
        default="test_report.json",
        help="Arquivo de relatório (padrão: test_report.json)"
    )
    
    args = parser.parse_args()
    
    report_file = Path(args.file)
    if not report_file.exists():
        print(f"❌ Arquivo não encontrado: {report_file}")
        return 1
    
    with open(report_file) as f:
        data = json.load(f)
    
    print(f"📊 Relatório: {args.file}")
    print(f"⏰ {data['timestamp']}")
    print(f"📈 Total: {data['total_tests']} testes\n")
    
    # Filtra resultados
    results = data['results']
    
    if args.success:
        results = [r for r in results if r['status'] == 'success']
    elif args.error:
        results = [r for r in results if r['status'] == 'error']
    elif args.blocked:
        results = [r for r in results if r['status'] == 'blocked']
    
    if args.category:
        results = [r for r in results if r['category'].lower() == args.category.lower()]
    
    if args.question:
        results = [r for r in results if args.question.lower() in r['question'].lower()]
    
    # Mostra resultados
    for i, r in enumerate(results, 1):
        print("=" * 80)
        print(f"[{i}] {r['status'].upper()}")
        print(f"Categoria: {r['category']}")
        print(f"Tempo: {r['time_s']}s | {r['timestamp']}")
        print()
        print(f"❓ Pergunta:")
        print(f"  {r['question']}")
        print()
        
        if r.get('sql'):
            print(f"🔍 SQL Gerado:")
            print(f"  {r['sql']}")
            print()
        
        if r.get('explainer_output'):
            print(f"💬 Resposta do Explainer:")
            print("-" * 80)
            print(r['explainer_output'])
            print("-" * 80)
            print()
        
        if r.get('error'):
            print(f"⚠️  Erro:")
            print(f"  {r['error']}")
            print()
    
    print("=" * 80)
    print(f"\n✅ Mostrando {len(results)} resultado(s)")
    return 0

if __name__ == "__main__":
    sys.exit(view_results())
