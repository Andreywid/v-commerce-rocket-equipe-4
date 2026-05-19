# Módulo de Memória Conversacional (Conversation Memory)

## Visão Geral

O módulo **Memória Conversacional** é responsável por manter contexto de curto prazo durante múltiplos turnos de uma conversa NL2SQL, permitindo que o agente IA:

- **Resolva referências pronominais** ("Qual desses produtos vendeu mais?")
- **Detecte mudanças de dimensão** (produtos → regiões sem pronome demonstrativo explícito)
- **Reutilize definições analíticas** (mesma métrica, mesma granularidade em follow-ups)
- **Injete dados concretos** (IDs, valores de filtro) do turno anterior ao prompt do SQL Generator

Este módulo está inserido na **arquitetura NL2SQL de múltiplos turnos** e atua como intermediário entre a camada de orquestração e o gerador de SQL, enriquecendo cada pergunta com contexto seguro e estruturado.

## Responsabilidades

### 1. Armazenamento Seguro de Histórico Conversacional

- **Escopo isolado**: Conversas são segregadas por `conversation_id`, `tenant_id` e `user_id`, garantindo isolamento de dados entre usuários e tenants
- **TTL (Time-To-Live)**: Conversas expiram automaticamente após período configurável (padrão: 3600s), reduzindo risco de vazamento de contexto
- **Sem persistência de PII**: Armazena APENAS metadados operacionais (pergunta, SQL aprovado, interpretação, raciocínio, premissas, erro) — **nunca** linhas de dados, explicações completas ou textos sensíveis
- **Limite de turnos**: No máximo 10 turnos por conversa (configurável), evitando contexto excessivo que prejudicaria performance

### 2. Extração de Contexto Estruturado

- **Execução de SQL anterior**: Roda o SQL aprovado do turno anterior contra o banco para extrair dados concretos
- **Coleta de IDs/filtros**: Identifica colunas de ID (`id_*`) ou colunas textuais seguras para reutilização em filtros
- **Amostragem segura**: Retorna primeiras linhas sem dados sensíveis (exclui colunas contendo "email", "telefone", "cpf", "senha", "token")
- **Mapeamento de dimensões**: Detecta quais dimensões (produto, região, cliente, pedido, ticket) estão presentes nos resultados

### 3. Detecção de Padrões de Referência

- **Pronominais e demonstrativos**: Identifica "esses", "desses", "qual das", "entre os" etc., sinalizando dependência explícita de turno anterior
- **Operações implícitas em contexto**: Detecta "Qual vendeu mais?" após lista de produtos → operação de ranking sobre conjunto anterior
- **Refinamentos temporais**: Detecta "últimos 3 meses" como reaplicação da mesma lógica analítica a novo período
- **Mudanças de dimensão**: Avalia se pergunta atual muda de dimensão (produtos → regiões) sem pronome explícito → risco de aplicar filtro errado

### 4. Injeção de Instruções no Prompt

- **Instruções críticas**: Insere blocos de contexto no prompt do SQL Generator com exemplos explícitos do SQL correto
- **Validação de scope**: Garante que filtros anteriores sejam obrigatoriamente incorporados em queries sobre o mesmo conjunto
- **Anti-ambiguidade**: Reduz InvalidRequest ao fornecer dados concretos (IDs, valores) em vez de deixar o LLM adivinhar

## Arquitetura Interna

### Componentes Principais

#### 1. `InMemoryConversationStore`

**Classe responsável**: Gerencia armazenamento em memória de histórico conversacional.

```
┌─────────────────────────────────────────────────────────────┐
│        InMemoryConversationStore                            │
├─────────────────────────────────────────────────────────────┤
│ Atributos:                                                  │
│  - _items: Dict[ConversationKey, List[ConversationTurn]]    │
│  - _ttl: timedelta (padrão 3600s)                          │
│  - _max_turns: int (padrão 10)                             │
│  - _lock: RLock (thread-safe)                              │
├─────────────────────────────────────────────────────────────┤
│ Métodos:                                                    │
│  - append_result(...)          → ConversationKey           │
│  - list_turns(...)             → List[ConversationTurn]    │
│  - _prune_expired_locked()     → None                      │
│  - new_conversation_id()       → str (static)              │
└─────────────────────────────────────────────────────────────┘
```

**Ciclo de vida**:
1. Cliente chama `append_result()` passando `conversation_id`, `tenant_id`, `user_id`, pergunta e resultado do orquestrador
2. Store cria `ConversationKey` (identificador único) e `ConversationTurn` (metadados)
3. Store persiste turno em memória, respeitando limite de max_turns
4. Durante `list_turns()`, store limpa conversas expiradas (TTL check)
5. Ao atingir TTL, conversa inteira é removida da memória

**Garantias**:
- Thread-safe (lock de leitura/escrita)
- Isolamento entre conversation_id/tenant_id/user_id
- Sem persistência de dados sensíveis

#### 2. `ContextExtractor`

**Classe responsável**: Extrai entidades concretas de turnos anteriores e gera instruções estruturadas.

```
┌─────────────────────────────────────────────────────────────┐
│         ContextExtractor                                    │
├─────────────────────────────────────────────────────────────┤
│ Atributos:                                                  │
│  - _DIMENSION_KEYWORDS: Dict[str, Tuple[str, ...]]          │
│    • produto: ("produto", "produtos", "sku", ...)         │
│    • regiao: ("regiao", "regioes", "estado", ...)         │
│    • cliente: ("cliente", "clientes", ...)                │
│    • pedido: ("pedido", "pedidos", ...)                   │
│    • ticket: ("ticket", "tickets", "chamado", ...)        │
│  - _executor: QueryExecutor                               │
├─────────────────────────────────────────────────────────────┤
│ Métodos Públicos:                                           │
│  - extract_referenced_entities(turn, conn) → Dict | None   │
│  - should_reuse_previous_context(...) → bool               │
│  - build_context_instruction(...) → str                    │
├─────────────────────────────────────────────────────────────┤
│ Métodos Privados:                                           │
│  - _detect_referencing_pattern(question) → (str, bool)    │
│  - _extract_dimension_groups(text) → Set[str]             │
│  - _select_filter_values(...) → (str | None, List[str])   │
│  - _normalize_text(text) → str (Unicode normalization)    │
└─────────────────────────────────────────────────────────────┘
```

**Fluxo de extração**:

```
Turno anterior (question, sql, ...)
         ↓
[SQL válido?] → Não → return None
         ↓ Sim
[Executar SQL contra conn]
         ↓
[Extrair colunas e linhas]
         ↓
[Encontrar id_* ou coluna segura para filtro]
         ↓
[Amostragem: excluir colunas sensíveis]
         ↓
return {
  "ids": [...],
  "id_column": "id_produto",
  "filter_column": "nome_produto",
  "columns": [...],
  "safe_columns": [...],
  "row_count": N,
  "sample_rows": [...]
}
```

#### 3. Construção de Prompts com Memória

**Funções responsáveis**:
- `build_question_with_memory(question, turns, max_turns=3)` → str
- `build_question_with_memory_and_context(question, turns, conn=None, max_turns=3)` → str

```
build_question_with_memory_and_context(
  question="Qual desses vendeu mais?",
  turns=[...histórico...],
  conn=sqlite3.Connection
)
    ↓
[Extrair últimos N turnos com SQL]
    ↓
[ContextExtractor.extract_referenced_entities(last_sql_turn, conn)]
    ↓
[Detectar mudança de dimensão com should_reuse_previous_context]
    ↓
[Montar bloco de contexto com exemplos de linhas]
    ↓
[Chamar build_context_instruction() se houver dependência]
    ↓
[Combinar com format_question_with_conversational_memory]
    ↓
return "# CONTEXTO...\n\n[turnos]...\n\n# INSTRUÇÃO CRÍTICA...\n\n# PERGUNTA ATUAL\n..."
```

#### 4. Estratégia de Prompts Conversacionais

**Arquivo**: `app/prompts/conversational_memory_prompt.py`

Contém:
- **Prefixo fixo** (`MEMORY_CONVERSATIONAL_PREFIX`): Regras gerais de reutilização de contexto, preservação de métrica/granularidade, resoluação de pronominais
- **Pipelines específicas** (condicionadas à detecção de padrão):
  - `FOLLOWUP_DEMONSTRATIVE_PIPELINE`: Para "esses", "daqueles" → reutilize SQL com mesmos JOINs/WHERE
  - `FOLLOWUP_TEMPORAL_PIPELINE`: Para "últimos 3 meses" → reaproveite métrica, ajuste apenas período
  - `FOLLOWUP_IMPLICIT_CONTEXT_OPERATION_PIPELINE`: Para "Qual vendeu mais?" → forneça escopo da operação

**Função de formatação**:
```python
format_question_with_conversational_memory(
    context="[TURNO ANTERIOR 1: ...]",
    question="[PERGUNTA ATUAL]"
) → str
```

Seleciona qual pipeline aplicar com base em heurísticas simples (regex PT-BR).

## Fluxo de Dados

### Cenário 1: Pergunta com Pronome Demonstrativo (Referência Explícita)

```
TURNO 1
├─ Pergunta: "Quais foram os 2 produtos mais vendidos?"
├─ SQL executado: SELECT ... FROM products ORDER BY vendas DESC LIMIT 2
├─ Resultado: id_produto=[1, 2]
└─ Armazenado no Store

TURNO 2 (PROCESSAMENTO)
├─ Pergunta: "Qual desses tem a melhor avaliação?"
│
├─ [1. Recuperar turnos anteriores]
│   └─ turns = store.list_turns(conversation_id, tenant_id, user_id)
│
├─ [2. Extrair contexto do último SQL]
│   ├─ last_sql_turn = turns[-1]
│   ├─ extractor.extract_referenced_entities(last_sql_turn, conn)
│   └─ entities = {
│       "ids": ["1", "2"],
│       "id_column": "id_produto",
│       "row_count": 2,
│       ...
│     }
│
├─ [3. Detectar padrão de referência]
│   ├─ pattern = "demonstrative" (detecta "desses")
│   └─ reuse_context = True
│
├─ [4. Construir prompt com memória + instrução]
│   ├─ build_question_with_memory_and_context()
│   ├─ build_context_instruction(entities, question)
│   └─ prompt_final = """
│       # CONTEXTO CONVERSACIONAL...
│       Turno anterior 1:
│       - Pergunta: Quais foram os 2 produtos mais vendidos?
│       - SQL aprovado: SELECT ... LIMIT 2
│       - Resultados: 2 itens retornados
│
│       # ⚠️ INSTRUÇÃO CRÍTICA: CONTEXTO ANTERIOR DEVE SER FILTRADO
│       ...
│       WHERE id_produto IN ('1', '2')
│       ...
│       """
│
└─ [5. Enviar ao SQL Generator com pergunta enriquecida]
   └─ orchestrator.ask(prompt_final, deps)
```

### Cenário 2: Mudança de Dimensão Sem Pronome (Referência Implícita)

```
TURNO 1
├─ Pergunta: "Quais foram os 2 produtos mais vendidos?"
├─ SQL executado: SELECT ... FROM produtos WHERE ... ORDER BY vendas
├─ Resultado: produtos=[Monitor, Smartphone]
└─ Armazenado

TURNO 2 (PROCESSAMENTO)
├─ Pergunta: "Qual das regiões possui a maior quantidade de vendas"
│
├─ [1. Recuperar e extrair entidades do turno 1]
│   └─ entities contém produtos (Monitor, Smartphone)
│
├─ [2. Detectar mudança de dimensão]
│   ├─ current_groups = extract_dimension_groups("regioes") → {"regiao"}
│   ├─ previous_groups = extract_dimension_groups("produtos") → {"produto"}
│   ├─ should_reuse = current_groups.isdisjoint(previous_groups) → False
│   └─ Decision: NÃO reusar contexto (mudança de dimensão clara)
│
├─ [3. build_context_instruction retorna ""]
│   └─ Sem instrução crítica injetada (evita aplicar filtro de produto em query de região)
│
└─ [4. Pergunta normal sem força de contexto anterior]
   └─ orchestrator.ask(pergunta_simples, deps)
```

### Cenário 3: Refinamento Temporal (Mesma Métrica, Novo Período)

```
TURNO 1
├─ Pergunta: "Receita total por região no mês passado"
├─ SQL: SELECT regiao, SUM(receita) FROM ... WHERE mes=X GROUP BY regiao
├─ Resultado: 5 regiões
└─ Armazenado

TURNO 2 (PROCESSAMENTO)
├─ Pergunta: "Últimos 3 meses"
│
├─ [1. Detectar refinamento temporal]
│   ├─ _looks_temporal_only_followup("Últimos 3 meses") → True
│   ├─ context é não-vazio (há turno anterior)
│   └─ Aplica FOLLOWUP_TEMPORAL_PIPELINE
│
├─ [2. Reaplicar lógica do turno anterior com novo período]
│   ├─ Métrica: Continua SUM(receita) por região
│   ├─ Granularidade: Continua regional
│   └─ Alteração: WHERE mes IN (X-2, X-1, X)
│
└─ [3. Resultado esperado]
   └─ Mesma estrutura, 3 períodos em vez de 1
```

## Integração com Outros Módulos

### Entrada: `OrchestratorResult`

Provém do `app/agents/orchestrator.py`:

```python
@dataclass
class OrchestratorResult:
    sql: str | None           # SQL gerado
    interpretation: str       # Interpretação da pergunta
    reasoning: List[str]      # Passos de raciocínio
    assumptions: List[str]    # Premissas usadas
    error: str | None         # Erro se houver
    error_kind: str | None    # Categoria de erro
    explanation: str          # Explicação (NÃO persistida)
```

Store extrai apenas campos necessários e segue para `ConversationTurn`.

### Saída: Prompt Enriquecido

Vai para `app/agents/sql_generator.py`:

```
Pergunta original: "Qual desses vendeu mais?"
                   ↓
[build_question_with_memory_and_context]
                   ↓
Pergunta enriquecida: """
# CONTEXTO CONVERSACIONAL...
Turno anterior 1:
- Pergunta: Quais produtos...
- SQL: SELECT id_produto... LIMIT 2
...

# ⚠️ INSTRUÇÃO CRÍTICA
WHERE id_produto IN (...)
...
"""
                   ↓
[SQL Generator LLM]
                   ↓
SQL gerado com filtro corretamente aplicado
```

### Banco de Dados

- **Leitura**: Executa SQL do turno anterior com `sqlite3.Connection` para extrair dados concretos
- **Sem escrita**: Módulo não altera dados; apenas consulta resultados anteriores

## Prompt Engineering e Anti-Hallucination

### Estratégia de Injeção de Contexto

#### 1. **Prefixo Fixo (Sempre Incluído)**

```markdown
# CONTEXTO CONVERSACIONAL SEGURO

Use o contexto abaixo apenas para resolver referências do usuário,
como 'e no mês anterior?' ou 'faça o mesmo para outro período'.
Não copie SQL sem revalidar e não assuma dados que não estejam no schema.

# REGRAS PARA FOLLOW-UP ANALÍTICO

- Se a pergunta atual pedir maior, menor, top, ranking ou comparação sobre
  um resultado agregado anterior, preserve a MESMA MÉTRICA e granularidade.
- Não ordene linhas brutas quando anterior calculou totais com SUM, COUNT, AVG.
- Reutilize aliases e definições aprovadas quando fizer sentido.

# REFERÊNCIAS PRONOMINAIS E DEMONSTRATIVOS

- Se usar "esses", "essas", "aqueles", "isso", resolva pelo turno anterior.
- Exemplo: após COUNT com filtro em coluna X, "quem são esses" pede linhas
  detalhadas com o MESMO filtro em X.
```

#### 2. **Pipeline Condicional (Conforme Padrão Detectado)**

**Para demonstrativo ("esses", "daqueles")**:
```markdown
# RESOLUÇÃO OBRIGATÓRIA (PIPELINE)

Esta rodada foi detectada como follow-up com demonstrativo.
Reutilize os MESMOS JOINs, predicados WHERE, e objetos do turno anterior.
Ajuste apenas o SELECT para listar linhas detalhadas.
É PROIBIDO retornar InvalidRequest neste caso.
```

**Para temporal ("últimos 3 meses")**:
```markdown
# RESOLUÇÃO OBRIGATÓRIA (PERÍODO)

Reabrã a intenção do turno anterior e incorpore o novo intervalo.
MANDATÓRIO: Use EXATAMENTE a MESMA MÉTRICA, LÓGICA e AGREGAÇÃO.
MANDATÓRIO: Respeite pluralidade (se era "Quais", retorne TODOS).
É PROIBIDO retornar InvalidRequest por vagueza.
```

**Para operação implícita ("Qual vendeu mais?")**:
```markdown
# RESOLUÇÃO OBRIGATÓRIA (OPERAÇÃO SOBRE RESULTADOS ANTERIORES)

Pergunta pede métrica/ranking/comparação sobre conjunto anterior.
Use o conjunto como escopo OBRIGATÓRIO.
Se houver IDs/nomes, filtre com IN antes de calcular nova métrica.
Mapeamentos:
- "melhor avaliado": use AVG(nota_produto) filtrando produtos anteriores
- "vendeu mais": use SUM(quantidade) com status='Aprovado'
- "maior receita": use SUM(valor_total)
```

#### 3. **Instrução Crítica com Exemplos SQL Concretos**

Gerada por `build_context_instruction()`:

```markdown
# ⚠️ INSTRUÇÃO CRÍTICA: CONTEXTO ANTERIOR DEVE SER FILTRADO

## Fatos sobre a pergunta anterior:
- Pergunta: Quais foram os 2 produtos mais vendidos?
- Resultado: 2 itens retornado(s)
- Exemplos de id_produto: '1', '2'

## Regra obrigatória para esta pergunta:
VOCÊ DEVE incorporar um filtro WHERE neste formato:

```sql
SELECT ... FROM ...
WHERE id_produto IN ('1', '2')
  AND ... -- outros filtros, se necessário
```

## Exemplos de como aplicar corretamente:

❌ ERRADO (ignorou os IDs anteriores):
   SELECT * FROM gold_produtos ORDER BY nota_media DESC LIMIT 1;

✓ CORRETO (filtrou pelos IDs anteriores):
   SELECT * FROM gold_produtos WHERE id_produto IN ('1', '2') 
   ORDER BY nota_media DESC LIMIT 1;
```

### Mecanismos Anti-Alucinação

| Mecanismo | Implementação | Objetivo |
|-----------|---------------|----------|
| **Detecção de Padrão** | Regex PT-BR para "desses", "qual das", etc. | Evitar aplicação aleatória de contexto |
| **Disjoint Check** | `current_groups.isdisjoint(previous_groups)` | Detectar mudança de dimensão, não forçar contexto |
| **Limite de Exemplos** | Máximo 20 valores de filtro no prompt | Evitar prompt excessivo |
| **Normalização Unicode** | NFKD + remoção de diacríticos | Compatibilidade PT-BR robusta |
| **Prefixo de Prioridade** | "VOCÊ DEVE", "PROIBIDO" em caps | Ênfase em instruções críticas |
| **Exemplos de SQL** | ❌ ERRADO vs ✓ CORRETO side-by-side | Clarity para LLM |

## Validações e Regras

### Validações de Entrada

| Campo | Validação | Ação se Falhar |
|-------|-----------|---|
| `conversation_id` | Não vazio | Exception |
| `tenant_id` | Pode ser None | Permitido (pública) |
| `user_id` | Pode ser None | Permitido (genérico) |
| `question` | Não vazio | Exception |
| `result` | OrchestratorResult válido | Exception |
| SQL anterior | Executa contra conn | Return None (soft fail) |

### Validações de Lógica

1. **TTL Expiração**: Conversas expiram automaticamente
2. **Max Turns**: Mantém apenas últimos N turnos
3. **Isolamento Multi-tenant**: Conversation_id + tenant_id + user_id é chave composta
4. **Sem PII Persistido**: Filtra colunas sensíveis na amostragem
5. **Dimension Check**: Valida mudança de dimensão antes de forçar contexto

## Considerações de Segurança

### 1. Isolamento de Dados

- ✅ **Conversation key composta** (conversation_id + tenant_id + user_id)
- ✅ **Thread-safe** com RLock
- ✅ **TTL automático** evita acúmulo indefinido
- ⚠️ **Em memória apenas**: Perda em restart; não é persistente

### 2. Proteção contra PII

- ✅ **Sem armazenamento de linhas completas** (apenas IDs/nomes seguros)
- ✅ **Filtragem de colunas sensíveis** (email, telefone, cpf, senha, token)
- ✅ **Amostragem limitada** (primeiras 3 linhas apenas)
- ⚠️ **Pergunta armazenada pode conter PII**: Assunção que PII em pergunta é raro em produção

### 3. Injeção de SQL

- ✅ **SQL anterior executado com read-only** (pode replicar para servidor separado)
- ✅ **Valores de filtro escapados** com `replace("'", "''")`
- ✅ **IN (...) vs concatenação**: Usa prepared-like pattern
- ⚠️ **Responsabilidade**: Executor deve validar SQL antes de executar

### 4. Segurança de Prompts

- ✅ **Instruções em caps** ("VOCÊ DEVE", "PROIBIDO") para saliência
- ✅ **Exemplos side-by-side** (errado vs correto)
- ✅ **Limitação de tamanho** (máximo 20 valores no IN)
- ⚠️ **LLM pode ainda ignorar**: Mitigação é feedback em cadeia, não garantia absoluta

## Observabilidade

### Logs Disponíveis

O módulo não emite logs diretos. Recomendações de integração:

```python
# No Store:
logger.debug(f"Appended turn to {conversation_id}:{tenant_id}:{user_id}")
logger.debug(f"Pruned {count} expired conversations")

# No ContextExtractor:
logger.debug(f"Extracted {len(entities['ids'])} IDs from previous SQL")
logger.debug(f"Dimension change detected: {previous_dims} → {current_dims}")
logger.debug(f"Pattern type: {pattern_type} (is_referencing={is_ref})")

# No Prompt Builder:
logger.debug(f"Instruction length: {len(instruction)} chars")
logger.debug(f"Context reuse decision: {should_reuse}")
```

### Métricas Sugeridas

- `conversation_store.turns_appended` (Counter)
- `conversation_store.conversations_expired` (Counter)
- `conversation_store.store_size` (Gauge) → `len(self._items)`
- `context_extractor.entities_extracted` (Counter)
- `context_extractor.dimension_changes_detected` (Counter)
- `prompt_builder.instruction_length` (Histogram)

### Tracing

Para aplicações com OpenTelemetry:

```python
# Build question with memory
with tracer.start_as_current_span("build_question_with_memory") as span:
    span.set_attribute("conversation_id", conversation_id)
    span.set_attribute("num_previous_turns", len(turns))
    span.set_attribute("extracted_entities", len(entities.get("ids", [])))
    result = build_question_with_memory_and_context(...)
```

## Limitações e Problemas Conhecidos

### 1. Volatilidade da Memória

- **Problema**: Armazenamento em memória é perdido em reinicializações
- **Impacto**: Conversas ativas interrompem midway
- **Mitigação**: Possível adicionar Redis backend com mesma interface
- **Trade-off**: Performance vs. persistência

### 2. Heurísticas PT-BR Limitadas

- **Problema**: Regex para detectar pronominais ("desses", "daqueles") pode falhar em variações regionais
- **Exemplo**: "Quais daquele cinco?" (typo) não seria detectado
- **Impacto**: Contexto anterior não injetado quando deveria
- **Mitigação**: Treinar modelo de classificação ao invés de regex

### 3. Detecção de Dimensão sem Semântica Profunda

- **Problema**: `_extract_dimension_groups()` usa keywords simples, não semântica de schema
- **Exemplo**: Se coluna é `categoria_produto`, palavra "categoria" pode causar falso positivo
- **Impacto**: Contexto anterior pode ser rejeitado incorretamente
- **Mitigação**: Integrar com schema_registry para semântica real

### 4. Instrução Crítica Pode Conflitar com Intenção Real

- **Problema**: Se usuário muda legitimamente de dimensão, instrução força contexto anterior
- **Exemplo**: "Top 2 produtos, agora qual a melhor região?" → Instrução força produto mesmo que queira região
- **Impacto**: SQL gerado pode estar incorreto
- **Mitigação**: `should_reuse_previous_context()` tenta detectar, mas é heurística

### 5. Escalabilidade de Armazenamento

- **Problema**: Dict em memória escalável apenas para ~1000 conversas simultâneas
- **Impacto**: Em produção com alta concorrência, pode saturar memória
- **Mitigação**: Implementar backend distribuído (Redis, DynamoDB)

### 6. Limites do LLM em Seguir Instruções

- **Problema**: Mesmo com "VOCÊ DEVE" em caps, LLM pode ignorar instrução crítica
- **Impacto**: InvalidRequest ou SQL incorreto apesar de contexto perfeito
- **Mitigação**: Validação pós-LLM, retentativas com ajuste de temperatura

## Extensões e Melhorias Futuras

### 1. Backend Persistente

```python
# Permitir plugabilidade de storage:
class ConversationStore(ABC):
    @abstractmethod
    def append_turn(self, key: ConversationKey, turn: ConversationTurn): pass
    
    @abstractmethod
    def list_turns(self, key: ConversationKey) -> List[ConversationTurn]: pass

class InMemoryConversationStore(ConversationStore):
    # Implementação atual
    
class RedisConversationStore(ConversationStore):
    # Usar Redis como backend
    # Vantagem: Compartilhado entre processos
    # Desvantagem: Latência de rede
```

### 2. Detecção de Padrão com ML

```python
# Usar modelo fine-tuned ao invés de regex:
class LLMPatternDetector:
    def detect(self, question: str, context: str) -> Tuple[str, float]:
        # Retorna (tipo, confidence)
        # Treinado em dataset PT-BR de segmentação
```

### 3. Integração com Schema Registry

```python
# Usar metadados reais do schema:
class SchemaAwareContextExtractor(ContextExtractor):
    def __init__(self, schema_registry: SchemaRegistry):
        self.schema = schema_registry
    
    def _extract_dimension_groups(self, text: str) -> Set[str]:
        # Usar schema.get_columns(), schema.get_dimension_tables()
        # em vez de keywords fixas
```

### 4. Histórico Persistente com Auditoria

```python
# Log completo de conversas (sem PII):
class AuditableConversationStore:
    def append_turn(self, ...):
        super().append_turn(...)
        self._log_audit(
            timestamp=now(),
            conversation_id=key.conversation_id,
            tenant_id=key.tenant_id,
            action="append_turn",
            question=turn.question[:50],  # Primeiros 50 chars
            sql_hash=hash(turn.sql),
            error=turn.error
        )
```

### 5. Adaptive Context Window

```python
# Ajustar dinamicamente quantos turnos manter conforme token budget:
class AdaptiveConversationStore:
    def __init__(self, max_context_tokens: int = 4000):
        self.max_tokens = max_context_tokens
    
    def get_context_for_question(self, turns: List[ConversationTurn], 
                                 new_question: str) -> List[ConversationTurn]:
        # Seleciona turnos relevantes mantendo < max_tokens
        # Prioriza: últimos turnos com SQL > turnos com erro
```

### 6. Cross-Conversation Context (Modo Aprendizado)

```python
# Permitir reusar contexto de outras conversas do mesmo usuário (opt-in):
class CrossConversationContextExtractor:
    def extract_from_user_history(self, user_id: str) -> Dict:
        # Padrões comuns de pergunta
        # Dimensões mais frequentes para este usuário
        # Filtros recorrentes
```

### 7. Validation Post-LLM

```python
# Validar SQL gerado contra instruções injetadas:
class ContextValidation:
    def validate(self, sql: str, instruction: str) -> bool:
        """
        Verifica se SQL contém obrigatoriamente:
        - WHERE id_produto IN (...) se instrução exigia
        - Mesma métrica se instrução temporal
        """
        if "WHERE id_produto IN" in instruction:
            return "WHERE" in sql and "IN" in sql
```

## Referências de Código

### Arquivos Principais

| Arquivo | Responsabilidade | Linhas |
|---------|-----------------|--------|
| `conversation_store.py` | Store em memória | ~250 |
| `context_extractor.py` | Extrator de entidades | ~550 |
| `conversational_memory_prompt.py` | Estratégia de prompts | ~350 |
| `conversation.py` | Modelos de dados | ~40 |

### Testes Relacionados

| Teste | Cobertura |
|-------|-----------|
| `test_conversation_store.py` | Store isolação, TTL, max_turns |
| `test_context_extractor.py` | Extração de entidades, detecção de padrão |
| `test_dimension_change.py` | Cenário de mudança de dimensão |

## Glossário

| Termo | Definição |
|-------|-----------|
| **Turno** | Um par (pergunta, resultado) em uma conversa |
| **Conversation Key** | Tripla (conversation_id, tenant_id, user_id) que identifica conversa única |
| **Pronôme Demonstrativo** | Palavras como "esses", "daqueles", "aqueles" que referenciam turno anterior |
| **Dimensão** | Entidade em BI (produto, região, cliente, pedido, ticket) |
| **Mudança de Dimensão** | Transição entre dimensões diferentes entre turnos |
| **Contexto Reuso** | Decisão de aplicar (ou não) informações do turno anterior |
| **TTL** | Time-To-Live; tempo até conversas expirarem automaticamente |
| **Instrução Crítica** | Bloco de texto injetado no prompt com regras obrigatórias para LLM |

---

**Versão**: 1.0  
**Última Atualização**: Mai 2026  
**Autor**: limaraujo 
