#!/bin/bash
# test.sh - Script helper para testar perguntas facilmente

set -e

cd "$(dirname "$0")"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    cat << EOF
${BLUE}🧪 AI Agent Test Runner${NC}

${GREEN}Uso:${NC}
  ./test.sh [OPÇÃO]

${GREEN}Opções:${NC}
  quick         Teste rápido (1 pergunta/categoria)
  full          Teste completo (~80 perguntas)
  security      Testes de segurança
  analytics     Testes de analytics avançado
  category NAME Testa categoria específica
  report        Mostra último relatório
  help          Esta mensagem

${GREEN}Exemplos:${NC}
  ./test.sh quick               # Rápido
  ./test.sh category "KPIs de vendas"
  ./test.sh security
  ./test.sh report

${GREEN}Atalhos (Makefile):${NC}
  make test               # Igual ./test.sh quick
  make test-full          # Igual ./test.sh full
  make show-categories    # Lista categorias
  make list-questions CAT="Nome da Categoria"

EOF
}

run_quick() {
    echo -e "${BLUE}🚀 Iniciando teste rápido...${NC}"
    python test_runner_cli.py --quick
}

run_full() {
    echo -e "${YELLOW}⚠️  Isto pode demorar alguns minutos...${NC}"
    echo -e "${BLUE}🚀 Iniciando teste completo...${NC}"
    python test_runner_cli.py
}

run_security() {
    echo -e "${BLUE}🔒 Testando validação de segurança...${NC}"
    python test_runner_cli.py --category "Casos para validar segurança/validação SQL"
}

run_analytics() {
    echo -e "${BLUE}📊 Testando consultas analíticas...${NC}"
    python test_runner_cli.py --category "Consultas difíceis"
}

run_category() {
    local category="$1"
    echo -e "${BLUE}🧪 Testando categoria: ${GREEN}$category${NC}"
    python test_runner_cli.py --category "$category"
}

show_report() {
    if [ -f "test_report.json" ]; then
        echo -e "${BLUE}📊 Últimas 50 linhas do relatório:${NC}"
        tail -50 test_report.json
    else
        echo -e "${RED}❌ Nenhum relatório encontrado${NC}"
        echo "Execute 'make test' primeiro"
    fi
}

# Main
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

case "$1" in
    quick)
        run_quick
        ;;
    full)
        run_full
        ;;
    security)
        run_security
        ;;
    analytics)
        run_analytics
        ;;
    category)
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Especifique a categoria${NC}"
            exit 1
        fi
        run_category "$2"
        ;;
    report)
        show_report
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}❌ Opção desconhecida: $1${NC}"
        show_help
        exit 1
        ;;
esac
