import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, Minus, Route, Send, X } from "lucide-react"

import type { ChatMessage } from "@/types"
import { useAgentChat, useAgentSuggestions } from "@/hooks/useAgent"

const FALLBACK_SUGGESTIONS = ["Qual minha renda mensal?", "Qual meu produto mais vendido?", "Quantos produtos foram vendidos esse mês?", "Qual minha renda mensal?"]

function renderWithBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

function formatSeparatorDate(date: Date): string {
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return isToday ? `Hoje ${time}` : `${date.toLocaleDateString("pt-BR")} ${time}`
}

function parseAnswer(raw: string): { content: string; source: string | null } {
  const sourceMatch = raw.match(/\bDados consultados:\s*(.+?)(?:\n|$)/i)
  const source = sourceMatch ? sourceMatch[1].trim() : null
  const content = raw
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\bSQL executado:[\s\S]*/i, "")
    .replace(/\bDados consultados:[\s\S]*/i, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return { content, source }
}

function routeForSource(source: string): string | null {
  const s = source.toLowerCase()
  if (s.includes("pedido") || s.includes("order")) return "/pedidos"
  if (s.includes("cliente") || s.includes("customer") || s.includes("cust")) return "/clientes"
  if (s.includes("produto") || s.includes("product") || s.includes("prod")) return "/produtos"
  if (s.includes("ticket") || s.includes("suporte") || s.includes("support")) return "/suporte"
  return null
}

function SourceBlock({ source, onView }: { source: string; onView: (() => void) | null }) {
  return (
    <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-[#E2E8F0] px-4 py-3">
      <div className="flex items-start gap-3">
        <Route className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <div>
          <p className="text-sm text-slate-700">Estes dados foram encontrados à partir da tabela de renda geral.</p>
          <p className="mt-0.5 text-xs text-slate-400">Tabelas &gt; {source}</p>
        </div>
      </div>
      {onView && (
        <button
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#000000] px-3 py-1.5 text-xs font-medium text-white"
          onClick={onView}
          type="button"
        >
          <Eye className="size-3.5" /> Ver fonte
        </button>
      )}
    </div>
  )
}

function ErrorBlock() {
  return (
    <div className="mt-2 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2.5">
      <p className="text-sm text-rose-400">Não consegui encontrar os dados solicitados.</p>
    </div>
  )
}

export function AssistantPanel({
  isVisible,
  onClose,
  onMinimize,
}: {
  isVisible: boolean
  onClose: () => void
  onMinimize: () => void
}) {
  const [question, setQuestion] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const navigate = useNavigate()
  const userName = localStorage.getItem("userName") ?? "usuário"
  const { data: suggestionsData } = useAgentSuggestions()
  const suggestions = suggestionsData ?? FALLBACK_SUGGESTIONS
  const mutation = useAgentChat()
  const hasMessages = messages.length > 0

  function handleClose() {
    setMessages([])
    setSessionId(null)
    onClose()
  }

  function sendMessage(message: string) {
    const trimmed = message.trim()
    if (!trimmed || mutation.isPending) return

    const msgId = crypto.randomUUID()
    const pendingId = crypto.randomUUID()

    const now = new Date()
    setMessages((current) => [
      ...current,
      { id: msgId, role: "user" as const, content: trimmed, timestamp: now },
      { id: pendingId, role: "assistant" as const, content: "…", timestamp: now },
    ])
    setTypingMessageId(pendingId)
    setQuestion("")

    mutation.mutate(
      { message: trimmed, session_id: sessionId },
      {
        onSuccess: (response) => {
          const { content, source } = parseAnswer(response.answer)
          const isError = /não consegui|não foi possível|não encontrei/i.test(content)
          setSessionId(response.session_id)
          setTypingMessageId(null)
          setMessages((current) =>
            current.map((m) => m.id === pendingId ? { ...m, content, source, isError, timestamp: new Date() } : m),
          )
        },
        onError: () => {
          setTypingMessageId(null)
          setMessages((current) =>
            current.map((m) =>
              m.id === pendingId ? { ...m, content: "Não consegui encontrar os dados solicitados.", isError: true } : m,
            ),
          )
        },
      },
    )
  }

  if (!isVisible) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <section
        className="pointer-events-auto fixed right-5 flex flex-col rounded-lg border border-slate-200 bg-white shadow-xl md:right-7"
        style={{
          bottom: "calc(28px + 64px + 12px)",
          width: "min(464px, calc(100vw - 40px))",
          height: "min(793px, calc(100dvh - 160px))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <h2 className="text-base font-semibold text-slate-900">Chat IA</h2>
          <div className="flex items-center gap-2">
            <button
              aria-label="Minimizar assistente"
              className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              onClick={onMinimize}
              type="button"
            >
              <Minus className="size-4" />
            </button>
            <button
              aria-label="Fechar assistente"
              className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              onClick={handleClose}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages / Welcome area */}
        <div className="flex-1 overflow-y-auto px-6">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <h3 className="text-center text-[22px] font-semibold text-[#4F46E5]">
                Bem-vindo, {userName}
              </h3>
              <p className="text-center text-sm text-[#64748B]">
                Posso lhe ajudar com alguma dessas possibilidades?
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {suggestions.map((action) => (
                  <button
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                    key={action}
                    onClick={() => sendMessage(action)}
                    type="button"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {/* Date/time separator */}
              <div className="py-1 text-center">
                <span className="text-xs font-medium text-[#64748B]">
                  {formatSeparatorDate(messages[0].timestamp)}
                </span>
              </div>

              {messages.map((message) => (
                <div
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                  key={message.id}
                >
                  {message.role === "user" ? (
                    <p className="max-w-[85%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-[#000000]">
                      {message.content}
                    </p>
                  ) : (
                    <div className="max-w-[95%]">
                      {message.id === typingMessageId ? (
                        <p className="text-sm leading-6 text-slate-500">Digitando...</p>
                      ) : message.isError ? (
                        <ErrorBlock />
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-[#000000]">{renderWithBold(message.content)}</p>
                          {message.source && (
                            <SourceBlock
                              source={message.source}
                              onView={(() => {
                                const route = routeForSource(message.source!)
                                if (!route) return null
                                return () => { navigate(route); onMinimize() }
                              })()}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 pb-8 pt-3">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(question) }}>
            <div className="relative">
              <input
                className="h-[47px] min-h-10 w-full rounded-lg border border-slate-200 py-[9.5px] pl-4 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-[#64748B] focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pergunte qualquer coisa..."
                value={question}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] transition hover:text-indigo-600 disabled:opacity-40"
                disabled={mutation.isPending || !question.trim()}
                type="submit"
              >
                <Send style={{ width: "14.33px", height: "14.33px" }} />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
