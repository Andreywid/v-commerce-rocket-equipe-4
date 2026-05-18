"""Configuração compartilhada dos modelos LLM usados pelos agentes."""

from __future__ import annotations

import os
from typing import Callable, TypeVar

from pydantic_ai import Agent

DEFAULT_MODEL = "google-gla:gemini-3.1-flash-lite"
FALLBACK_MODEL = "google-gla:gemini-3.1-flash-lite"

# TypeVars para suportar qualquer combinação de Deps e Output type
AgentDepsT = TypeVar("AgentDepsT")
AgentOutputT = TypeVar("AgentOutputT")


def get_model_name(default: str = DEFAULT_MODEL) -> str:
    """Retorna o modelo configurado por ambiente ou o Gemini 2.5 Flash-Lite."""

    return os.getenv("LLM_MODEL", default)


def get_model_chain(model_name: str | None = None) -> list[str]:
    """
    Retorna a cadeia de modelos para fallback.
    
    Tenta usar o modelo primário (Gemini 2.5 Flash-Lite) e, caso falhe,
    faz fallback para o Gemini 3.1 Flash-Lite.
    
    Args:
        model_name: Modelo customizado ou None para usar cadeia padrão
    """
    configured_model = model_name or os.getenv("LLM_MODEL")
    
    if configured_model:
        # Se modelo customizado foi configurado, tenta ele primeiro e depois o fallback
        return [configured_model, FALLBACK_MODEL]
    
    # Por padrão: Gemini 2.5 Flash-Lite → Gemini 3.1 Flash-Lite
    return [DEFAULT_MODEL, FALLBACK_MODEL]


def create_agent_with_fallback(
    agent_name: str,
    model_name: str | None,
    agent_factory: Callable[[str], Agent[AgentDepsT, AgentOutputT]],
) -> Agent[AgentDepsT, AgentOutputT]:
    """
    Cria um agente com suporte automático a fallback de modelos.
    
    Funciona com qualquer combinação de tipo de dependências e output.
    
    Args:
        agent_name: Nome do agente para logs (ex: "sql_generator", "explainer")
        model_name: Modelo específico ou None para usar cadeia padrão
        agent_factory: Função que recebe o modelo e retorna o Agent configurado
    
    Returns:
        Agent inicializado com sucesso
    
    Raises:
        RuntimeError: Se nenhum modelo da cadeia conseguir ser inicializado
    
    Example:
        def create_sql_agent(model: str) -> Agent[Deps, Response]:
            return Agent(
                model=model,
                deps_type=Deps,
                output_type=Response,
                system_prompt=SYSTEM_PROMPT,
            )
        
        agent = create_agent_with_fallback("sql_generator", None, create_sql_agent)
    """
    # Define quais modelos tentar
    models_to_try = get_model_chain(model_name)
    
    # Tenta cada modelo em ordem
    last_error = None
    
    for model in models_to_try:
        try:
            agent = agent_factory(model)
            print(f"[{agent_name}] Usando modelo: {model}", flush=True)
            return agent
        except Exception as e:
            last_error = e
            print(f"[{agent_name}] Falha ao inicializar {model}: {e}", flush=True)
            continue
    
    # Se chegou aqui, nenhum modelo funcionou
    raise RuntimeError(
        f"Falha ao inicializar agente '{agent_name}' com nenhum dos modelos disponíveis. "
        f"Última erro: {last_error}"
    )


def configure_provider_api_keys() -> None:
    """
    Compatibiliza o ``API_KEY`` genérico com o provider Google do PydanticAI.

    O PydanticAI espera ``GOOGLE_API_KEY`` para modelos ``google-gla:*``.
    """

    if not os.getenv("GOOGLE_API_KEY") and os.getenv("API_KEY"):
        os.environ["GOOGLE_API_KEY"] = os.environ["API_KEY"]
