# Módulo de Prompts (Prompts)

## Visão Geral

O módulo **Prompts** centraliza toda a engenharia de prompts do sistema NL2SQL, incluindo:

- **System prompts**: Instruções base que definem comportamento dos agentes
- **Prompt builders**: Montadores dinâmicos que injetam schema, exemplos, contexto
- **Exemplos de SQL**: Casos de uso reais para guiar geração
- **Conversational memory**: Estratégias de reutilização de contexto
- **Recovery prompts**: Prompts especiais para regenerar SQL após erro

Este módulo é crítico para qualidade de geração — bom prompt engineering pode reduzir erros em 70%.

## Responsabilidades

### 1. System Prompts

- **Definição de comportamento**: Instruções que definem como agente deve se comportar
- **Regras de negócio**: Constraints específicas do domínio e-commerce
- **Estrutura de resposta**: Como formatar SQL, argumentos, etc.
- **Tone & style**: Linguagem e tom esperados

### 2. Builders Dinâmicos

- **SQL Prompt Builder**: Monta prompt para SQL Generator com schema, exemplos, pergunta
- **Explainer Prompt Builder**: Monta prompt para Explainer com pergunta, SQL, dados
- **Conversational Memory**: Monta contexto anterior com detecção de padrão

### 3. Injeção de Schema

- **Schema Registry**: Descrição estruturada de tabelas Gold
- **Formatação**: Converte schema estruturado em texto markdown
- **Nível de detalhe**: Inclui descrição, colunas, regras IA

### 4. Exemplos de SQL

- **Exemplos por dialeto**: SQL adaptado para SQLite vs PostgreSQL
- **Casos de uso reais**: Exemplos de queries que provavelmente serão pedidas
- **Valores realistas**: Exemplos com datas, nomes, números do domínio

### 5. Strategias de Memória

- **Detecção de padrão**: Classifica pergunta em demonstrativa, temporal, implícita
- **Instrução estruturada**: Injeta regras específicas conforme tipo de pergunta
- **Contexto injetado**: Injeta dados concretos (IDs, filtros) do turno anterior

## Arquitetura Interna

### Estrutura de Arquivos

```
app/prompts/
├── system_prompt.py               # System prompt para SQL Generator
├── sql_prompt_builder.py           # Builder: pergunta → prompt SQL
├── sql_user_prompt.py              # Template da pergunta para SQL
├── examples.py                     # Exemplos SQL by dialeto
├── schema_prompt_intro.py           # Prefixo de schema
├── explainer_prompts.py             # System prompt para Explainer
├── explainer_prompt_builder.py       # Builder: dados → prompt de explicação
├── conversational_memory_prompt.py   # Estratégia de memória conversacional
└── orchestrator_prompts.py          # Prompts de recovery após erro
```

### Componentes

#### 1. `system_prompt.py` - System Prompt Base

```python
SYSTEM_PROMPT = """
# SISTEMA ESPECIALIZADO EM TEXT-TO-SQL

Você é um agente especializado em transformar perguntas de negócio
em SQL SELECT seguro para um data warehouse de e-commerce.

## RESPONSABILIDADE
Converter perguntas em linguagem natural para SQL válido que:
1. Retorna dados corretos
2. Usa apenas tabelas Gold
3. É determinístico e seguro
4. Respeita regras de negócio

## REGRAS OBRIGATÓRIAS
1. Retorne APENAS um SELECT válido em SQL
2. Use APENAS tabelas começando com "gold_"
3. Não gere INSERT, UPDATE, DELETE, DROP, ALTER
4. Normalize dates com strftime() (SQLite) ou DATE_TRUNC (PostgreSQL)
5. Use LIMIT para bounded results
6. Valide EXISTS em colunas antes de usar
7. Preserve pluralidade: se pergunta pedir "Quais?", retorne TODAS

## ESTRUTURA DE RESPOSTA
Sempre responda em JSON:
{
  "sql": "SELECT ... ou null se invalido",
  "interpretation": "Resumo em PT-BR do que SQL faz",
  "reasoning": ["Passo 1", "Passo 2", ...],
  "assumptions": ["Premissa 1", "Premissa 2", ...],
  "error": null se sucesso ou string se erro
}

...resto do prompt...
"""
```

**Seções principais**:
1. **Responsabilidade**: O que o agente deve fazer
2. **Regras obrigatórias**: Constraints não-negociáveis
3. **Estrutura de resposta**: Formato JSON esperado
4. **Exemplos**: 2-3 exemplos de pergunta → SQL
5. **Regras de negócio**: Constraints específicas do domínio

#### 2. `sql_prompt_builder.py` - Builder de Prompt SQL

```python
class SqlPromptBuilder:
    """Monta o prompt completo para SQL Generation."""
    
    @staticmethod
    def build_prompt(
        question: str,
        schema: str,
        examples: list[str],
        values: list[str],
        current_date: datetime,
        dialect: SqlDialect = "postgresql",
    ) -> str:
        """
        Monta prompt injetando:
        1. System prompt base
        2. Schema de tabelas Gold
        3. Exemplos de SQL (filtrados por dialeto)
        4. Valores comuns (regiões, categorias, etc.)
        5. Data atual
        6. Pergunta do usuário
        """
        return f"""
{SYSTEM_PROMPT}

# SCHEMA DAS TABELAS DISPONÍVEIS
{schema}

# EXEMPLOS DE QUERIES CORRETAS

## Exemplo 1: Análise mensal
{examples[0]}

## Exemplo 2: Análise por dimensão
{examples[1]}

# VALORES CONHECIDOS NO DOMÍNIO
Regiões: {values['regioes']}
Categorias: {values['categorias']}
...

# DATA ATUAL
Hoje é {current_date.strftime('%Y-%m-%d %H:%M:%S')}

# PERGUNTA DO USUÁRIO
{question}
"""
```

**Injeções ordenadas**:
1. **System prompt**: Define comportamento
2. **Schema**: Descreve tabelas disponíveis
3. **Exemplos**: Mostra padrões corretos
4. **Valores**: Lista de referência
5. **Data**: Contexto temporal
6. **Pergunta**: O que responder

#### 3. `examples.py` - Exemplos de SQL

```python
SQL_EXAMPLES = [
    # Exemplo 1: Análise mensal
    """
    SELECT 
        ano_mes,
        receita_bruta,
        qtd_pedidos_aprovados,
        ticket_medio
    FROM gold_vendas_kpis
    WHERE ano_mes >= '2024-01'
    ORDER BY ano_mes DESC
    LIMIT 12;
    """,
    
    # Exemplo 2: Top N por categoria
    """
    SELECT 
        categoria_mais_vendida,
        COUNT(*) as qtd_meses
    FROM gold_vendas_kpis
    WHERE ano_mes >= '2024-01'
    GROUP BY categoria_mais_vendida
    ORDER BY qtd_meses DESC
    LIMIT 5;
    """,
    # ...mais exemplos
]

VALUE_EXAMPLES = {
    "regioes": ["Nordeste", "Sudeste", "Sul", "Norte", "Centro-Oeste"],
    "categorias": ["Eletrônicos", "Roupas", "Casa e Jardim", ...],
    "estados": ["SP", "RJ", "MG", "BA", ...],
}
```

**Seleção dinâmica por dialeto**:

```python
def select_examples_for_dialect(dialect: SqlDialect) -> list[str]:
    """Retorna exemplos apropriados para o dialeto."""
    if dialect == "sqlite":
        # Bloqueia funções PostgreSQL-específicas
        blocked_tokens = ("DATE_TRUNC", "INTERVAL", "ILIKE", "::")
        return [e for e in SQL_EXAMPLES if not any(t in e for t in blocked_tokens)]
    else:  # PostgreSQL
        # Bloqueia funções SQLite-específicas
        blocked_tokens = ("STRFTIME", "DATE('NOW'", "SUBSTR")
        return [e for e in SQL_EXAMPLES if not any(t in e for t in blocked_tokens)]
```

#### 4. `conversational_memory_prompt.py` - Memória Conversacional

```python
MEMORY_CONVERSATIONAL_PREFIX = """
# CONTEXTO CONVERSACIONAL SEGURO

Use o contexto abaixo apenas para resolver referências do usuário,
como 'e no mês anterior?' ou 'faça o mesmo para outro período'.

# REGRAS PARA FOLLOW-UP ANALÍTICO

- Se a pergunta pedir maior, menor, top, ranking ou comparação sobre
  resultado agregado anterior, preserve a MESMA MÉTRICA e granularidade.
- Não ordene linhas brutas quando anterior calculou totais com SUM, COUNT, AVG.
- Reutilize aliases e definições aprovadas quando fizer sentido.

# REFERÊNCIAS PRONOMINAIS

- Se usar "esses", "essas", "aqueles", "isso", resolva pelo turno anterior.
- Exemplo: "quem são esses" após COUNT com filtro pede linhas detalhadas.

...resto do prefixo...
"""
```

**3 pipelines condicionadas**:

```python
FOLLOWUP_DEMONSTRATIVE_PIPELINE = """
# RESOLUÇÃO OBRIGATÓRIA (PIPELINE)

Esta rodada foi detectada como follow-up com demonstrativo ("esses", "isso", "o mesmo").
Reutilize os MESMOS JOINs, predicados WHERE do turno anterior.
Ajuste apenas o SELECT para listar linhas detalhadas.
É PROIBIDO retornar InvalidRequest.
"""

FOLLOWUP_TEMPORAL_PIPELINE = """
# RESOLUÇÃO OBRIGATÓRIA (PERÍODO)

Pergunta é refinamento temporal ("últimos 3 meses").
Reabrã a intenção do turno anterior e incorpore o novo intervalo.
MANDATÓRIO: Use EXATAMENTE a MESMA MÉTRICA, LÓGICA e AGREGAÇÃO.
MANDATÓRIO: Respeite pluralidade (se "Quais?", retorne TODAS).
"""

FOLLOWUP_IMPLICIT_CONTEXT_OPERATION_PIPELINE = """
# RESOLUÇÃO OBRIGATÓRIA (OPERAÇÃO SOBRE RESULTADOS)

Pergunta pede métrica/ranking/comparação sobre conjunto anterior.
Use conjunto como escopo OBRIGATÓRIO. Filtre com IN.
Preserve filtros temporais e status quando apropriado.
"""
```

#### 5. `orchestrator_prompts.py` - Recovery Prompts

```python
def format_sql_recovery_after_validation_error(
    original_question: str,
    failed_sql: str,
    validation_error: str,
) -> str:
    """Reformula pedido para corrigir SQL rejeitado pelo validador."""
    return f"""
Sua resposta anterior foi rejeitada na validação:

**Pergunta original**: {original_question}

**SQL anterior**:
```sql
{failed_sql}
```

**Erro na validação**:
{validation_error}

Por favor, gere um novo SQL que:
1. Resolve o erro acima
2. Continua respondendo à pergunta original
3. Segue todas as regras de segurança
"""

def format_sql_recovery_after_exec_error(
    original_question: str,
    failed_sql: str,
    db_error: str,
) -> str:
    """Reformula pedido para corrigir SQL que falhou na execução."""
    return f"""
Seu SQL foi rejeitado na execução no banco de dados:

**Pergunta original**: {original_question}

**SQL anterior**:
```sql
{failed_sql}
```

**Erro do banco**:
{db_error}

Por favor, gere um novo SQL que:
1. Resolve o erro do banco (ex: coluna não existe, função não suportada)
2. Continua respondendo à pergunta original
3. Use apenas tabelas gold_* disponíveis
"""
```

#### 6. `explainer_prompts.py` - System Prompt para Explainer

```python
EXPLAINER_SYSTEM = """
# AGENTE EXPLICADOR DE RESULTADOS SQL

Você transforma dados SQL e linhas retornadas em resposta de negócio
em linguagem natural para usuário.

## RESPONSABILIDADE
Gerar explicação clara e concisa que:
1. Responde exatamente à pergunta original
2. Interpreta os números no contexto de negócio
3. Destaca insights ou anomalias
4. Usa linguagem profissional em PT-BR

## ESTRUTURA
1. **Resposta direta**: Sentença que responde à pergunta
2. **Dados de suporte**: Números e percentuais relevantes
3. **Contexto**: Período, comparações, trends
4. **Insights**: O que é notável nos dados

## EXEMPLOS

### Pergunta: Quais foram os 3 produtos mais vendidos?
Resposta:
Os 3 produtos mais vendidos foram:
1. Smartphone XYZ (15.432 unidades, 45% do total)
2. Notebook ABC (8.721 unidades, 25% do total)
3. Tablet DEF (5.203 unidades, 15% do total)

Esses três produtos representam 85% do volume total, com o Smartphone dominando o mercado.

...mais exemplos...
"""
```

## Fluxo de Montagem de Prompt

### Para SQL Generation

```
Usuario pergunta: "Quais os 2 produtos mais vendidos?"
    ↓
SqlPromptBuilder.build_prompt(
    question="...",
    schema=get_schema_prompt(),
    examples=select_examples("postgresql"),
    values=VALUE_EXAMPLES,
    current_date=datetime.now(),
    dialect="postgresql"
)
    ↓
Monta prompt gigante:
    ├─ SYSTEM_PROMPT (base behavior)
    ├─ schema (tabelas, colunas, regras)
    ├─ exemplos (SQL para inspiração)
    ├─ valores (referência de dados)
    ├─ data_atual
    └─ pergunta
    ↓
Envia ao LLM
    ↓
LLM retorna JSON com SQL
```

### Para Explicação

```
SQL retornou: [
    {"produto": "Smartphone", "vendas": 15432},
    {"produto": "Notebook", "vendas": 8721},
]
    ↓
ExplainerPromptBuilder.build_prompt(
    question="Quais os 2 produtos...",
    sql_result=Success(...),
    rows=[...],
    execution_skipped=False
)
    ↓
Monta prompt:
    ├─ EXPLAINER_SYSTEM
    ├─ pergunta original
    ├─ SQL aprovado
    ├─ dados (primeiras 10 linhas)
    └─ instruções de formatação
    ↓
Envia ao LLM
    ↓
LLM retorna string em PT-BR
```

### Para Memória Conversacional

```
Turno 2 com pergunta: "Qual desses vendeu mais?"
    ↓
[1] Recupera turnos anteriores
    └─ [Turno 1 com SQL aprovado]
    ↓
[2] format_question_with_conversational_memory()
    ├─ Detecta padrão: "desses" = demonstrative
    ├─ Injeta FOLLOWUP_DEMONSTRATIVE_PIPELINE
    └─ Monta contexto com turno anterior
    ↓
[3] build_context_instruction()
    ├─ Executa SQL anterior
    ├─ Extrai IDs retornados
    ├─ Gera instrução crítica com exemplos
    └─ Injeta WHERE id IN (...)
    ↓
Pergunta enriquecida vai ao SQL Generator
```

## Estratégias Anti-Hallucination

### 1. Exemplos Concretos

```
Ao invés de:
"Gere um SQL que responde perguntas"

Use:
"Gere um SQL como estes exemplos:
SELECT ano_mes, SUM(receita) FROM gold_vendas_kpis GROUP BY ano_mes
"
```

### 2. Regras Explícitas em CAPS

```
"VOCÊ DEVE filtrar apenas por tabelas gold_*
VOCÊ NÃO DEVE gerar INSERT/UPDATE/DELETE
É OBRIGATÓRIO incluir LIMIT
É PROIBIDO usar subconsultas > 3 níveis"
```

### 3. Instruções Estruturadas

```
"Retorne SEMPRE em JSON:
{
  \"sql\": \"...\",
  \"reasoning\": [\"passo1\", \"passo2\"],
  \"assumptions\": [\"premissa1\"]
}

Não retorne em markdown ou outros formatos."
```

### 4. Contexto Injetado

```
"Data atual: 2024-05-18
Período típico: últimos 30 dias
Tabelas disponíveis: gold_vendas_kpis, gold_cliente_360, ..."
```

### 5. Exemplos de ERRADO vs CORRETO

```
❌ ERRADO:
SELECT * FROM users WHERE id = 1;
(Reason: users não está em gold_*, é PUBLIC schema)

✓ CORRETO:
SELECT * FROM gold_cliente_360 WHERE id_cliente = 1;
(Reason: gold_cliente_360 é tabela Gold permitida)
```

## Observabilidade

### Logs

```python
logger.debug(f"[prompts] Dialeto detectado: {dialect}")
logger.debug(f"[prompts] Exemplos selecionados: {len(examples)}")
logger.debug(f"[prompts] Prompt length: {len(prompt)} chars")
logger.debug(f"[prompts] Schema sections: {len(schema.split('#'))}")
logger.debug(f"[prompts] Memória: padrão={pattern_type}, reuse={should_reuse}")
logger.debug(f"[prompts] Instrução injetada: {len(instruction)} chars")
```

### Métricas

- `prompts.example_filtering_ratio` (Histogram)
- `prompts.schema_injection_size` (Histogram) em chars
- `prompts.memory_instruction_length` (Histogram)
- `prompts.pattern_detection_accuracy` (Counter)

## Limitações e Trade-offs

### 1. Tamanho do Prompt

- **Problema**: Mais contexto = prompt maior = latência, custo
- **Impacto**: Trade-off entre qualidade e performance
- **Mitigação**: Limitar exemplos a 2, reduzir schema a colunas essenciais

### 2. Variabilidade do LLM

- **Problema**: LLM pode não seguir instruções mesmo com prompts perfeitos
- **Impacto**: Não há garantia de qualidade
- **Mitigação**: Validação pós-LLM, feedback loop, testes contínuos

### 3. Linguagem PT-BR

- **Problema**: Nem todos os LLMs são igualmente bons em PT-BR
- **Impacto**: SQL gerado pode ser semântica/sintaxe incorreta
- **Mitigação**: Usar modelos treinados em PT-BR, testes no domínio

### 4. Contexto Conversacional

- **Problema**: Contexto muito antigo pode ser irrelevante ou contraditório
- **Impacto**: LLM pode reutilizar contexto errado
- **Mitigação**: Limitar a 3 turnos anteriores, disjoint check

## Extensões Futuras

### 1. Few-Shot Learning Dinâmico

```python
class DynamicFewShotBuilder:
    """Seleciona exemplos mais relevantes para cada pergunta."""
    
    def select_examples(self, question: str) -> list[str]:
        # Encontra exemplos similares à pergunta
        # Usa embedding similarity
        # Retorna top-3 mais similares
```

### 2. Prompt Optimization com Gradient

```python
class PromptOptimizer:
    """Otimiza prompts usando técnicas como gradient-based."""
    
    def optimize(self, examples: list[Example]) -> str:
        # Usa library como textgradient
        # Busca prompt ideal
```

### 3. Template Variações

```python
class PromptVariations:
    """Gera múltiplas variações do prompt."""
    
    def generate_variations(self, base_prompt: str) -> list[str]:
        # Muda ordem de regras
        # Muda tom (formal vs casual)
        # Testa com A/B testing
```

## Referências de Código

| Arquivo | Responsabilidade | LOC |
|---------|-----------------|-----|
| `system_prompt.py` | System prompt base | ~150 |
| `sql_prompt_builder.py` | Builder SQL | ~100 |
| `sql_user_prompt.py` | Template de pergunta | ~50 |
| `examples.py` | Exemplos SQL | ~200 |
| `schema_prompt_intro.py` | Prefixo de schema | ~100 |
| `explainer_prompts.py` | System prompt Explainer | ~100 |
| `explainer_prompt_builder.py` | Builder Explainer | ~80 |
| `conversational_memory_prompt.py` | Memória conversacional | ~300 |
| `orchestrator_prompts.py` | Recovery prompts | ~80 |

## Glossário

| Termo | Definição |
|-------|-----------|
| **System Prompt** | Instruções base que definem comportamento do LLM |
| **Prompt Builder** | Função que monta prompt dinamicamente |
| **Schema Injection** | Injetar descrição de tabelas no prompt |
| **Examples** | Exemplos de entrada/saída esperados |
| **Recovery Prompt** | Prompt que injeta erro anterior para regenerar |
| **Few-Shot Learning** | Fornecer poucos exemplos para guiar LLM |
| **Anti-Hallucination** | Técnicas para evitar respostas inventadas |

---

**Versão**: 1.0  
**Última Atualização**: Mai 2026  
**Autor**: Equipe de Engenharia NL2SQL  
**Status**: Produção
