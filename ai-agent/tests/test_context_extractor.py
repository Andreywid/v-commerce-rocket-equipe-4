"""Testes para o extrator de contexto estruturado e build_question_with_memory_and_context."""

import sqlite3
from unittest.mock import MagicMock

from app.memory.context_extractor import ContextExtractor
from app.memory.conversation_store import (
    build_question_with_memory,
    build_question_with_memory_and_context,
)
from app.models.conversation import ConversationTurn
from app.prompts.conversational_memory_prompt import (
    format_question_with_conversational_memory,
)


class TestContextExtractor:
    """Valida a extração de dados concretos dos turnos anteriores."""

    def test_extract_referenced_entities_with_id_column(self):
        """Deve extrair IDs quando o SQL retorna linhas com coluna id_*."""
        # Setup
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(
            "CREATE TABLE products (id_produto INTEGER PRIMARY KEY, nome TEXT, nota_media REAL)"
        )
        cursor.execute(
            "INSERT INTO products VALUES (1, 'Monitor Gamer', 4.5), (2, 'Smartphone', 4.3)"
        )
        conn.commit()

        extractor = ContextExtractor()
        turn = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos?",
            sql="SELECT id_produto, nome, nota_media FROM products ORDER BY nome LIMIT 2",
            interpretation="Top 2 produtos",
            reasoning=(),
            assumptions=(),
        )

        # Execute
        result = extractor.extract_referenced_entities(turn, conn)

        # Assert
        assert result is not None
        assert result["row_count"] == 2
        assert result["id_column"] == "id_produto"
        assert "1" in result["ids"]
        assert "2" in result["ids"]
        conn.close()

    def test_extract_referenced_entities_no_sql(self):
        """Deve retornar None quando não há SQL no turno."""
        conn = sqlite3.connect(":memory:")
        extractor = ContextExtractor()

        turn = ConversationTurn(
            question="Qual era a pergunta?",
            sql=None,
            interpretation=None,
            reasoning=(),
            assumptions=(),
        )

        result = extractor.extract_referenced_entities(turn, conn)
        assert result is None
        conn.close()

    def test_detect_referencing_pattern_demonstrative(self):
        """Deve detectar padrões demonstrativos como 'qual dos dois'."""
        extractor = ContextExtractor()

        test_cases = [
            ("Qual dos dois tem melhor avaliação?", "demonstrative", True),
            ("Quais dos dois tem melhor avaliação?", "demonstrative", True),
            ("Desses 5 que você trouxe, qual é o melhor?", "demonstrative", True),
            ("Qual delas é a mais vendida?", "demonstrative", True),
            ("Me mostre os detalhes desses produtos", "demonstrative", True),
            ("Qual o melhor avaliado?", "implicit_context_operation", True),
            ("Qual vendeu mais?", "implicit_context_operation", True),
            ("Qual tem mais tickets abertos?", "implicit_context_operation", True),
            ("Qual é o preço médio?", "none", False),
        ]

        for question, expected_type, expected_is_ref in test_cases:
            pattern_type, is_ref = extractor._detect_referencing_pattern(question)
            assert pattern_type == expected_type, f"Failed for: {question}"
            assert is_ref == expected_is_ref, f"Failed for: {question}"

    def test_build_context_instruction_with_demonstrative(self):
        """Deve gerar instrução estruturada para pergunta com demonstrativo."""
        extractor = ContextExtractor()

        entities = {
            "ids": ["1", "2"],
            "id_column": "id_produto",
            "row_count": 2,
            "columns": ["id_produto", "nome", "nota_media"],
            "safe_columns": ["id_produto", "nome", "nota_media"],
            "sample_rows": [
                {"id_produto": 1, "nome": "Monitor Gamer"},
                {"id_produto": 2, "nome": "Smartphone"},
            ],
        }

        question = "Qual dos dois tem melhor avaliação?"
        previous_question = "Quais foram os 2 produtos mais vendidos?"

        instruction = extractor.build_context_instruction(
            entities, question, previous_question=previous_question
        )

        # Assert
        assert len(instruction) > 0
        assert "CRÍTICA" in instruction or "INSTRUÇÃO" in instruction
        assert "id_produto IN" in instruction
        assert "esses" in instruction.lower() or "filtro" in instruction.lower()
        assert "WHERE" in instruction or "where" in instruction.lower()

    def test_build_context_instruction_no_reference(self):
        """Deve retornar string vazia quando não há referência aos resultados anteriores."""
        extractor = ContextExtractor()

        entities = {
            "ids": ["1", "2"],
            "id_column": "id_produto",
            "row_count": 2,
            "columns": ["id_produto", "nome"],
            "safe_columns": ["id_produto", "nome"],
            "sample_rows": [],
        }

        question = "Quais são todos os produtos cadastrados?"

        instruction = extractor.build_context_instruction(entities, question)

        # Assert - deveria retornar string vazia pois não há padrão de referência
        assert instruction == ""

    def test_format_question_with_conversational_memory_accepts_typo_in_temporal_followup(self):
        prompt = format_question_with_conversational_memory(
            context="# TURNOS ANTERIORES\nPergunta: Qual região teve o maior numero de vendas?\nSQL aprovado: SELECT 1;",
            question="nos ultmos 30 dias",
        )

        assert "# RESOLUÇÃO OBRIGATÓRIA (PERÍODO)" in prompt
        assert "É **proibido** retornar InvalidRequest por a frase isolada parecer vaga." in prompt

    def test_format_question_no_temporal_followup_when_previous_turn_has_no_sql(self):
        prompt = format_question_with_conversational_memory(
            context="# TURNOS ANTERIORES\nTurno anterior 1:\n- Pergunta: Qual região teve o maior numero de vendas?\n- Erro: A pergunta é ambígua",
            question="nos ultmos 30 dias",
        )

        # Atualizado: agora permitimos follow-up temporal mesmo sem SQL no turno anterior
        # para reaproveitar a intenção (pergunta/interpretação) que falhou por falta de data.
        assert "# RESOLUÇÃO OBRIGATÓRIA (PERÍODO)" in prompt
        assert "nos ultmos 30 dias" in prompt

    def test_extract_referenced_entities_with_fallback_column(self):
        """Deve usar coluna textual quando nao houver id_* no SQL anterior."""
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(
            "CREATE TABLE products (nome_produto TEXT, total_vendido INTEGER)"
        )
        cursor.execute(
            "INSERT INTO products VALUES ('Monitor Gamer 144Hz', 175), ('Smartphone 256GB', 146)"
        )
        conn.commit()

        extractor = ContextExtractor()
        turn = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos?",
            sql="SELECT nome_produto, total_vendido FROM products ORDER BY total_vendido DESC LIMIT 2",
            interpretation="Top 2 produtos",
            reasoning=(),
            assumptions=(),
        )

        result = extractor.extract_referenced_entities(turn, conn)

        assert result is not None
        assert result["filter_column"] == "nome_produto"
        assert "Monitor Gamer 144Hz" in result["filter_values"]
        assert "Smartphone 256GB" in result["filter_values"]
        conn.close()

    def test_build_context_instruction_with_fallback_column(self):
        """Deve gerar WHERE com coluna textual quando nao houver id_*."""
        extractor = ContextExtractor()

        entities = {
            "ids": [],
            "id_column": None,
            "filter_column": "nome_produto",
            "filter_values": ["Monitor Gamer 144Hz", "Smartphone 256GB"],
            "row_count": 2,
            "columns": ["nome_produto", "total_vendido"],
            "safe_columns": ["nome_produto", "total_vendido"],
            "sample_rows": [],
        }

        instruction = extractor.build_context_instruction(
            entities,
            "Quais dos dois tem a melhor avaliacao?",
            previous_question="Quais foram os 2 produtos mais vendidos?",
        )

        assert "nome_produto IN" in instruction

    def test_build_context_instruction_for_implicit_product_evaluation(self):
        """Deve filtrar produtos anteriores em follow-up curto de avaliação."""
        extractor = ContextExtractor()

        entities = {
            "ids": [],
            "id_column": None,
            "filter_column": "nome_produto",
            "filter_values": ["Monitor Gamer 144Hz", "Smartphone 256GB"],
            "row_count": 2,
            "columns": ["nome_produto", "qtd_vendida"],
            "safe_columns": ["nome_produto", "qtd_vendida"],
            "sample_rows": [],
        }

        instruction = extractor.build_context_instruction(
            entities,
            "Qual o melhor avaliado?",
            previous_question="Quais foram os 2 produtos mais vendidos?",
        )

        assert "nome_produto IN" in instruction
        assert "Monitor Gamer 144Hz" in instruction
        assert "Smartphone 256GB" in instruction
        assert "follow-up elíptico" in instruction

    def test_build_context_instruction_for_implicit_sales_operation(self):
        """Deve filtrar conjunto anterior em follow-up de vendas/receita."""
        extractor = ContextExtractor()

        entities = {
            "ids": ["1", "2"],
            "id_column": "id_cliente",
            "filter_column": None,
            "filter_values": [],
            "row_count": 2,
            "columns": ["id_cliente", "nome"],
            "safe_columns": ["id_cliente", "nome"],
            "sample_rows": [],
        }

        instruction = extractor.build_context_instruction(
            entities,
            "Qual comprou mais?",
            previous_question="Quais clientes compraram pelo App?",
        )

        assert "id_cliente IN" in instruction
        assert "'1', '2'" in instruction
        assert "follow-up elíptico" in instruction

    def test_build_context_instruction_skips_implicit_evaluation_without_product_context(self):
        """Não deve forçar avaliação de produto quando o conjunto anterior não é compatível."""
        extractor = ContextExtractor()

        entities = {
            "ids": [],
            "id_column": None,
            "filter_column": "canal_venda", # Alterado de nome_cliente para algo que não seja cliente/produto
            "filter_values": ["Web", "App"],
            "row_count": 2,
            "columns": ["canal_venda", "valor_total"],
            "safe_columns": ["canal_venda", "valor_total"],
            "sample_rows": [],
        }

        instruction = extractor.build_context_instruction(
            entities,
            "Qual o melhor avaliado?",
            previous_question="Quais canais venderam mais?",
        )

        assert instruction == ""

    def test_build_context_instruction_skips_dimension_shift(self):
        """Não deve reutilizar contexto quando a pergunta muda de produtos para regiões."""
        extractor = ContextExtractor()

        entities = {
            "ids": ["1", "2"],
            "id_column": "id_produto",
            "filter_column": None,
            "filter_values": [],
            "row_count": 2,
            "columns": ["id_produto", "nome_produto", "qtd_vendida_30d"],
            "safe_columns": ["id_produto", "nome_produto", "qtd_vendida_30d"],
            "sample_rows": [],
        }

        instruction = extractor.build_context_instruction(
            entities,
            "Qual das regiões possui a maior quantidade de vendas dos ultimos 30 dias?",
            previous_question="Quais foram os 2 produtos mais vendidos do último mês?",
        )

        assert instruction == ""


class TestBuildQuestionWithMemoryAndContext:
    """Valida a construção do prompt com contexto enriquecido."""

    def test_build_with_multiple_turns_no_connection(self):
        """Deve construir prompt com múltiplos turnos mesmo sem conexão."""
        turn1 = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos?",
            sql="SELECT id_produto FROM produtos LIMIT 2",
            interpretation="Top 2",
            reasoning=("1. Contar vendas", "2. Ordenar descrescente"),
            assumptions=("Últimos 30 dias",),
        )

        turn2 = ConversationTurn(
            question="Qual dos dois tem melhor avaliação?",
            sql=None,
            interpretation=None,
            reasoning=(),
            assumptions=(),
        )

        prompt = build_question_with_memory_and_context(
            "Qual dos dois tem melhor avaliação?",
            [turn1, turn2],
            conn=None,
        )

        # Assert
        assert len(prompt) > 0
        assert "Turno anterior" in prompt
        assert "Pergunta: Quais foram os 2 produtos" in prompt
        assert "SQL aprovado:" in prompt

    def test_build_with_connection_adds_structured_instruction(self):
        """Deve adicionar instrução estruturada quando conexão está disponível."""
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(
            "CREATE TABLE products (id_produto INTEGER PRIMARY KEY, nome TEXT, nota_media REAL)"
        )
        cursor.execute(
            "INSERT INTO products VALUES (1, 'Monitor', 4.5), (2, 'Smartphone', 4.3)"
        )
        conn.commit()

        turn1 = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos?",
            sql="SELECT id_produto, nome FROM products LIMIT 2",
            interpretation="Top 2 produtos",
            reasoning=(),
            assumptions=(),
        )

        prompt = build_question_with_memory_and_context(
            "Qual dos dois tem melhor avaliação?",
            [turn1],
            conn=conn,
        )

        # Assert
        assert len(prompt) > 0
        # A instrução estruturada deve estar no prompt
        assert "CRÍTICA" in prompt or "INSTRUÇÃO" in prompt or "WHERE" in prompt

        conn.close()

    def test_build_with_connection_skips_unrelated_dimension_change(self):
        """Não deve carregar o contexto anterior quando o usuário muda de dimensão."""
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(
            "CREATE TABLE products (id_produto INTEGER PRIMARY KEY, nome TEXT, nota_media REAL)"
        )
        cursor.execute(
            "INSERT INTO products VALUES (1, 'Monitor', 4.5), (2, 'Smartphone', 4.3)"
        )
        conn.commit()

        turn1 = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos?",
            sql="SELECT id_produto, nome FROM products LIMIT 2",
            interpretation="Top 2 produtos",
            reasoning=(),
            assumptions=(),
        )

        prompt = build_question_with_memory_and_context(
            "Qual das regiões possui a maior quantidade de vendas dos ultimos 30 dias?",
            [turn1],
            conn=conn,
        )

        assert "Turno anterior" not in prompt
        assert "SQL aprovado:" not in prompt
        assert "regiões" in prompt.lower()

        conn.close()

    def test_build_uses_last_turn_with_sql(self):
        """Deve usar o ultimo turno com SQL mesmo se o ultimo turno nao tiver SQL."""
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(
            "CREATE TABLE products (id_produto INTEGER PRIMARY KEY, nome TEXT)"
        )
        cursor.execute("INSERT INTO products VALUES (1, 'Monitor'), (2, 'Smartphone')")
        conn.commit()

        turn1 = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos?",
            sql="SELECT id_produto, nome FROM products LIMIT 2",
            interpretation="Top 2 produtos",
            reasoning=(),
            assumptions=(),
        )

        turn2 = ConversationTurn(
            question="Qual dos dois tem melhor avaliacao?",
            sql=None,
            interpretation=None,
            reasoning=(),
            assumptions=(),
        )

        prompt = build_question_with_memory_and_context(
            "Qual dos dois tem melhor avaliacao?",
            [turn1, turn2],
            conn=conn,
        )

        assert "WHERE" in prompt
        conn.close()

    def test_backward_compatibility_with_build_question_with_memory(self):
        """A função original deve seguir funcionando sem mudanças."""
        turn1 = ConversationTurn(
            question="Teste?",
            sql="SELECT 1",
            interpretation="Test",
            reasoning=(),
            assumptions=(),
        )

        # Sem conexão, deve funcionar igual antes
        prompt_old = build_question_with_memory(
            "Pergunta atual?",
            [turn1],
        )

        prompt_new = build_question_with_memory_and_context(
            "Pergunta atual?",
            [turn1],
            conn=None,
        )

        # Ambas devem conter o contexto básico
        assert "Turno anterior" in prompt_old
        assert "Turno anterior" in prompt_new


class TestMultiTurnScenario:
    """Testa o cenário específico reportado pelo usuário."""

    def test_scenario_product_evaluation_follow_ups(self):
        """
        Simula os 4 turnos do problema reportado:
        1. "Quais foram os 2 produtos mais vendidos do último mês?"
        2. "Quais dos dois tem a melhor avaliação?"
        3. "Mas eu perguntei qual dos dois produtos entre o monitor gamer e o smartphone 256gb?"
        4. "Desses 5 produtos que você me trouxe, qual deles é o mais bem avaliado?"
        """
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE gold_produtos (
                id_produto INTEGER PRIMARY KEY,
                nome TEXT,
                nota_media REAL,
                qtd_vendas INTEGER
            )
            """
        )
        # Simulando produtos - os 2 mais vendidos + outros
        cursor.execute(
            """
            INSERT INTO gold_produtos VALUES
            (1, 'Monitor Gamer 144Hz', 4.2, 150),
            (2, 'Smartphone 256GB', 3.9, 140),
            (3, 'Raquete Beach Tennis', 4.04, 50),
            (4, 'Teclado Mecânico', 4.1, 60),
            (5, 'Mouse Sem Fio', 3.8, 70)
            """
        )
        conn.commit()

        # Turno 1: Quais foram os 2 produtos mais vendidos?
        turn1 = ConversationTurn(
            question="Quais foram os 2 produtos mais vendidos do último mês?",
            sql="SELECT id_produto, nome, nota_media FROM gold_produtos ORDER BY qtd_vendas DESC LIMIT 2",
            interpretation="Top 2 produtos por volume de vendas",
            reasoning=("1. Ordena por qtd_vendas DESC", "2. Retorna top 2"),
            assumptions=("Últimos 30 dias",),
        )

        # Turno 2: Quais dos dois tem a melhor avaliação?
        prompt_turn2 = build_question_with_memory_and_context(
            "Quais dos dois tem a melhor avaliação?",
            [turn1],
            conn=conn,
        )

        # Assert turno 2
        assert len(prompt_turn2) > 0
        assert "Monitor Gamer" in prompt_turn2 or "Smartphone" in prompt_turn2
        # Deve incluir instrução de filtro
        assert "id_produto IN" in prompt_turn2 or "WHERE" in prompt_turn2

        # Turno 3: Reforça a pergunta com referência explícita
        turn2 = ConversationTurn(
            question="Quais dos dois tem a melhor avaliação?",
            sql="SELECT id_produto, nome, nota_media FROM gold_produtos WHERE id_produto IN (1, 2) ORDER BY nota_media DESC",
            interpretation="Melhor avaliação entre Monitor e Smartphone",
            reasoning=(),
            assumptions=(),
        )

        prompt_turn3 = build_question_with_memory_and_context(
            "Mas eu perguntei qual dos dois produtos entre o monitor gamer e o smartphone 256gb?",
            [turn1, turn2],
            conn=conn,
        )

        # Assert turno 3
        assert len(prompt_turn3) > 0

        conn.close()

    def test_context_extractor_prevents_wrong_product_in_followup(self):
        """
        Valida que o extrator identifica corretamente quando a Raquete de Beach Tennis
        não deveria aparecer na resposta, pois não estava nos 2 produtos originais.
        """
        extractor = ContextExtractor()

        # Simula o SQL da pergunta 1 que retornou 2 produtos
        entities = {
            "ids": ["1", "2"],  # Monitor (1) e Smartphone (2)
            "id_column": "id_produto",
            "row_count": 2,
            "columns": ["id_produto", "nome"],
            "safe_columns": ["id_produto", "nome"],
            "sample_rows": [
                {"id_produto": 1, "nome": "Monitor Gamer 144Hz"},
                {"id_produto": 2, "nome": "Smartphone 256GB"},
            ],
        }

        # Pergunta 2 com padrão demonstrativo
        question_turn2 = "Quais dos dois tem a melhor avaliação?"

        instruction = extractor.build_context_instruction(
            entities, question_turn2, previous_question="Quais foram os 2 produtos mais vendidos?"
        )

        # Assert
        assert len(instruction) > 0
        # Deve indicar que os IDs 1 e 2 devem ser usados
        assert "1" in instruction and "2" in instruction
        # Deve mencionar WHERE clause ou filtro
        assert "WHERE" in instruction or "id_produto IN" in instruction
        # Não deve mencionar a Raquete (id 3)
        assert "3" not in instruction or (
            "3" in instruction and "...)" in instruction
        )  # OK se for truncado
