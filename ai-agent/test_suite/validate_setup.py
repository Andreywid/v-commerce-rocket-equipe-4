#!/usr/bin/env python3
"""
validate_setup.py - Valida se o ambiente está pronto para testar

Uso: python validate_setup.py
"""

import sys
import os
from pathlib import Path

def check(description: str, condition: bool, fix: str = ""):
    """Printa resultado de uma verificação."""
    status = "✓" if condition else "✗"
    print(f"  {status} {description}")
    if not condition and fix:
        print(f"    └─ Fix: {fix}")
    return condition

def main():
    print("🔍 Validando setup...\n")
    
    # test_suite/ é o diretório atual, ai-agent/ é o pai
    test_suite = Path(__file__).resolve().parent
    root = test_suite.parent
    all_ok = True
    
    # 1. Diretórios
    print("📁 Verificando diretórios:")
    all_ok &= check("ai-agent/ existe", root.exists())
    all_ok &= check("app/ existe", (root / "app").exists())
    all_ok &= check("tests/ existe", (root / "tests").exists())
    
    # 2. Arquivos de teste
    print("\n📋 Verificando arquivos de teste:")
    all_ok &= check(
        "test_questions.json existe",
        (test_suite / "test_questions.json").exists(),
        "Execute: python -c \"import json; from test_runner_cli import ...\""
    )
    all_ok &= check(
        "test_runner_cli.py existe",
        (test_suite / "test_runner_cli.py").exists()
    )
    all_ok &= check(
        "Makefile existe",
        (test_suite / "Makefile").exists()
    )
    all_ok &= check(
        "test.sh executável",
        (test_suite / "test.sh").exists() and os.access(test_suite / "test.sh", os.X_OK)
    )
    
    # 3. Python
    print("\n🐍 Verificando Python:")
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}"
    all_ok &= check(
        f"Python {python_version}",
        sys.version_info >= (3, 8),
        "Atualize para Python 3.8+"
    )
    
    # 4. Dependências
    print("\n📦 Verificando dependências:")
    try:
        import dotenv
        all_ok &= check("dotenv disponível", True)
    except ImportError:
        all_ok &= check("dotenv disponível", False, "pip install python-dotenv")
    
    # 5. Variáveis de ambiente
    print("\n🔑 Verificando configuração:")
    env_file = root / ".env"
    all_ok &= check(".env existe", env_file.exists(), "Copie .env.example para .env")
    
    if env_file.exists():
        with open(env_file) as f:
            content = f.read()
            has_api_key = "GOOGLE_API_KEY" in content or "API_KEY" in content
            all_ok &= check(
                "API Key configurada",
                has_api_key,
                "Adicione GOOGLE_API_KEY=sk-... em .env"
            )
    
    # 5. Banco de dados
    print("\n🗄️  Verificando banco de dados:")
    mock_db = root / "mock_gold.sqlite"
    all_ok &= check(
        "Mock database existe",
        mock_db.exists(),
        "Será criado na primeira execução"
    )
    
    # 7. Testes básicos
    print("\n✅ Verificando testes básicos:")
    test_file = root / "tests" / "test_orchestrator.py"
    all_ok &= check(
        "Testes unitários existem",
        test_file.exists()
    )
    
    # Resultado final
    print("\n" + "="*50)
    if all_ok:
        print("✅ Setup validado com sucesso!")
        print("\nPróximo passo:")
        print("  cd ai-agent")
        print("  make test")
        return 0
    else:
        print("⚠️  Alguns problemas foram encontrados")
        print("\nCorreja os itens acima e tente novamente")
        return 1

if __name__ == "__main__":
    sys.exit(main())
