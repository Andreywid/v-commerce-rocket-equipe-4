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

4. Gere SQL final seguro
"""