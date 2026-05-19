# 🚀 COMECE POR AQUI - Opções de Teste Rápidas

## ⚡ Opção 1: Via Makefile (Mais fácil)

```bash
cd ai-agent

# Teste rápido (recomendado para começar) - ~3 minutos
make test

# Ou outras opções:
make test-quick       # 1 pergunta por categoria (rápido)
make test-full        # Todas as ~80 perguntas
make test-security    # Valida segurança
make show-categories  # Lista categorias
```

---

## ⚡ Opção 2: Via Shell Script

```bash
cd ai-agent

# Teste rápido
./test.sh quick

# Ou:
./test.sh full          # Todas as perguntas
./test.sh security      # Só segurança
./test.sh category "KPIs de vendas"  # Uma categoria
```

---

## ⚡ Opção 3: Python Direto

```bash
cd ai-agent

# Teste rápido
python test_runner_cli.py --quick

# Ou:
python test_runner_cli.py              # Todas
python test_runner_cli.py --timeout 60 # Se LLM é lento
python test_runner_cli.py --debug      # Ver detalhes
```

---

## 📊 Tipo de Teste Recomendado por Caso

### 👤 Desenvolvedor (debugando um problema)
```bash
make test-quick                                    # Ver se algo mudou
make test-category CAT="KPIs de vendas"           # Debugar categoria específica
python test_runner_cli.py --category "..." --debug # Ver detalhes
```

### 👨‍💼 PM (validar features)
```bash
make test      # Rápido
make test-full # Completo se tiver tempo
```

### 🔐 Security (validar guardrails)
```bash
make test-security  # Testa 6 casos maliciosos
```

### 🎓 QA (teste exhaustivo)
```bash
make test-full  # Todas as 82 perguntas
# Esperar ~30-60 minutos
cat test_report.json  # Analisar relatório
```

---

## 📋 Perguntas Incluídas

```
KPIs de vendas ................. 10 perguntas
Clientes ....................... 10 perguntas
Produtos ....................... 10 perguntas
Pedidos ........................ 10 perguntas
Suporte / Tickets .............. 10 perguntas
Avaliações / NPS ............... 10 perguntas
Clickstream .................... 8 perguntas
Consultas Analíticas ........... 8 perguntas
Consultas Difíceis ............. 10 perguntas
Segurança ...................... 6 perguntas
───────────────────────────────────────────
TOTAL .......................... 82 perguntas
```

---

## 📊 Resultado Esperado

Após executar, você verá:

```
📊 RESUMO DOS TESTES
================================================
Total de testes: 82
✓ Sucesso:      70 (85.4%)
✗ Erro:         7 (8.5%)
🔒 Bloqueado:   5 (6.1%)

⏱️  Tempo total: 120.5s | Média: 1.5s/pergunta

📈 Por Categoria:
  KPIs de vendas: 9/10 ✓ (90%)
  Clientes: 9/10 ✓ (90%)
  Produtos: 8/10 ✓ (80%)
  ...

💾 Relatório salvo em: test_report.json
```

---

## 📁 Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `test_questions.json` | Todas as 82 perguntas (JSON) |
| `test_runner_cli.py` | Script Python principal |
| `test.sh` | Shell script helper |
| `Makefile` | Atalhos (make test, etc) |
| `test_report.json` | Resultado dos testes (gerado) |
| `QUICK_START.md` | Este guia |
| `TEST_STRATEGY.md` | Estratégia detalhada |
| `TEST_RUNNER_GUIDE.md` | Documentação completa |

---

## 🎯 3 Passos para Começar

### Passo 1: Teste Rápido (confirma setup)
```bash
make test  # ~3 minutos
```

### Passo 2: Veja resultado
```bash
# Terminal mostra resumo
# Arquivo test_report.json criado
```

### Passo 3: (Opcional) Teste completo
```bash
make test-full  # ~30-60 minutos
```

---

## ❓ Dúvidas

**P: Quanto tempo leva?**
- Teste rápido: 3-5 minutos
- Teste completo: 30-60 minutos (depende LLM)

**P: Preciso de API Key?**
- Sim! Configure em `.env`: `GOOGLE_API_KEY=sk-...`

**P: O que significa cada status?**
- ✓ Sucesso: SQL válido e executou
- ✗ Erro: Problema no agente/LLM
- 🔒 Bloqueado: Bloqueado por segurança (esperado)

**P: Como debugar uma falha?**
```bash
make test-category CAT="KPIs de vendas"  # Filtra uma categoria
```

---

## 🚀 VAMOS LÁ!

**Para começar AGORA:**

```bash
cd ai-agent
make test
```

ou

```bash
cd ai-agent
python test_runner_cli.py --quick
```

**Pronto!** Você vai ver o progresso em tempo real. ⏳
