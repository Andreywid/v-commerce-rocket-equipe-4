from datetime import datetime

# ============================================
# PROMPT BUILDER
# ============================================

def build_prompt(
    question: str,
    schema: str,
    examples: list[str],
    values: list[str],
    current_date: datetime,
) -> str:
    current_date = current_date.strftime("%Y-%m-%d")

    examples_text = "\n\n".join(examples)

    values_text = "\n".join(
        f"- {v}" for v in values
    )

    return f"""
# DATABASE SCHEMA

{schema}

# VALUE EXAMPLES

{values_text}

# FEW SHOT EXAMPLES

{examples_text} 

# USER QUESTION

{question}

# CURRENT DATE

{current_date}

# NOVO:
# Adicionada para controlar a saída do modelo.
# Aqui o agente deve gerar só SQL, porque quem explica o resultado ao usuário é o explainer.py.
# Isso evita que texto extra ou markdown quebre o validator/executor.
# OUTPUT FORMAT

Retorne apenas a query SQL final.
Não inclua explicações.
Não inclua markdown.
Não inclua ```sql.
Não inclua comentários fora do SQL.

# EXECUTION STRATEGY

Antes de gerar SQL:

1. Identifique:
   - entidades
   - métricas
   - filtros
   - agregações

2. Determine:
   - tabelas necessárias
   - joins necessários

3. Verifique:
   - se colunas existem
   - se joins fazem sentido
   - se SQL é PostgreSQL válido

   # NOVO:
   # Validações adicionadas para reforçar o uso correto do Schema Gold.
   - se filtros enum usam valores válidos
   - se métricas de média, taxa e percentual não foram somadas incorretamente
   - se a granularidade da tabela escolhida responde corretamente à pergunta

4. Gere SQL final seguro
"""