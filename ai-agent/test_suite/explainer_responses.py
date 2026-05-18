#!/usr/bin/env python3
"""
Visualizador de respostas do Explainer - foco na resposta textual

Uso:
    python explainer_responses.py              # Todas as respostas
    python explainer_responses.py --success    # Só sucessos
    python explainer_responses.py --category "KPIs de vendas"
    python explainer_responses.py --question "faturamento"
"""

import json
import sys
from pathlib import Path
import argparse

def show_explainer_responses():
    parser = argparse.ArgumentParser(description="Visualizador de respostas do Explainer")
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
        default="../test_report.json",
        help="Arquivo de relatório"
    )
    parser.add_argument(
        "--save",
        type=str,
        help="Salva respostas em um arquivo txt"
    )
    
    args = parser.parse_args()
    
    report_file = Path(args.file)
    if not report_file.exists():
        print(f"❌ Arquivo não encontrado: {report_file}")
        print(f"   Procure em: ai-agent/test_report.json")
        return 1
    
    with open(report_file) as f:
        data = json.load(f)
    
    # Filtra resultados
    results = data['results']
    
    if args.success:
        results = [r for r in results if r['status'] == 'success']
    elif args.error:
        results = [r for r in results if r['status'] == 'error']
    
    if args.category:
        results = [r for r in results if r['category'].lower() == args.category.lower()]
    
    if args.question:
        results = [r for r in results if args.question.lower() in r['question'].lower()]
    
    # Abre arquivo para salvar (se pedido)
    output_file = None
    if args.save:
        output_file = open(args.save, 'w', encoding='utf-8')
    
    # Função auxiliar para printar
    def write_line(text=""):
        print(text)
        if output_file:
            output_file.write(text + "\n")
    
    write_line(f"📊 Respostas do Explainer ({len(results)} resultado(s))")
    write_line(f"⏰ {data['timestamp']}")
    write_line("=" * 100)
    write_line()
    
    # Mostra respostas
    for i, r in enumerate(results, 1):
        write_line(f"[{i}] {r['status'].upper()}")
        write_line(f"Categoria: {r['category']} | Tempo: {r['time_s']}s")
        write_line()
        write_line(f"❓ Pergunta:")
        write_line(f"   {r['question']}")
        write_line()
        
        if r.get('sql'):
            write_line(f"🔍 SQL:")
            write_line(f"   {r['sql']}")
            write_line()
        
        if r.get('explainer_output'):
            write_line(f"💬 Resposta:")
            write_line("-" * 100)
            write_line(r['explainer_output'])
            write_line("-" * 100)
        else:
            write_line("(Sem resposta do explainer)")
        
        if r.get('error'):
            write_line()
            write_line(f"⚠️  Erro: {r['error']}")
        
        write_line()
        write_line()
    
    write_line("=" * 100)
    if args.save:
        output_file.close()
        print(f"\n✅ Salvo em: {args.save}")
    
    return 0

if __name__ == "__main__":
    sys.exit(show_explainer_responses())
