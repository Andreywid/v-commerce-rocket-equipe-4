"""Store in-memory para memória conversacional curta e isolada."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from threading import RLock
from uuid import uuid4

from app.models.conversation import ConversationKey, ConversationTurn
from app.models.responses import OrchestratorResult


def build_question_with_memory(
    question: str,
    turns: list[ConversationTurn],
    *,
    max_turns: int = 3,
) -> str:
    """Acrescenta contexto conversacional seguro a perguntas de follow-up."""

    recent_turns = turns[-max_turns:]
    if not recent_turns:
        return question

    context_blocks = []
    for index, turn in enumerate(recent_turns, start=1):
        lines = [
            f"Turno anterior {index}:",
            f"- Pergunta: {turn.question}",
        ]
        if turn.interpretation:
            lines.append(f"- Interpretação: {turn.interpretation}")
        if turn.sql:
            lines.append(f"- SQL aprovado: {turn.sql}")
        if turn.reasoning:
            lines.append(
                "- Raciocínio estruturado: "
                + " | ".join(turn.reasoning)
            )
        if turn.assumptions:
            lines.append(
                "- Premissas: "
                + " | ".join(turn.assumptions)
            )
        if turn.error:
            lines.append(f"- Erro: {turn.error}")
        context_blocks.append("\n".join(lines))

    context = "\n\n".join(context_blocks)
    return (
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
        f"{context}\n\n"
        "# PERGUNTA ATUAL\n"
        f"{question}"
    )


class InMemoryConversationStore:
    """
    Guarda histórico curto por conversation_id + tenant_id + user_id.

    Este store é propositalmente simples e volátil. Ele não guarda linhas do
    banco nem texto final da resposta, reduzindo risco de persistir PII.
    """

    def __init__(
        self,
        *,
        ttl_seconds: int = 3600,
        max_turns_per_conversation: int = 10,
    ) -> None:
        self._ttl = timedelta(seconds=ttl_seconds)
        self._max_turns = max_turns_per_conversation
        self._items: dict[ConversationKey, list[ConversationTurn]] = {}
        self._lock = RLock()

    @staticmethod
    def new_conversation_id() -> str:
        return str(uuid4())

    def append_result(
        self,
        *,
        conversation_id: str,
        tenant_id: str | None,
        user_id: str | None,
        question: str,
        result: OrchestratorResult,
    ) -> ConversationKey:
        key = ConversationKey(
            conversation_id=conversation_id,
            tenant_id=tenant_id,
            user_id=user_id,
        )
        turn = ConversationTurn(
            question=question,
            sql=result.sql,
            interpretation=result.interpretation,
            reasoning=tuple(result.reasoning),
            assumptions=tuple(result.assumptions),
            error=result.error,
        )

        with self._lock:
            self._prune_expired_locked()
            turns = self._items.setdefault(key, [])
            turns.append(turn)
            del turns[:-self._max_turns]

        return key

    def list_turns(
        self,
        *,
        conversation_id: str,
        tenant_id: str | None,
        user_id: str | None,
    ) -> list[ConversationTurn]:
        key = ConversationKey(
            conversation_id=conversation_id,
            tenant_id=tenant_id,
            user_id=user_id,
        )

        with self._lock:
            self._prune_expired_locked()
            return list(self._items.get(key, []))

    def _prune_expired_locked(self) -> None:
        expires_before = datetime.now(timezone.utc) - self._ttl
        expired_keys = [
            key
            for key, turns in self._items.items()
            if not turns or turns[-1].created_at < expires_before
        ]

        for key in expired_keys:
            del self._items[key]


_DEFAULT_STORE = InMemoryConversationStore()


def get_default_conversation_store() -> InMemoryConversationStore:
    return _DEFAULT_STORE
