# ⚡ Quick Start - Testar Perguntas em 30 segundos

## 🔴 Para começar AGORA:

```bash
cd ai-agent
make test
```

## 🟡 Outros comandos úteis:

```bash
# Teste rápido (8 perguntas)
make test-quick

# Teste completo (todas as 80 perguntas)
make test-full

# Validar SEGURANÇA
make test-security

# Ver últimas 10 categorias
make show-categories

# Ver perguntas de uma categoria
make list-questions CAT="KPIs de vendas"

# Ver relatório anterior
make show-report
```

## 🔵 Sem Makefile? Use Python direto:

```bash
# Rápido
python test_runner_cli.py --quick

# Uma categoria
python test_runner_cli.py --category "KPIs de vendas"

# Tudo
python test_runner_cli.py
```

## 📊 Resultado esperado:

```
✓ Sucesso:      72 (87.8%)
✗ Erro:         5 (6.1%)
🔒 Bloqueado:   5 (6.1%)
```

## 📁 Arquivos gerados:

- `test_report.json` - Relatório detalhado (abra com `cat test_report.json`)

---

**Pronto!** 🚀 Execute `make test` ou `python test_runner_cli.py --quick`
