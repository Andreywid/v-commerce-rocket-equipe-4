import { useState } from "react"
import type { PointerEvent } from "react"
import { Minus, Sparkles, X } from "lucide-react"

import type { ChatMessage, OrderRow, PageKey, SupportRow } from "@/types"
import { getAssistantAnswer, getAssistantSummary } from "@/helpers/assistant"

const quickActions = ["Resumo geral", "Pedidos pendentes", "Tickets críticos", "Reembolsos"]

const panelSize = { height: 620, width: 360 }
const minimizedSize = 64

function getInitialPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 }
  return {
    x: Math.max(12, window.innerWidth - panelSize.width - 20),
    y: Math.max(12, window.innerHeight - panelSize.height - 20),
  }
}

function getMinimizedPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 }
  return {
    x: Math.max(12, window.innerWidth - minimizedSize - 24),
    y: Math.max(12, window.innerHeight - minimizedSize - 24),
  }
}

function clampPosition(position: { x: number; y: number }, size = panelSize) {
  if (typeof window === "undefined") return position
  return {
    x: Math.min(Math.max(12, position.x), Math.max(12, window.innerWidth - size.width - 12)),
    y: Math.min(Math.max(12, position.y), Math.max(12, window.innerHeight - size.height - 12)),
  }
}

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
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState(getInitialPosition)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
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

  function handleDragStart(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragOffset({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    })
  }

  function handleDragMove(event: PointerEvent<HTMLElement>) {
    if (!dragOffset) return
    const size = isMinimized ? { height: minimizedSize, width: minimizedSize } : panelSize
    setPosition(clampPosition({ x: event.clientX - dragOffset.x, y: event.clientY - dragOffset.y }, size))
  }

  function handleDragEnd() {
    setDragOffset(null)
  }

  function minimizeAssistant() {
    setIsMinimized(true)
    setPosition(getMinimizedPosition())
  }

  function expandAssistant() {
    setIsMinimized(false)
    setPosition(clampPosition(getInitialPosition()))
  }

  if (isMinimized) {
    return (
      <div className="pointer-events-none fixed inset-0 z-50">
        <button
          aria-label="Abrir assistente IA"
          className="pointer-events-auto fixed grid size-16 place-items-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-500"
          onClick={expandAssistant}
          style={{ left: position.x, top: position.y }}
          type="button"
        >
          <Sparkles className="size-7" />
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <section
        className="pointer-events-auto fixed flex max-h-[calc(100dvh-24px)] flex-col rounded-xl bg-white shadow-2xl shadow-slate-950/20"
        style={{
          height: "min(620px, calc(100dvh - 40px))",
          left: position.x,
          top: position.y,
          width: "min(360px, calc(100vw - 24px))",
        }}
      >
        <div
          className="flex cursor-move touch-none select-none items-center justify-between border-b border-slate-200 px-4 py-3"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-indigo-100 text-indigo-600">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assistente IA</h2>
              <p className="text-xs text-slate-500">Conversa sobre o CRM</p>
            </div>
          </div>
          <div className="flex items-center gap-1" onPointerDown={(event) => event.stopPropagation()}>
            <button
              aria-label="Minimizar assistente"
              className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={(event) => {
                event.stopPropagation()
                minimizeAssistant()
              }}
              type="button"
            >
              <Minus className="size-4" />
            </button>
            <button
              aria-label="Fechar assistente"
              className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={(event) => {
                event.stopPropagation()
                onClose()
              }}
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                key={message.id}
              >
                <p
                  className={[
                    "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-6",
                    message.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700",
                  ].join(" ")}
                >
                  {message.content}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 px-4 py-3">
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
