"""Texto de memória conversacional prefixado à pergunta no fluxo Text-to-SQL."""

import re
import unicodedata

MEMORY_CONVERSATIONAL_PREFIX = (
    "# CONTEXTO CONVERSACIONAL SEGURO\n"
    "Use o contexto abaixo apenas para resolver referências do usuário, "
    "como 'e no mês anterior?' ou 'faça o mesmo para outro período'. "
    "Não copie SQL sem revalidar e não assuma dados que não estejam no schema.\n\n"
    "# REGRAS PARA FOLLOW-UP ANALÍTICO\n"
    "- Se a pergunta atual pedir maior, menor, top, ranking ou comparação sobre "
    "um resultado agregado anterior, preserve a mesma definição de métrica e "
    "a mesma granularidade analítica do turno anterior.\n"
    "- Não ordene linhas brutas quando o turno anterior calculou totais com "
    "SUM, COUNT, AVG, MIN ou MAX. Recalcule a agregação com GROUP BY e só então "
    "ordene pelo agregado.\n"
    "- Reutilize aliases e definições aprovadas quando fizer sentido. Exemplo: "
    "se valor_total foi SUM(receita_bruta), então 'maior valor total' deve "
    "ordenar por SUM(receita_bruta), não por receita_bruta de uma linha isolada.\n\n"
    "# REFERÊNCIAS PRONOMINAIS E DEMONSTRATIVOS\n"
    '- Se a pergunta atual usar expressões como "esses", "essas", "aqueles", '
    '"isso", "o mesmo", "esses clientes", "eles", "deles", "delas" ou equivalentes, '
    "resolva pelo turno anterior mais recente que tenha SQL aprovado e definição "
    "clara do conjunto ou filtro (WHERE, JOIN, GROUP BY).\n"
    '- Exemplo: após um COUNT com filtro em coluna X, "quem são esses" costuma '
    "pedir linhas detalhadas (identificação, nome, etc.) com o mesmo filtro em X; "
    "gere o SELECT correspondente em vez de InvalidRequest por vago.\n"
    "- Se dois turnos recentes tratarem de assuntos distintos, prefira o mais "
    "recente e registre a premissa na resposta.\n\n"
    "# REFINAMENTO SOMENTE TEMPORAL\n"
    "- Se a # PERGUNTA ATUAL for **apenas** uma janela ou intervalo de tempo (ex.: "
    '"últimos 3 meses", "no último trimestre") e existir turno anterior com uma '
    "pergunta analítica completa (com ou sem SQL aprovado, inclusive com Erro), "
    "interprete como **a mesma intenção de negócio** aplicada a esse período. "
    "Use a pergunta (e interpretação, SQL, premissas) do turno anterior.\n"
    "- Não retorne InvalidRequest dizendo que a frase atual está incompleta ou "
    "falta métrica: o contexto anterior fornece o tema.\n\n"
)

# Texto curto após a pergunta quando há anafora/demonstrativo — reforço além das regras gerais.
FOLLOWUP_DEMONSTRATIVE_PIPELINE = (
    "\n\n"
    "# RESOLUÇÃO OBRIGATÓRIA (PIPELINE)\n"
    "Esta rodada foi detectada como follow-up com demonstrativo ou pronominal (ex.: "
    "\"esses\", \"isso\", \"o mesmo\").\n"
    "O escopo analítico é o do **SQL aprovado do turno anterior mais recente** neste prompt: "
    "reutilize as mesmas tabelas, JOINs e predicados de WHERE; ajuste apenas o SELECT para "
    "listar linhas detalhadas (identificadores, nomes, etc.) em vez de COUNT/SUM/AVG isolados, "
    "sempre que o schema permitir.\n"
    "É **proibido** retornar InvalidRequest alegando falta de contexto ou ambiguidade neste caso.\n"
)

FOLLOWUP_TEMPORAL_PIPELINE = (
    "\n\n"
    "# RESOLUÇÃO OBRIGATÓRIA (PERÍODO)\n"
    "A pergunta atual foi classificada como **refinamento só de tempo**.\n"
    "Reabra a intenção do **turno anterior mais recente** neste prompt (pergunta + "
    "interpretação; ignore que não haja SQL se o motivo foi falta de período) e "
    "incorpore o intervalo indicado pelo usuário (filtros em ano_mes ou data_pedido, "
    "conforme a tabela e o motor).\n"
    "É **proibido** retornar InvalidRequest por a frase isolada parecer vaga.\n"
)

FOLLOWUP_IMPLICIT_CONTEXT_OPERATION_PIPELINE = (
    "\n\n"
    "# RESOLUÇÃO OBRIGATÓRIA (OPERAÇÃO SOBRE RESULTADOS ANTERIORES)\n"
    "A pergunta atual foi classificada como follow-up elíptico: ela pede uma métrica, "
    "ranking, comparação ou detalhe sobre o conjunto listado no SQL aprovado mais "
    "recente, mesmo sem usar palavras como \"desses\".\n"
    "Use o conjunto anterior como escopo obrigatório. Se houver nomes/IDs no contexto "
    "ou na instrução estruturada, filtre por eles com IN antes de calcular a nova "
    "métrica. Preserve filtros temporais e de status do turno anterior quando ainda "
    "fizerem parte da intenção.\n"
    "Mapeamentos seguros comuns:\n"
    "- \"melhor/pior avaliado\", \"maior/menor nota\": para produtos, use AVG(nota_produto) "
    "em gold_avaliacoes filtrando os produtos anteriores; para clientes, use média de "
    "nota/NPS quando existir no schema.\n"
    "- \"vendeu mais\", \"mais vendido\", \"maior quantidade\": use contagem de pedidos "
    "ou SUM(quantidade) conforme a granularidade, com status = 'Aprovado' para pedidos.\n"
    "- \"maior receita/faturamento/valor\", \"menor receita\": use SUM(valor_total) "
    "em pedidos aprovados ou SUM(receita_bruta) em KPIs agregados.\n"
    "- \"mais tickets\", \"tickets críticos/abertos\", \"mais problemas\": use gold_tickets "
    "com agregação por entidade anterior quando houver chave/nome compatível.\n"
    "- \"mais recente/último/primeiro\": ordene pela coluna de data adequada do mesmo "
    "domínio, mantendo o filtro do conjunto anterior.\n"
    "É **proibido** retornar InvalidRequest alegando ambiguidade quando o critério "
    "acima puder ser resolvido pelo contexto anterior e pelo schema.\n"
)


def _looks_demonstrative_followup(question: str) -> bool:
    """Heurística simples PT-BR para perguntas que referenciam o turno anterior."""

    q = f" {question.casefold().strip()} "
    needles = (
        " esses",
        " essas",
        " esse ",
        " essa ",
        "esses ",
        "essas ",
        " dos dois",
        " das duas",
        " desses dois",
        " dessas duas",
        "aqueles",
        "aquela",
        "aquele",
        " eles",
        " elas",
        "isso ",
        " isso",
        " isso?",
        "o mesmo",
        " desses",
        " dessas",
        " deles",
        " delas",
        " neles",
        " nelas",
    )
    return any(n in q for n in needles)


def _looks_temporal_only_followup(question: str) -> bool:
    """Frases curtas que só fixam janela (ex.: 'ultimos 3 meses') para combinar ao turno anterior."""

    s = question.strip()
    if len(s) > 120:
        return False
    t = s.casefold()
    core_window = r"[uú]?lt(?:i)?m(?:o)?s?"
    patterns = (
        rf"^{core_window}\s+\d+\s*m(?:eses|ês|es)?\.?\s*$",
        rf"^(?:n[oa]s?\s+)?{core_window}\s+\d+\s*m(?:eses|ês|es)?\.?\s*$",
        rf"^(?:para\s+)?(?:(?:n[oa]s?|[oa]s)\s+)?{core_window}\s+\d+\s*m(?:eses|ês|es)?\.?\s*$",
        rf"^(?:para\s+)?(?:(?:n[oa]s?|[oa]s)\s+)?[uú]?lt(?:i)?m(?:o)?\s+trimestre\.?\s*$",
        rf"^(?:para\s+)?(?:(?:n[oa]s?|[oa]s)\s+)?{core_window}\s+\d+\s*dias?\.?\s*$",
        rf"^(?:para\s+)?(?:(?:n[oa]s?|[oa]s)\s+)?{core_window}\s+\d+\s*semanas?\.?\s*$",
        rf"^(?:para\s+)?(?:(?:n[oa]s?|[oa]s)\s+)?{core_window}\s+\d+\s*anos?\.?\s*$",
    )
    return any(re.fullmatch(p, t) for p in patterns)


def _normalize_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text.casefold())
    return "".join(
        character for character in normalized if not unicodedata.combining(character)
    )


def _looks_implicit_context_operation_followup(question: str, context: str) -> bool:
    """Detecta perguntas curtas como 'Qual vendeu mais?' após lista anterior."""

    if not context.strip() or "SQL aprovado:" not in context:
        return False

    normalized_question = _normalize_text(question).strip()
    if len(normalized_question) > 120:
        return False

    normalized_context = _normalize_text(context)
    has_previous_entity_context = any(
        token in normalized_context
        for token in (
            "id_produto",
            "nome_produto",
            "produto",
            "id_cliente",
            "nome_cliente",
            "cliente",
            "regiao",
            "estado",
            "cidade",
            "id_ticket",
            "ticket",
            "categoria",
            "marca",
        )
    )
    if not has_previous_entity_context:
        return False

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
    )
    metric_terms = (
        "avaliado",
        "avaliada",
        "avaliacao",
        "nota",
        "nps",
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

    return (
        any(term in normalized_question for term in metric_terms)
        and (
            any(term in normalized_question for term in ranking_terms)
            or any(term in normalized_question for term in explicit_reference_terms)
        )
    )


def format_question_with_conversational_memory(*, context: str, question: str) -> str:
    """Junta regras fixas, bloco serializado dos turnos e pergunta atual."""

    current = question.strip()
    if _looks_demonstrative_followup(current):
        current = current + FOLLOWUP_DEMONSTRATIVE_PIPELINE
    elif context.strip() and _looks_temporal_only_followup(current):
        # Refinamento temporal pode reaproveitar a intenção analítica mesmo quando
        # o turno anterior não teve SQL aprovado (ex.: erro por falta de período).
        current = current + FOLLOWUP_TEMPORAL_PIPELINE
    elif _looks_implicit_context_operation_followup(current, context):
        current = current + FOLLOWUP_IMPLICIT_CONTEXT_OPERATION_PIPELINE

    return (
        f"{MEMORY_CONVERSATIONAL_PREFIX}"
        f"{context}\n\n"
        "# PERGUNTA ATUAL\n"
        f"{current}"
    )
