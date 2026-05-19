"""Extrator de contexto estruturado para turnos anteriores com dados concretos."""

from __future__ import annotations

import re
import sqlite3
import unicodedata
from typing import TYPE_CHECKING

from app.database.executor import QueryExecutor
from app.models.conversation import ConversationTurn

if TYPE_CHECKING:
    import sqlite3


class ContextExtractor:
    """Extrai dados concretos dos SQLs aprovados em turnos anteriores."""

    _DIMENSION_KEYWORDS: dict[str, tuple[str, ...]] = {
        "produto": (
            "produto",
            "produtos",
            "item",
            "itens",
            "sku",
            "skus",
            "mercadoria",
            "mercadorias",
            "categoria",
            "categorias",
            "marca",
            "marcas",
        ),
        "regiao": (
            "regiao",
            "regioes",
            "estado",
            "estados",
            "uf",
            "ufs",
            "cidade",
            "cidades",
            "municipio",
            "municipios",
            "bairro",
            "bairros",
            "pais",
            "paises",
        ),
        "cliente": (
            "cliente",
            "clientes",
            "consumidor",
            "consumidores",
            "comprador",
            "compradores",
            "usuario",
            "usuarios",
        ),
        "pedido": (
            "pedido",
            "pedidos",
            "compra",
            "compras",
            "transacao",
            "transacoes",
            "ordem",
            "ordens",
        ),
        "ticket": (
            "ticket",
            "tickets",
            "chamado",
            "chamados",
            "suporte",
            "atendimento",
        ),
    }

    def __init__(self, executor: QueryExecutor | None = None):
        self._executor = executor or QueryExecutor()

    def extract_referenced_entities(
        self,
        turn: ConversationTurn,
        conn: sqlite3.Connection,
        *,
        max_values: int = 100,
    ) -> dict | None:
        """
        Executa o SQL aprovado do turno anterior e extrai entidades mencionadas.

        Retorna um dict com:
        - 'ids': lista de IDs (se houver coluna id_*)
        - 'columns': lista de colunas retornadas
        - 'row_count': quantidade de linhas
        - 'sample_rows': primeiras N linhas (sem dados sensíveis)
        """
        if not turn.sql:
            return None

        try:
            cursor = conn.cursor()
            cursor.execute(turn.sql)
            rows = cursor.fetchall()

            if not rows:
                return None

            columns = [desc[0] for desc in cursor.description]
            id_columns = [col for col in columns if col.startswith("id_")]

            ids = []
            if id_columns:
                id_col_index = columns.index(id_columns[0])
                ids = [str(row[id_col_index]) for row in rows[:max_values]]

            sensitive_patterns = ("email", "telefone", "cpf", "senha", "token")
            safe_columns = [
                col
                for col in columns
                if not any(pattern in col.lower() for pattern in sensitive_patterns)
            ]

            sample_rows = []
            for row in rows[:min(3, len(rows))]:
                row_dict = {
                    col: row[columns.index(col)]
                    for col in safe_columns
                    if col in columns
                }
                sample_rows.append(row_dict)

            filter_column = None
            filter_values: list[str] = []
            if not ids:
                filter_column, filter_values = self._select_filter_values(
                    columns,
                    safe_columns,
                    rows,
                    max_values,
                )

            return {
                "ids": ids,
                "columns": columns,
                "safe_columns": safe_columns,
                "row_count": len(rows),
                "sample_rows": sample_rows,
                "id_column": id_columns[0] if id_columns else None,
                "filter_column": filter_column,
                "filter_values": filter_values,
            }

        except Exception:
            return None

    def _detect_referencing_pattern(self, question: str) -> tuple[str, bool]:
        """
        Detecta se a pergunta refencia os resultados anteriores.

        Retorna (tipo, é_referência) onde tipo é 'demonstrative', 'filter', 'none'
        """
        q_lower = question.lower()
        normalized_question = self._normalize_text(question)

        if re.search(
            r"\b(desses|dessas|destes|destas)\s+\d+\s+que\s+voce\s+trouxe\b",
            normalized_question,
        ):
            return "filter", True

        demonstrative_markers = {
            "qual dos": "demonstrative",
            "quais dos": "demonstrative",
            "qual desses": "demonstrative",
            "quais desses": "demonstrative",
            "qual das": "demonstrative",
            "quais das": "demonstrative",
            "qual delas": "demonstrative",
            "desses": "demonstrative",
            "dessas": "demonstrative",
            "destes": "demonstrative",
            "destas": "demonstrative",
            "dos dois": "demonstrative",
            "das duas": "demonstrative",
            "desses dois": "demonstrative",
            "dessas duas": "demonstrative",
            "entre os dois": "demonstrative",
            "entre as duas": "demonstrative",
            "esses": "demonstrative",
            "essas": "demonstrative",
            "aqueles": "demonstrative",
            "aquela": "demonstrative",
            "aquele": "demonstrative",
            "aquelas": "demonstrative",
            "dentre os": "demonstrative",
            "dentre as": "demonstrative",
            "entre os": "demonstrative",
            "entre as": "demonstrative",
            "dentre esses": "demonstrative",
            "entre esses": "demonstrative",
            "dos que você trouxe": "filter",
            "das que você trouxe": "filter",
            "daqueles que": "demonstrative",
            "daquelas que": "demonstrative",
            "desse resultados": "filter",
            "dessa resultados": "filter",
            "desses resultados": "filter",
            "dessas resultados": "filter",
        }

        for marker, pattern_type in demonstrative_markers.items():
            if marker in q_lower:
                return pattern_type, True

        evaluation_terms = (
            "avaliado",
            "avaliada",
            "avaliacao",
            "nota",
            "nps",
        )
        ranking_terms = (
            "melhor",
            "pior",
            "maior",
            "menor",
            "mais",
            "menos",
            "top",
            "primeiro",
            "ultimo",
            "recente",
            "antigo",
            "mais bem",
        )
        metric_terms = evaluation_terms + (
            "vendeu",
            "comprou",
            "comprar",
            "compra",
            "compras",
            "vendido",
            "venda",
            "vendas",
            "receita",
            "faturamento",
            "valor",
            "ticket medio",
            "pedido",
            "pedidos",
            "quantidade",
            "qtd",
            "volume",
            "preco",
            "caro",
            "barato",
            "reembolso",
            "recusa",
            "aprovacao",
            "conversao",
            "problema",
            "problemas",
            "suporte",
            "chamado",
            "tickets",
            "critico",
            "aberto",
            "risco",
            "ativo",
            "inativo",
            "data",
            "recente",
            "antigo",
            "primeiro",
            "ultimo",
        )
        explicit_reference_terms = (
            "produto",
            "produtos",
            "protudo",
            "protudos",
            "cliente",
            "clientes",
            "regiao",
            "regioes",
            "estado",
            "estados",
            "cidade",
            "cidades",
            "ticket",
            "tickets",
            "pedido",
            "pedidos",
        )
        if (
            any(term in normalized_question for term in metric_terms)
            and (
                any(term in normalized_question for term in ranking_terms)
                or any(term in normalized_question for term in explicit_reference_terms)
            )
        ):
            return "implicit_context_operation", True

        return "none", False

    @staticmethod
    def _normalize_text(text: str) -> str:
        normalized = unicodedata.normalize("NFKD", text.casefold())
        return "".join(
            character for character in normalized if not unicodedata.combining(character)
        )

    @classmethod
    def _extract_dimension_groups(cls, text: str) -> set[str]:
        normalized = cls._normalize_text(text)
        matched_groups: set[str] = set()

        for group, keywords in cls._DIMENSION_KEYWORDS.items():
            if any(keyword in normalized for keyword in keywords):
                matched_groups.add(group)

        return matched_groups

    def should_reuse_previous_context(
        self,
        question: str,
        previous_question: str | None,
        entities: dict | None = None,
    ) -> bool:
        """Indica se a pergunta atual ainda parece depender do turno anterior."""

        if not previous_question:
            return True

        current_groups = self._extract_dimension_groups(question)
        if not current_groups:
            return True

        previous_basis = previous_question
        if entities:
            previous_basis = " ".join(
                part
                for part in (
                    previous_question,
                    entities.get("filter_column"),
                    " ".join(entities.get("columns", [])),
                    " ".join(entities.get("safe_columns", [])),
                )
                if part
            )

        previous_groups = self._extract_dimension_groups(previous_basis)
        if not previous_groups:
            return True

        return not current_groups.isdisjoint(previous_groups)

    @staticmethod
    def _select_filter_values(
        columns: list[str],
        safe_columns: list[str],
        rows: list[tuple],
        max_values: int,
    ) -> tuple[str | None, list[str]]:
        """Escolhe uma coluna textual segura para usar como filtro quando nao houver id_*.

        Retorna (coluna, valores). Se nao houver coluna segura, retorna (None, []).
        """

        preferred_tokens = (
            "nome_",
            "nome",
            "produto",
            "cliente",
            "categoria",
            "marca",
            "segmento",
            "canal",
        )

        candidate_values: list[tuple[str, list[str]]] = []
        for col in safe_columns:
            idx = columns.index(col)
            values: list[str] = []
            valid = True
            for row in rows[:max_values]:
                val = row[idx]
                if val is None:
                    continue
                if not isinstance(val, str):
                    valid = False
                    break
                cleaned = val.strip()
                if cleaned:
                    values.append(cleaned)
            if not valid or not values:
                continue
            unique_values = list(dict.fromkeys(values))
            if len(unique_values) > 20:
                continue
            candidate_values.append((col, unique_values))

        if not candidate_values:
            return None, []

        def _score(column: str) -> int:
            score = 0
            lowered = column.lower()
            for token in preferred_tokens:
                if token in lowered:
                    score += 10
            return score

        candidate_values.sort(key=lambda item: (_score(item[0]), len(item[1])), reverse=True)
        return candidate_values[0]

    def build_context_instruction(
        self,
        entities: dict | None,
        question: str,
        previous_question: str | None = None,
    ) -> str:
        """
        Monta instrução explícita para usar os dados anteriores no SQL.

        Inclui exemplos práticos de como incorporar os filtros.
        """

        if not entities:
            return ""

        normalized_question = self._normalize_text(question)
        pattern_type, _ = self._detect_referencing_pattern(question)

        if pattern_type == "none":
            return ""

        if pattern_type == "implicit_context_operation":
            previous_columns_text = self._normalize_text(
                " ".join(
                    part
                    for part in (
                        entities.get("id_column"),
                        entities.get("filter_column"),
                        " ".join(entities.get("columns", [])),
                        " ".join(entities.get("safe_columns", [])),
                    )
                    if part
                )
            )

            is_evaluation_question = any(
                token in normalized_question
                for token in (
                    "avaliado",
                    "avaliada",
                    "avaliacao",
                    "nota",
                    "nps",
                    "review",
                    "rating",
                )
            )

            has_product_or_evaluation_context = any(
                token in previous_columns_text
                for token in (
                    "produto",
                    "item",
                    "sku",
                    "categoria",
                    "marca",
                    "avaliacao",
                    "nota",
                    "nps",
                    "review",
                    "rating",
                )
            )

            if is_evaluation_question and not has_product_or_evaluation_context:
                return ""

            if not any(
                token in previous_columns_text
                for token in (
                    "produto",
                    "cliente",
                    "regiao",
                    "estado",
                    "cidade",
                    "ticket",
                    "categoria",
                    "marca",
                )
            ):
                return ""
        elif not self.should_reuse_previous_context(question, previous_question, entities):
            return ""

        ids_list = entities.get("ids", [])
        id_column = entities.get("id_column")
        filter_column = id_column or entities.get("filter_column")
        filter_values = ids_list or entities.get("filter_values", [])
        row_count = entities["row_count"]

        if not filter_column or not filter_values:
            return ""

        def _format_value(value: str) -> str:
            return "'" + value.replace("'", "''") + "'"

        values_str = ", ".join(_format_value(value) for value in filter_values[:20])
        overflow = (
            f" ... (e mais {len(filter_values) - 20})"
            if len(filter_values) > 20
            else ""
        )

        example_with_where = f"WHERE {filter_column} IN ({values_str})"

        operation_hint = ""
        if pattern_type == "implicit_context_operation":
            operation_hint = (
                "A frase atual é um follow-up elíptico: aplique a nova métrica/"
                "ordenação somente sobre o conjunto anterior filtrado abaixo. "
                "Não ignore o filtro nem responda InvalidRequest por falta de "
                "expressões como 'desses'.\n"
            )

        instruction = (
            f"\n\n# ⚠️ INSTRUÇÃO CRÍTICA: CONTEXTO ANTERIOR DEVE SER FILTRADO\n"
            f"\n"
            f"## Fatos sobre a pergunta anterior:\n"
            f"- Pergunta: {previous_question or 'N/A'}\n"
            f"- Resultado: {row_count} item(s) retornado(s)\n"
            f"- Exemplos de {filter_column}: {values_str}{overflow}\n"
            f"\n"
            f"## Regra obrigatória para esta pergunta:\n"
            f"A pergunta atual referencia esses resultados anteriores.\n"
            f"{operation_hint}"
            f"**VOCÊ DEVE** incorporar um filtro WHERE neste formato:\n"
            f"\n"
            f"```sql\n"
            f"SELECT ... FROM ... \n"
            f"{example_with_where}\n"
            f"  AND ... -- outros filtros, se necessário\n"
            f"```\n"
            f"\n"
            f"## Exemplos de como aplicar corretamente:\n"
            f"\n"
            f"❌ ERRADO (ignorou os IDs anteriores):\n"
            f"   SELECT * FROM gold_produtos ORDER BY nota_media DESC LIMIT 1;\n"
            f"\n"
            f"✓ CORRETO (filtrou pelos IDs anteriores):\n"
            f"   SELECT * FROM gold_produtos {example_with_where} ORDER BY nota_media DESC LIMIT 1;\n"
            f"\n"
            f"Se a pergunta pedir ranking, comparação, maior, menor, top N, ou qualquer operação\n"
            f"que se refira a \"esses\", \"desses\", \"dos N resultados\", SEMPRE use o filtro acima.\n"
            f"\n"
        )

        return instruction