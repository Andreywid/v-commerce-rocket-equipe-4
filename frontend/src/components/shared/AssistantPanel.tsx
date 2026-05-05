import { useState } from "react"
import { Sparkles, X } from "lucide-react"

import type { ChatMessage, OrderRow, PageKey, SupportRow } from "@/types"
import { getAssistantAnswer, getAssistantSummary } from "@/helpers/assistant"

const quickActions = ["Resumo geral", "Pedidos pendentes", "Tickets críticos", "Reembolsos"]

export function AssistantPanel({
  currentPage,
  onClose,
  orders,
  tickets,
}: {
  currentPage: PageKey
  onClose: () => void
  orders: OrderRow[]
  tickets: SupportRow[]
}) {
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant" as const,
      content: getAssistantSummary(currentPage, orders, tickets),
    },
  ])

  function sendMessage(message: string) {
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user" as const, content: trimmedMessage },
      {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: getAssistantAnswer(trimmedMessage, currentPage, orders, tickets),
      },
    ])
    setQuestion("")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/25 sm:bg-slate-950/20">
      <section className="flex h-[86dvh] w-full flex-col rounded-t-lg bg-white shadow-2xl shadow-slate-950/25 sm:mb-5 sm:mr-5 sm:h-[calc(100dvh-2.5rem)] sm:max-w-[420px] sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-indigo-600">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assistente IA</h2>
              <p className="text-xs text-slate-500">Conversa sobre o CRM</p>
            </div>
          </div>
          <button
            aria-label="Fechar assistente"
            className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                key={message.id}
              >
                <p
                  className={[
                    "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6",
                    message.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-4">
          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {quickActions.map((action) => (
              <button
                className="h-8 shrink-0 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
                key={action}
                onClick={() => sendMessage(action)}
                type="button"
              >
                {action}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              sendMessage(question)
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Pergunte sobre pedidos ou tickets"
              value={question}
            />
            <button
              className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Enviar
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
