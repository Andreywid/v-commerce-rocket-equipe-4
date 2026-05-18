# ⚡ Cheat Sheet - Comandos Rápidos

## 🔥 Top 5 Comandos

```bash
make test              # ← COMECE AQUI (teste rápido)
make test-full         # Teste completo
make view-explainer    # Ver respostas do explainer
make view-results      # Ver SQL + resposta
make test-security     # Valida segurança
```

---

## 📋 Todos os Comandos Make

```bash
make help              # Ver ajuda
make test              # Teste rápido (1 q/cat, ~5 min)
make test-quick        # Idem
make test-full         # Tudo (~60 min)
make test-security     # 6 queries maliciosas
make test-analytics    # Casos difíceis
make test-category CAT="KPIs de vendas"  # Uma categoria
make show-report       # Ver último resultado
make show-categories   # Listar categorias
make list-questions CAT="Clientes"  # Ver perguntas
make view-results      # Ver todas as respostas
make view-success      # Ver só sucessos
make view-errors       # Ver só erros
make view-explainer    # Ver respostas do explainer
```

---

## 🐍 Python Direto

```bash
# Testar
python test_runner_cli.py --quick
python test_runner_cli.py
python test_runner_cli.py --category "KPIs de vendas"

# Visualizar respostas
python explainer_responses.py
python explainer_responses.py --success
python explainer_responses.py --error
python explainer_responses.py --category "KPIs de vendas"

# Ver SQL + resposta
python view_results.py --success
python view_results.py --category "Clientes"

# Salvar em arquivo
python explainer_responses.py --success --save meus_resultados.txt
```

---

## 📊 Resultado Esperado

```
✓ Sucesso:      70 (85%)
✗ Erro:         7 (9%)
🔒 Bloqueado:   5 (6%)
```

---

## 🗂️ Arquivos Criados

| Arquivo | Comando |
|---------|---------|
| `test_runner_cli.py` | `python ...` |
| `test.sh` | `./test.sh ...` |
| `Makefile` | `make ...` |
| `test_questions.json` | 82 perguntas |
| `test_report.json` | Resultado (gerado) |

---

## 📚 Documentação

| Doc | Tempo |
|-----|-------|
| `START_HERE.md` | ⏱️ 2 min |
| `QUICK_START.md` | ⏱️ 1 min |
| `README_TESTING.md` | ⏱️ 5 min |
| `TEST_RUNNER_GUIDE.md` | ⏱️ 10 min |
| `TEST_STRATEGY.md` | ⏱️ 15 min |

---

## 🐛 Debug

```bash
# Uma categoria com detalhes
python test_runner_cli.py --category "KPIs de vendas" --debug

# Direto no CLI
python -m app.main --question "Qual foi o faturamento..."

# Validar setup
python validate_setup.py
```

---

## ✅ Checklist

- [ ] `.env` tem `GOOGLE_API_KEY`
- [ ] `python validate_setup.py` passou
- [ ] Rodou `make test` pelo menos uma vez
- [ ] Viu `test_report.json`
- [ ] Leu pelo menos `START_HERE.md`

---

## 🎯 Próximo Passo

```bash
cd ai-agent
make test
```

**Feito!** 🚀
