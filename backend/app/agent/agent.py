# RESPONSABILIDADE: Time de IA
#
# Este módulo será desenvolvido pelo time de IA e integrado ao backend.
# O backend consome a função chat() exposta aqui via app/api/v1/agent.py.
#
# Contrato esperado:
#   async def chat(message: str, session_id: str | None) -> AgentResponse
#
# Stack prevista: PydanticAI (ou LangChain/LangGraph) + Gemini 2.5 Flash
# Fonte de dados: banco local populado pelas tabelas Gold do time de Dados
