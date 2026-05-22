# Módulo de Integração com o AI Agent (Backend)

## Visão Geral

O backend atua como **proxy/façade** entre o frontend e o serviço externo de AI Agent (`:8001`). Encaminha perguntas em linguagem natural, normaliza campos da resposta e trata falhas de comunicação com respostas degradadas amigáveis — nunca expondo exceções HTTP ao cliente.

## Responsabilidades

1. Manter um cliente `httpx.AsyncClient` reutilizável com base URL configurável
2. Encaminhar mensagens do frontend para o endpoint `/ask` do AI Agent
3. Mapear campos: `question`→`/ask`, `explanation`→`answer`, `sql`→`sql_used`, `rows`→`data`
4. Manter contexto de conversa multi-turno via `conversation_id` / `session_id`
5. Tratar `HTTPStatusError` e `RequestError` sem lançar exceções HTTP

## Arquitetura Interna

### Cliente HTTP reutilizável (`app/agent/agent.py`)

```python
_client: httpx.AsyncClient | None = None

def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            base_url=settings.AI_AGENT_URL,  # http://localhost:8001
            timeout=60.0,
        )
    return _client
# O cliente é criado uma vez e reutilizado entre requisições
# Evita overhead de TCP handshake a cada chamada
```

### Função `chat(message, session_id)`

```python
async def chat(message: str, session_id: str | None) -> dict:
    client = _get_client()

    payload = {
        "question": message,
        "execute": True,
        "allow_all_schema_access": True,
    }
    if session_id:
        payload["conversation_id"] = session_id

    try:
        response = await client.post("/ask", json=payload)
        response.raise_for_status()
        data = response.json()

        return {
            "answer":     data.get("explanation", "Sem resposta"),
            "sql_used":   data.get("sql"),
            "data":       data.get("rows", []),
            "session_id": data.get("conversation_id", session_id),
        }

    except httpx.HTTPStatusError as exc:
        return {
            "answer":     f"O agente retornou um erro ({exc.response.status_code}).",
            "sql_used":   None,
            "data":       [],
            "session_id": session_id,
        }

    except httpx.RequestError:
        return {
            "answer":     "O agente de IA está temporariamente indisponível.",
            "sql_used":   None,
            "data":       [],
            "session_id": session_id,
        }
```

---

## Fluxo Completo de uma Pergunta

```
Frontend → POST /api/v1/agent/chat
           { "message": "Top 5 produtos?", "session_id": null }
                    │
                    ▼
           agent.py router
           Depends(get_current_user) → valida JWT
                    │
                    ▼
           chat(message="Top 5 produtos?", session_id=None)
                    │
                    │  POST http://localhost:8001/ask
                    │  {
                    │    "question": "Top 5 produtos?",
                    │    "execute": true,
                    │    "allow_all_schema_access": true
                    │  }
                    ▼
           AI Agent :8001
           ├── Interpreta pergunta com LLM
           ├── Gera SQL
           ├── Executa SQL no banco Gold
           └── Retorna:
               {
                 "explanation": "Os 5 produtos mais vendidos foram...",
                 "sql": "SELECT nome_produto, SUM(quantidade)...",
                 "rows": [...],
                 "conversation_id": "uuid-abc"
               }
                    │
                    ▼
           Normaliza para ChatResponse:
           {
             "answer":     "Os 5 produtos mais vendidos foram...",
             "sql_used":   "SELECT nome_produto...",
             "data":       [...],
             "session_id": "uuid-abc"
           }
                    │
                    ▼
           Frontend recebe resposta e exibe no AssistantPanel
           → próxima mensagem envia session_id="uuid-abc" para manter contexto
```

## Mapeamento de Campos

| Backend envia ao AI Agent | AI Agent responde | Backend retorna ao Frontend |
|---|---|---|
| `question` | — | — |
| `execute: true` | — | — |
| `allow_all_schema_access: true` | — | — |
| `conversation_id` (opcional) | `conversation_id` | `session_id` |
| — | `explanation` | `answer` |
| — | `sql` | `sql_used` |
| — | `rows` | `data` |

## Sugestões Pré-definidas (`GET /agent/suggestions`)

Retornadas hardcoded pelo router; não envolvem chamada ao AI Agent:

```python
[
    "Quais foram os 5 produtos mais vendidos no último mês?",
    "Qual a receita total por categoria em 2026?",
    "Quais clientes do estado de SP gastaram mais de R$3.000?",
    "Qual o ticket médio por método de pagamento?",
    "Quantos tickets estão abertos com SLA estourado?",
    "Qual produto tem a maior taxa de problemas de suporte?",
]
```

## Tratamento de Erros

| Situação | Comportamento | `session_id` preservado? |
|---|---|---|
| AI Agent retorna 4xx/5xx | `answer` com código de erro; sem exceção HTTP | Sim |
| AI Agent inacessível (connection refused) | `answer` "temporariamente indisponível" | Sim |
| Timeout (>60s) | Subconjunto de `RequestError`; mesma resposta degradada | Sim |
| JWT inválido antes da chamada | 401 — não chega ao `chat()` | — |

Falhas do AI Agent nunca levantam `HTTPException`. O frontend sempre recebe `200` com `answer` legível.

## Configuração

```env
# backend/.env
AI_AGENT_URL=http://localhost:8001
```

A URL é injetada via `settings.AI_AGENT_URL` (pydantic-settings). Para apontar para um AI Agent remoto, basta alterar esta variável.

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| [autenticacao.md](autenticacao.md) | ← usa | `Depends(get_current_user)` antes do proxy |
| [endpoints.md](endpoints.md) | contexto | POST /agent/chat e GET /agent/suggestions |
| AI Agent `:8001` | → HTTP | Serviço externo; documentado em `../../ai-agent/docs/` |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/agent/agent.py` | Façade HTTP, cliente reutilizável, normalização de campos |
| `app/api/v1/agent.py` | Router: POST /agent/chat, GET /agent/suggestions |
| `app/config.py` | `AI_AGENT_URL` (configurável via .env) |

## Glossário

| Termo | Significado |
|---|---|
| Façade | Padrão de design que simplifica uma interface complexa (AI Agent) expondo uma simpler (chat) |
| `conversation_id` | Identificador de sessão multi-turno no AI Agent |
| `session_id` | Nome do campo equivalente no contrato frontend ↔ backend |
| Resposta degradada | Resposta parcial (sem dados) em caso de falha do serviço externo |
| `execute: true` | Flag do AI Agent para executar o SQL gerado e retornar as linhas |
| `allow_all_schema_access: true` | Permite ao AI Agent consultar todas as tabelas Gold |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
