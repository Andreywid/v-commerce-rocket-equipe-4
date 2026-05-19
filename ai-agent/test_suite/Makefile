.PHONY: test test-quick test-category test-security test-analytics test-full help view-results view-success view-errors view-explainer

help:
	@echo "🧪 AI Agent Test Runner"
	@echo ""
	@echo "Comandos disponíveis:"
	@echo ""
	@echo "  make test              - Executa teste completo (padrão: --quick)"
	@echo "  make test-quick        - Testa 1 pergunta por categoria"
	@echo "  make test-full         - Testa todas as ~80 perguntas"
	@echo "  make test-security     - Valida apenas segurança"
	@echo "  make test-analytics    - Valida apenas consultas analíticas"
	@echo "  make test-category CAT=<categoria>"
	@echo "                        - Testa categoria específica"
	@echo "  make test-debug        - Teste com mais detalhes"
	@echo ""
	@echo "Exemplos:"
	@echo "  make test              # Teste rápido padrão"
	@echo "  make test-full         # Teste completo"
	@echo "  make test-security     # Apenas testes de segurança"
	@echo "  make test-category CAT='KPIs de vendas'"
	@echo ""

test: test-quick

test-quick:
	@echo "🚀 Iniciando teste rápido (1 pergunta por categoria)..."
	python test_runner_cli.py --quick

test-full:
	@echo "🚀 Iniciando teste completo (todas as perguntas)..."
	@echo "⏱️  Isto pode demorar alguns minutos..."
	python test_runner_cli.py

test-security:
	@echo "🔒 Testando validação de segurança..."
	python test_runner_cli.py --category "Casos para validar segurança/validação SQL"

test-analytics:
	@echo "📊 Testando consultas analíticas avançadas..."
	python test_runner_cli.py --category "Consultas difíceis"

test-category:
	@if [ -z "$(CAT)" ]; then \
		echo "❌ Especifique a categoria com CAT=<nome>"; \
		echo "Categorias disponíveis:"; \
		python -c "import json; cats=json.load(open('test_questions.json')); print('\\n'.join('  - ' + c for c in cats.keys()))"; \
	else \
		python test_runner_cli.py --category "$(CAT)"; \
	fi

test-debug:
	@echo "🔍 Teste com debug ativado..."
	python test_runner_cli.py --quick --debug

show-report:
	@if [ -f "test_report.json" ]; then \
		echo "📊 Último relatório:"; \
		python -m json.tool test_report.json | head -50; \
	else \
		echo "❌ Nenhum relatório encontrado. Execute 'make test' primeiro."; \
	fi

show-categories:
	@echo "📋 Categorias disponíveis:"; \
	python -c "import json; cats=json.load(open('test_questions.json')); [print(f'  - {c} ({len(q)} perguntas)') for c,q in cats.items()]"

list-questions:
	@if [ -z "$(CAT)" ]; then \
		echo "❌ Especifique categoria com CAT=<nome>"; \
		make show-categories; \
	else \
		echo "❓ Perguntas em: $(CAT)"; \
		python -c "import json; cats=json.load(open('test_questions.json')); [print(f'  {i+1}. {q}') for i,q in enumerate(cats.get('$(CAT)', []))]"; \
	fi

view-results:
	@echo "📊 Visualizando todas as respostas com SQL..."
	python view_results.py

view-success:
	@echo "✓ Visualizando apenas sucessos..."
	python view_results.py --success

view-errors:
	@echo "✗ Visualizando apenas erros..."
	python view_results.py --error

view-explainer:
	@echo "💬 Visualizando respostas do explainer..."
	python explainer_responses.py --success

.DEFAULT_GOAL := help
