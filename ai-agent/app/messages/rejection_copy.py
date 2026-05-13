"""Textos amigáveis para quando o fluxo bloqueia pergunta ou SQL."""

from __future__ import annotations


def format_question_policy(detail: str) -> str:
    """Pergunta barrada por política (escopo, injeção, vazio, tenant)."""

    lines = [
        "Não foi possível processar esta pergunta por regras de segurança ou de escopo.",
        "",
        f"Motivo: {detail}",
        "",
    ]
    lowered = detail.casefold()
    if "tenant" in lowered:
        lines.append(
            "É necessário informar o tenant (ambiente) da consulta. "
            "Inclua o tenant na requisição ou use o parâmetro correspondente na CLI."
        )
    elif "vazia" in lowered:
        lines.append("Envie uma pergunta em texto sobre os dados que você quer analisar.")
    elif "burlar" in lowered or "instru" in lowered or "incompatível" in lowered or "chaves" in lowered:
        lines.append(
            "Este canal só responde a perguntas analíticas sobre os dados do negócio. "
            "Não é possível alterar instruções internas, expor chaves ou conteúdo do sistema."
        )
    elif "domínio" in lowered or "analítico" in lowered or "fora do escopo" in lowered:
        lines.append(
            "Este assistente analisa dados de vendas e operação da V-Commerce. "
            "Pergunte, por exemplo, sobre receita, pedidos, KPIs, evolução no tempo ou comparações entre períodos."
        )
    else:
        lines.append(
            "Reformule em termos de análise de dados (métricas, períodos, cortes) alinhados ao seu catálogo de dados."
        )
    return "\n".join(lines)


def format_invalid_request(detail: str) -> str:
    """O modelo classificou a pergunta como inválida ou fora do que pode responder."""

    return "\n".join(
        [
            "Esta pergunta não pôde ser atendida como uma consulta aos dados disponíveis.",
            "",
            f"Motivo informado pelo agente: {detail}",
            "",
            "Como tentar de novo:",
            "- Seja específico sobre a métrica (ex.: receita bruta, taxa de aprovação, quantidade de pedidos).",
            "- Indique período ou granularidade quando fizer sentido (ex.: últimos 12 meses, por mês, trimestre).",
            "- Use apenas temas cobertos pelas tabelas do schema (vendas, clientes, pedidos, etc.).",
        ]
    )


def format_sql_validation(detail: str) -> str:
    """SQL gerado não passou no validador estático da aplicação."""

    return "\n".join(
        [
            "A consulta gerada não atende às regras de segurança ou de formato exigidas aqui.",
            "",
            f"Detalhe: {detail}",
            "",
            "Reformule a pergunta com menos ambiguidade ou peça uma visão mais simples (menos junções ou subconsultas), "
            "para o modelo gerar SQL compatível com o validador.",
        ]
    )


def format_sql_policy(detail: str) -> str:
    """SQL barrado por política de acesso (tabela, coluna, PII, SELECT *)."""

    return "\n".join(
        [
            "A consulta foi bloqueada pelas regras de acesso aos dados.",
            "",
            f"Detalhe: {detail}",
            "",
            "Verifique se sua pergunta usa apenas tabelas e colunas permitidas para o seu perfil. "
            "Tabelas fora do escopo não são executadas.",
        ]
    )


def format_execution(detail: str) -> str:
    """Erro na execução no banco (coluna inexistente, sintaxe no dialeto, etc.)."""

    return "\n".join(
        [
            "A consulta não pôde ser executada no banco.",
            "",
            f"Erro retornado: {detail}",
            "",
            "Isso costuma indicar coluna ou tabela que não existe no schema real, ou função não suportada no dialeto. "
            "Reformule a pergunta ou tente de novo com outro recorte; o sistema pode gerar outra consulta automaticamente.",
        ]
    )


def format_sql_agent(detail: str) -> str:
    """Falha inesperada ao chamar o gerador de SQL."""

    return "\n".join(
        [
            "O serviço de geração de consulta falhou de forma inesperada.",
            "",
            f"Detalhe: {detail}",
            "",
            "Tente novamente em instantes. Se o problema persistir, simplifique a pergunta.",
        ]
    )
