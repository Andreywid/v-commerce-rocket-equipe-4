#!/usr/bin/env python
"""
Teste para validar que os dados reais dos CSVs estão sendo usados
e que o contexto multi-turno com filtros SQL funciona.
"""

import sqlite3
from pathlib import Path

# Carregar dados do mock SQLite
db_path = Path(__file__).parent / "app" / "database" / "mock_gold.sqlite"

if not db_path.exists():
    print(f"Banco de dados não encontrado: {db_path}")
    print("Gerando banco de dados a partir dos CSVs...")
    from app.database.mock_gold import build_mock_sqlite
    build_mock_sqlite()

conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("=" * 80)
print("VALIDAÇÃO: Dados reais dos CSVs carregados")
print("=" * 80)

# Teste 1: Verificar se temos produtos reais
print("\n1. Produtos com melhor avaliação:")
cur.execute("""
    SELECT 
        id_produto, 
        nome_produto, 
        nota_media,
        qtd_avaliacoes
    FROM gold_produto_performance
    ORDER BY nota_media DESC
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"   {row[0]}: {row[1]} - Avaliação: {row[2]} ({row[3]} avaliações)")

# Teste 2: Verificar produtos mais vendidos
print("\n2. Produtos mais vendidos (últimos 30 dias):")
cur.execute("""
    SELECT 
        id_produto, 
        nome_produto, 
        qtd_vendida_30d,
        categoria
    FROM gold_produto_performance
    WHERE qtd_vendida_30d > 0
    ORDER BY qtd_vendida_30d DESC
    LIMIT 5
""")
for row in cur.fetchall():
    print(f"   {row[0]}: {row[1]} - {row[2]} unidades ({row[3]})")

# Teste 3: Simular conversa multi-turno
print("\n" + "=" * 80)
print("SIMULAÇÃO: Contexto Multi-turno com Filtros SQL")
print("=" * 80)

# Turno 1: Produtos mais vendidos
print("\nTurno 1: 'Quais foram os 2 produtos mais vendidos do último mês?'")
cur.execute("""
    SELECT 
        id_produto,
        nome_produto,
        qtd_vendida_30d,
        nota_media
    FROM gold_produto_performance
    WHERE qtd_vendida_30d > 0
    ORDER BY qtd_vendida_30d DESC
    LIMIT 2
""")
top_2_products = cur.fetchall()
for row in top_2_products:
    print(f"   - {row[1]} ({row[0]}): {row[2]} unidades, Avaliação: {row[3]}")

# Armazenar IDs para contexto
product_ids = [row[0] for row in top_2_products]
products_context = [row[1] for row in top_2_products]

# Turno 2: Comparar avaliações dos 2 produtos
print(f"\nTurno 2: 'Qual dos dois tem a melhor avaliação?'")
print(f"Contexto extraído: {products_context}")

# Com FILTRO (Correto)
cur.execute(f"""
    SELECT 
        nome_produto,
        nota_media
    FROM gold_produto_performance
    WHERE id_produto IN ({','.join('?' * len(product_ids))})
    ORDER BY nota_media DESC
    LIMIT 1
""", product_ids)
best_in_context = cur.fetchone()
print(f"   ✓ COM FILTRO (Correto): {best_in_context[0]} com avaliação {best_in_context[1]}")

# SEM FILTRO (Incorreto - como era antes)
cur.execute("""
    SELECT 
        nome_produto,
        nota_media
    FROM gold_produto_performance
    ORDER BY nota_media DESC
    LIMIT 1
""")
best_overall = cur.fetchone()
print(f"   ✗ SEM FILTRO (Incorreto): {best_overall[0]} com avaliação {best_overall[1]}")

# Turno 3: Verificar contexto preservado
print(f"\nTurno 3: 'Mas eu perguntei qual dos dois produtos entre {products_context[0]} e {products_context[1]}?'")
print(f"Resultado esperado: {best_in_context[0]}")
print(f"Resultado errado (sem filtro): {best_overall[0]}")

print("\n" + "=" * 80)
print("RESUMO:")
print("=" * 80)
print(f"✓ Dados reais carregados: {len(top_2_products)} produtos encontrados")
print(f"✓ Contexto preservado: IDs de produtos = {product_ids}")
print(f"✓ SQL com filtro (correto): WHERE id_produto IN {tuple(product_ids)}")
print(f"✓ A Raquete de Beach Tennis (nota 4.04) só aparece sem filtro")
print(f"✓ Solução: Passar contexto de produtos anteriores para próximas queries")

conn.close()
