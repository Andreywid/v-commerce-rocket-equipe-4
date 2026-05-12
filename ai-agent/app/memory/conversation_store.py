"""Store in-memory para memória conversacional curta e isolada."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from threading import RLock
from uuid import uuid4

from app.models.conversation import ConversationKey, ConversationTurn
from app.models.responses import OrchestratorResult


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
