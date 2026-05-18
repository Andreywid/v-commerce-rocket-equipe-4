#!/usr/bin/env bash
# START - Comece aqui para testar perguntas contra o AI Agent

cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════════╗
║        🧪 AI AGENT TEST SUITE - Teste suas 82 perguntas de negócio        ║
╚════════════════════════════════════════════════════════════════════════════╝

📍 LOCAL: test_suite/

🚀 COMEÇAR AGORA:

  $ cd ai-agent/test_suite
  $ make test

═════════════════════════════════════════════════════════════════════════════

⚡ TOP 5 COMANDOS:

  make test              ← Teste rápido (1 pergunta/categoria)
  make test-full         ← Teste completo (todas as 82)
  make view-explainer    ← Ver respostas do explainer
  make view-results      ← Ver SQL + respostas combinados
  make test-security     ← Validar segurança

═════════════════════════════════════════════════════════════════════════════

📚 DOCUMENTAÇÃO:

  cat START_HERE.md       ← Menu visual (RECOMENDADO)
  cat QUICK_START.md      ← 30 segundos
  cat CHEAT_SHEET.md      ← Referência rápida
  cat README_TESTING.md   ← Índice completo

═════════════════════════════════════════════════════════════════════════════

📊 82 PERGUNTAS INCLUÍDAS:

  • KPIs de vendas (10)
  • Clientes (10)
  • Produtos (10)
  • Pedidos (10)
  • Suporte/Tickets (10)
  • Avaliações/NPS (10)
  • Clickstream (8)
  • Consultas analíticas (8)
  • Consultas difíceis (10)
  • Segurança (6)

═════════════════════════════════════════════════════════════════════════════

💡 FLUXO RECOMENDADO:

  1. cd ai-agent/test_suite
  2. make test                  # Teste rápido
  3. make view-explainer        # Ver resultados
  4. Leia os guias se precisar  # Documentação

═════════════════════════════════════════════════════════════════════════════

🎯 RESULTADO ESPERADO:

  ✓ Sucesso:      70-85%
  ✗ Erro:         5-15%
  🔒 Bloqueado:   5-10% (esperado - segurança)

═════════════════════════════════════════════════════════════════════════════

🚀 VAMOS LÁ!

  cd ai-agent/test_suite && make test

═════════════════════════════════════════════════════════════════════════════
EOF
