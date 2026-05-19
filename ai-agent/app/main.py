"""
Ponto de entrada para testes locais do AI Agent.

Execute a partir do diretório ``ai-agent``::

    python -m app.main --chat
    python -m app.main --question "..."
    python -m app.main --serve-api

``GOOGLE_API_KEY`` no ``.env`` ou no ambiente habilita chamadas ao modelo.
"""

from __future__ import annotations

import sys
from pathlib import Path

from dotenv import load_dotenv

_AI_AGENT_ROOT = Path(__file__).resolve().parent.parent
if str(_AI_AGENT_ROOT) not in sys.path:
    sys.path.insert(0, str(_AI_AGENT_ROOT))

load_dotenv(_AI_AGENT_ROOT / ".env")

if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

from app.cli.args import main


if __name__ == "__main__":
    main()
