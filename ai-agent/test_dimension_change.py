#!/usr/bin/env python3
"""
Teste para debugar problema: mudança de dimensão entre turnos
(produtos → regiões) sem pronomes demonstrativos.

Problema observado:
- Turno 1: "Quais foram os 2 produtos mais vendidos?" → SUCCESS
- Turno 2: "Qual das regiões possui..." → InvalidRequest

Causa provável: O agente LLM não consegue conectar mudança de dimensão
sem pronome demonstrativo, e tenta aplicar filtro de produto em consulta de região.
"""

import asyncio
import sqlite3
from pathlib import Path

from app.agents.orchestrator import AgentOrchestrator
from app.database.mock_gold import ensure_mock_sqlite
from app.models.deps import Deps
from app.memory.conversation_store import (
    InMemoryConversationStore,
    build_question_with_memory_and_context,
)
from app.models.conversation import ConversationTurn


import pytest

@pytest.mark.asyncio
async def test_dimension_change():
    """Reproduz o fluxo: produtos → regiões com mudança de dimensão."""
    
    mock_path = ensure_mock_sqlite()
    conn = sqlite3.connect(mock_path)
    store = InMemoryConversationStore()
    orchestrator = AgentOrchestrator(debug=True)
    
    conversation_id = store.new_conversation_id()
    
    print("\n" + "="*80)
    print("TURNO 1: Produtos mais vendidos")
    print("="*80)
    
    # Turno 1: Pergunta sobre produtos
    question1 = "Quais foram os 2 produtos mais vendidos do último mês?"
    
    deps = Deps(
        conn=conn,
        conversation_id=conversation_id,
        user_id="test-user",
        tenant_id="test-tenant",
    )
    
    result1 = await orchestrator.ask(question1, deps)
    print(f"\n✓ Turno 1 resultado: {result1.error_kind or 'SUCCESS'}")
    if result1.explanation:
        print(f"Explicação: {result1.explanation[:200]}...")
    
    # Armazena o turno
    store.append_result(
        conversation_id=conversation_id,
        tenant_id="test-tenant",
        user_id="test-user",
        question=question1,
        result=result1,
    )
    
    print("\n" + "="*80)
    print("TURNO 2: Regiões com maiores vendas (MUDANÇA DE DIMENSÃO)")
    print("="*80)
    
    # Turno 2: Pergunta sobre regiões (mudança de dimensão)
    question2 = "Qual das regiões possui a maior quantidade de vendas dos ultimos 30 dias"
    
    # Carrega turnos anteriores
    previous_turns = store.list_turns(
        conversation_id=conversation_id,
        tenant_id="test-tenant",
        user_id="test-user",
    )
    
    # Monta pergunta com contexto
    question2_with_context = build_question_with_memory_and_context(
        question2,
        previous_turns,
        conn=conn,
    )
    
    print("\n--- PERGUNTA COM CONTEXTO INJETADO ---")
    print(question2_with_context[:600] + "..." if len(question2_with_context) > 600 else question2_with_context)
    
    print("\n--- EXECUTANDO TURNO 2 ---")
    result2 = await orchestrator.ask(question2_with_context, deps)
    
    print(f"\n✗ Turno 2 resultado: {result2.error_kind or 'SUCCESS'}")
    if result2.explanation:
        print(f"Explicação: {result2.explanation[:500]}")
    
    # Análise
    print("\n" + "="*80)
    print("DIAGNÓSTICO")
    print("="*80)
    print(f"Turno 1: {'✓ SUCESSO' if not result1.error_kind else '✗ ERRO'}")
    print(f"Turno 2: {'✓ SUCESSO' if not result2.error_kind else '✗ ERRO: ' + (result2.error_kind or '')}")
    
    if result2.error_kind == "invalid_request":
        print(f"\nErro do LLM: {result2.error[:300]}")
        print("\n⚠️ PROBLEMA: O LLM rejeitou porque não conseguiu conectar a mudança de dimensão.")
        print("   A pergunta é sobre 'regiões' mas o turno anterior foi sobre 'produtos'.")
        print("   Sem um pronome demonstrativo, o sistema não injetar a instrução de contexto.")
    
    conn.close()


if __name__ == "__main__":
    asyncio.run(test_dimension_change())
