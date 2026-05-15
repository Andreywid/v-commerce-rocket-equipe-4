# Endpoints: Agente de IA (Text-to-SQL)
#
# INTEGRAÇÃO EXTERNA — este arquivo é de responsabilidade do time de Backend.
# O módulo do agente (app/agent/) será desenvolvido pelo time de IA e integrado aqui.
#
# Contrato de integração esperado:
#   O time de IA deve expor uma função em app/agent/agent.py com a assinatura:
#     async def chat(message: str, session_id: str | None) -> AgentResponse
#   onde AgentResponse contém: answer (str), sql_used (str), data (list)
#
# POST /api/v1/agent/chat
#   Body:    { "message": str, "session_id": str (opcional) }
#   Retorna: { "answer": str, "sql_used": str, "data": list }
#
# GET /api/v1/agent/suggestions
#   Retorna perguntas sugeridas para onboarding do usuário (diferencial)
#
# DELETE /api/v1/agent/session/{session_id}
#   Limpa histórico de conversa da sessão (diferencial — memória)
