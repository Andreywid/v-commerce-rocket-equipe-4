from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import asyncpg


@dataclass
class Deps:
    conn: asyncpg.Connection | None  # type: ignore[name-defined]
