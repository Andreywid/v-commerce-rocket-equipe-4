"""Testes da configuração compartilhada de modelo LLM."""

from pathlib import Path
import os
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.agents.model_config import (
    DEFAULT_MODEL,
    configure_provider_api_keys,
    get_model_name,
)


class ModelConfigTest(unittest.TestCase):
    def test_default_model_is_gemini_flash_lite(self) -> None:
        old_model = os.environ.pop("LLM_MODEL", None)
        try:
            self.assertEqual(get_model_name(), DEFAULT_MODEL)
            self.assertEqual(DEFAULT_MODEL, "google-gla:gemini-3.1-flash-lite")
        finally:
            if old_model is not None:
                os.environ["LLM_MODEL"] = old_model

    def test_api_key_fallback_sets_google_api_key(self) -> None:
        old_api_key = os.environ.get("API_KEY")
        old_google_api_key = os.environ.pop("GOOGLE_API_KEY", None)
        try:
            os.environ["API_KEY"] = "test-key"
            configure_provider_api_keys()
            self.assertEqual(os.environ["GOOGLE_API_KEY"], "test-key")
        finally:
            if old_api_key is None:
                os.environ.pop("API_KEY", None)
            else:
                os.environ["API_KEY"] = old_api_key

            if old_google_api_key is None:
                os.environ.pop("GOOGLE_API_KEY", None)
            else:
                os.environ["GOOGLE_API_KEY"] = old_google_api_key


if __name__ == "__main__":
    unittest.main()
