# 🧪 Test Runner - Guia Rápido

## 📋 O que você tem

- **`test_questions.json`** - Arquivo com todas as ~80 perguntas organizadas por categoria
- **`test_runner_cli.py`** - Script principal (usa a CLI, mais robusto)
- **`test_runner.py`** - Alternativa direta ao orchestrador (mais rápida se funcionar)

## 🚀 Uso Rápido

### 1️⃣ **Teste rápido (recomendado para começar)**

```bash
cd ai-agent
python test_runner_cli.py --quick
```

✅ Testa **1 pergunta por categoria** (8 total) em ~2-3 minutos

### 2️⃣ **Teste uma categoria específica**

```bash
python test_runner_cli.py --category "KPIs de vendas"
```

✅ Testa todas as 10 perguntas de vendas

### 3️⃣ **Teste tudo (completo)**

```bash
python test_runner_cli.py
```

⏱️ ~80 perguntas, tempo depende da velocidade do LLM

### 4️⃣ **Com mais detalhes (debug)**

```bash
python test_runner_cli.py --quick --debug
```

### 5️⃣ **Ajustar timeout** (se LLM é lento)

```bash
python test_runner_cli.py --timeout 60  # 60 segundos por pergunta
```

## 📊 Resultado

Após os testes, você terá:

1. **Resumo no terminal**:
```
📊 RESUMO DOS TESTES
✓ Sucesso:      72/82 (87.8%)
✗ Erro:         5 (6.1%)
🔒 Bloqueado:   5 (6.1%)
```

2. **Arquivo JSON com detalhes**:
```bash
cat test_report.json
```

## 🎯 Casos Especiais

### Validar apenas SEGURANÇA

```bash
python test_runner_cli.py --category "Casos para validar segurança/validação SQL"
```

✅ Verifica se queries maliciosas são bloqueadas

### Validar apenas ANALYTICS

```bash
python test_runner_cli.py --category "Consultas difíceis"
```

✅ Testa os casos mais complexos

## 📈 Interpretar Resultados

| Status | Significado |
|--------|------------|
| ✓ Sucesso | Pergunta gerou SQL válido |
| ✗ Erro | Problema no agente/LLM |
| 🔒 Bloqueado | Pergunta rejeitada por segurança ✅ |
| ⏱️ Timeout | Demorou mais que limite configurado |

## 🔧 Troubleshooting

**Erro: "Arquivo não encontrado"**
```bash
# Certifique-se que test_questions.json existe
ls -la test_questions.json
```

**Erro: "Sem chave de API"**
```bash
# Configure GOOGLE_API_KEY no .env
echo "GOOGLE_API_KEY=sk-..." >> .env
```

**LLM muito lento?**
```bash
# Aumente timeout
python test_runner_cli.py --timeout 90
```

## 💡 Tips

1. **Comece com `--quick`** para validar setup
2. **Use `--category`** para debugar problemas específicos
3. **Salve `test_report.json`** para análise posterior
4. **Teste segurança regularmente** com categoria "Casos para validar"
5. **Compare execuções** olhando test_report.json com timestamp

## 📝 Exemplo Workflow

```bash
# 1. Validar que funciona
python test_runner_cli.py --quick

# 2. Testar categoria que falhou
python test_runner_cli.py --category "KPIs de vendas" --debug

# 3. Testar TUDO quando tiver confiança
python test_runner_cli.py

# 4. Analisar relatório
python -m json.tool test_report.json | less
```

---

**Pronto para testar? Execute:** `python test_runner_cli.py --quick` 🚀
