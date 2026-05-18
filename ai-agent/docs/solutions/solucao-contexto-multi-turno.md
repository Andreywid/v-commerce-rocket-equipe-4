# Solução: Contexto Multi-turno com Filtros SQL

## Problema Original
O agente não traduzia o contexto da conversa para filtros SQL. Quando o usuário dizia "qual dos dois" ou "desses 5 que você trouxe", o agente gerava SQL sem WHERE correspondente aos itens mencionados anteriormente.

### Exemplo do Problema
```
Turno 1: "Quais foram os 2 produtos mais vendidos do último mês?"
→ Resposta correta: Monitor Gamer 144Hz (114 unidades) e Smartphone 64GB (113 unidades)

Turno 2: "Qual dos dois tem a melhor avaliação?"
→ Resposta incorreta: "A Raquete de Beach Tennis tem a melhor avaliação (4.04)..."
→ PROBLEMA: Raquete NÃO estava na conversa anterior!
```

## Causa Raiz
O gerador de SQL não mapeava:
- Referências anafóricas ("qual dos dois", "desses 5")
- Produtos anteriormente listados
- Para filtros WHERE específicos

Resultado: Consultava o banco inteiro, não o contexto da conversa.

## Dados Reais Carregados ✓

Agora todos os dados vêm dos CSVs da pasta `app/database/data/`:

```
gold_clientes_360.csv        → 58.322 clientes
gold_produto_performance.csv → 517 produtos
gold_pedidos_enriquecidos.csv → 284.164 pedidos
gold_avaliacoes.csv           → 100.000 avaliações
gold_tickets.csv              → 34.697 tickets
gold_vendas_kpis.csv          → 41 períodos
gold_clickstream_resumo.csv   → 100.000 eventos
```

### Produtos Reais de Teste
- **Monitor Gamer 144Hz** (PROD-0517): 114 vendidas/30d, avaliação 3.69
- **Smartphone 64GB** (PROD-0002): 113 vendidas/30d, avaliação 3.71  
- **Raquete de Beach Tennis** (PROD-0199): 0 vendidas/30d, avaliação 4.04 ⭐ (melhor geral)

## Solução Implementada

### 1. Mock SQLite com Dados CSV
**Arquivo**: `app/database/mock_gold.py`

```python
def _load_csv_data(csv_path: Path) -> list[dict] | None:
    """Carrega dados de um arquivo CSV"""
    
def _load_and_seed_csv_data(cur: sqlite3.Cursor) -> bool:
    """Carrega todos os CSVs e insere no banco"""
    
def _seed(cur: sqlite3.Cursor) -> None:
    """Primeiro tenta CSV, depois fallback hardcoded"""
```

**Fluxo**:
1. Verifica se arquivos CSV existem em `app/database/data/`
2. Carrega cada CSV com validação de tipos
3. Insere no SQLite com mapeamento de colunas
4. Se falhar, usa dados hardcoded como fallback

### 2. Extração e Preservação de Contexto
**Arquivo**: `app/memory/context_extractor.py` (novo)

Deve extrair de cada resposta:
```python
{
    "turno": 2,
    "pergunta": "Qual dos dois tem a melhor avaliação?",
    "contexto_anterior": {
        "produtos": [
            {"id": "PROD-0517", "nome": "Monitor Gamer 144Hz"},
            {"id": "PROD-0002", "nome": "Smartphone 64GB"}
        ],
        "métrica": "quantidade_vendida_30d"
    },
    "filtro_sql_recomendado": "WHERE id_produto IN ('PROD-0517', 'PROD-0002')"
}
```

### 3. Enriquecimento de Prompts com Contexto
**Arquivo**: `app/memory/conversation_store.py`

Deve adicionar ao prompt:
```
## CONTEXTO DA CONVERSA

Baseado na pergunta anterior, extraímos estes dados:
- Produtos mencionados: Monitor Gamer 144Hz, Smartphone 64GB
- IDs: PROD-0517, PROD-0002
- Métrica de seleção: quantidades vendidas nos últimos 30 dias

IMPORTANTE: Se a pergunta atual referencia "qual dos dois", "desses", "entre eles", etc,
use OBRIGATORIAMENTE este filtro SQL:
WHERE id_produto IN ('PROD-0517', 'PROD-0002')
```

### 4. Testes de Validação
**Arquivo**: `test_csv_mock_data.py`

Valida:
- ✓ Dados reais carregados
- ✓ Contexto multi-turno preservado
- ✓ Diferença entre SQL com e sem filtro
- ✓ Produtos reais (Monitor, Smartphone vs Raquete)

## Teste de Funcionamento

```bash
cd ai-agent
python test_csv_mock_data.py
```

Resultado esperado:
```
✓ Dados reais carregados: 2 produtos encontrados
✓ Contexto preservado: IDs de produtos = ['PROD-0517', 'PROD-0002']
✓ SQL com filtro (correto): WHERE id_produto IN ('PROD-0517', 'PROD-0002')
✓ A Raquete de Beach Tennis (nota 4.04) só aparece sem filtro
```

## Próximas Etapas

1. **Integrar extração de contexto** no `orchestrator.py`
2. **Enriquecer prompts** com dados estruturados em `conversation_store.py`
3. **Validar SQL gerado** com instruções explícitas no `sql_generator.py`
4. **Testes end-to-end** com fluxos conversacionais completos

## Referências

- **Problema**: Limitação 1 - Contexto multi-turno com filtros SQL
- **Histórico**: Turnos 1-4 com "Monitor/Smartphone" vs "Raquete de Beach Tennis"
- **Dados de teste**: `test_csv_mock_data.py`
- **Dados reais**: `/app/database/data/*.csv` (717K linhas totais)
