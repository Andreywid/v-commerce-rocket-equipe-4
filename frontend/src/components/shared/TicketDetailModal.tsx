import { useState } from "react"
import { Calendar, MapPin, MoreHorizontal, Phone, Send } from "lucide-react"

import type { ClientRow, RatingLabel, SupportRow, SupportType } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const TICKET_TITLE: Record<SupportType, string> = {
  Pagamento: "Problema de pagamento",
  Atraso:    "Problema com atraso",
  Reembolso: "Solicitação de reembolso",
}

const MESSAGES: Record<SupportType, { opening: string; details: string[] }> = {
  Pagamento: {
    opening: "Olá, boa tarde!\nMeu cartão foi cobrado duas vezes.",
    details: [
      "Pagamento:",
      "- Transação: TXN-8821",
      "- Método: Cartão de crédito",
      "- Valor: R$ 149,90",
      "- Status: Aprovado",
    ],
  },
  Atraso: {
    opening: "Olá, bom dia!\nMeu pedido está com atraso na entrega.",
    details: [
      "Pedido:",
      "- Código de rastreio: BR123456789",
      "- Data prevista: ontem",
      "- Transportadora: Correios",
      "- Status: Em trânsito",
    ],
  },
  Reembolso: {
    opening: "Olá!\nGostaria de solicitar o reembolso do meu pedido.",
    details: [
      "Pedido:",
      "- Motivo: Produto chegou danificado",
      "- Valor pago: R$ 299,90",
      "- Forma de pagamento: Cartão de crédito",
      "- Data da compra: há 7 dias",
    ],
  },
}

const SATISFACTION: Record<RatingLabel, { level: string; percent: number; barColor: string }> = {
  Excelente: { level: "Alta",  percent: 87, barColor: "bg-emerald-500" },
  Ótimo:     { level: "Alta",  percent: 75, barColor: "bg-emerald-500" },
  Bom:       { level: "Média", percent: 60, barColor: "bg-amber-400"   },
  Crítico:   { level: "Baixa", percent: 35, barColor: "bg-rose-500"    },
}

const RISK: Record<RatingLabel, { label: string; className: string }> = {
  Excelente: { label: "Seguro",   className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  Ótimo:     { label: "Seguro",   className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  Bom:       { label: "Moderado", className: "bg-amber-50 text-amber-600 border border-amber-200"       },
  Crítico:   { label: "Alto",     className: "bg-rose-50 text-rose-600 border border-rose-200"          },
}

function getPrazo(resolvedIn: string): boolean {
  const h = parseInt(resolvedIn)
  return !isNaN(h) && h > 24
}

function getDaysAgo(dateStr: string): number {
  const [day, month, year] = dateStr.split("/").map(Number)
  if (!day || !month || !year) return 0
  const date = new Date(year, month - 1, day)
  const today = new Date(2026, 4, 16)
  return Math.floor((today.getTime() - date.getTime()) / 86_400_000)
}

export function TicketDetailModal({
  clients,
  onClose,
  ticket,
  tickets,
}: {
  clients: ClientRow[]
  onClose: () => void
  ticket: SupportRow
  tickets: SupportRow[]
}) {
  const [question, setQuestion] = useState("")

  const client = clients.find((c) => c.name === ticket.customer)
  const clientTickets = tickets.filter((t) => t.customer === ticket.customer)
  const resolvedCount = clientTickets.filter((t) => t.status === "Resolvido" || t.status === "Fechado").length
  const openCount = clientTickets.filter((t) => t.status === "Aberto" || t.status === "Em andamento").length

  const satisfaction = SATISFACTION[ticket.ratingLabel]
  const risk = RISK[ticket.ratingLabel]
  const isForaDoPrazo = getPrazo(ticket.resolvedIn)
  const daysAgo = getDaysAgo(ticket.createdAt)
  const msg = MESSAGES[ticket.type]
  const title = TICKET_TITLE[ticket.type]
  const email = `${ticket.customer.toLowerCase().replace(/\s+/g, ".")}@hotmail.com`

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-299.5 h-201.75 max-h-[92dvh] rounded-lg pt-4 pr-6 pb-6 pl-6 gap-2.5 overflow-hidden">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="text-[#4F46E5] text-[18px] font-medium">Ticket</DialogTitle>
        </DialogHeader>

        <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[411px_1fr]">
          {/* ── Left panel ── */}
          <aside className="flex flex-col gap-2.5 overflow-y-auto">
            {/* Client info */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-20 shrink-0 place-items-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
                  {getInitials(ticket.customer)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-semibold text-slate-900">{ticket.customer}</h3>
                  <p className="truncate text-sm text-slate-500">{email}</p>
                </div>
              </div>
              <div className="mt-2.5 grid gap-1 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Phone className="size-4 shrink-0" /> +55 (88) 98888-8888</p>
                <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" /> {client?.location ?? "—"}</p>
                <p className="flex items-center gap-2"><Calendar className="size-4 shrink-0" /> Último pedido {client?.lastOrder ?? "—"}</p>
              </div>
            </section>

            {/* Satisfaction */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Nível de satisfação</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{satisfaction.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Risco de evasão</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${risk.className}`}>
                    {risk.label}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${satisfaction.barColor}`} style={{ width: `${satisfaction.percent}%` }} />
              </div>
              <p className="mt-1 text-right text-sm font-medium text-slate-600">{satisfaction.percent}%</p>
            </section>

            {/* Tickets count */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Tickets abertos</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-emerald-50 py-4 text-center text-emerald-700">
                  <p className="text-4xl font-bold">{resolvedCount}</p>
                  <p className="mt-1 text-xs">resolvidos</p>
                </div>
                <div className="rounded-md bg-amber-50 py-4 text-center text-amber-700">
                  <p className="text-4xl font-bold">{openCount}</p>
                  <p className="mt-1 text-xs">em aberto</p>
                </div>
              </div>
            </section>

            {/* Total spent */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Total gasto</p>
              <p className="mt-2.5 text-2xl font-bold text-slate-900">{client?.total ?? "—"}</p>
            </section>
          </aside>

          {/* ── Right panel ── */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {/* Ticket header */}
            <div className="border-b border-slate-100 p-5 pb-4">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                <button type="button" className="text-slate-400 hover:text-slate-600">
                  <MoreHorizontal className="size-5" />
                </button>
              </div>
              <p className="mt-0.5 text-sm text-slate-400">{ticket.ticket.toLowerCase()}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {isForaDoPrazo && (
                  <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-0.5 text-xs font-medium text-rose-500">
                    Fora do prazo
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs font-medium text-slate-600">
                  {ticket.type}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs font-medium text-slate-600">
                  {ticket.status}
                </span>
              </div>
            </div>

            {/* Message body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {getInitials(ticket.customer)}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-slate-900">{ticket.customer}</p>
                    <p className="text-xs text-slate-400">
                      {ticket.createdAt}{daysAgo > 0 ? ` (há ${daysAgo} dias)` : ""}
                    </p>
                  </div>
                  <div className="mt-2 space-y-3 text-sm text-slate-700">
                    {msg.opening.split("\n").map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                    <div className="space-y-0.5">
                      {msg.details.map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Input footer */}
            <div className="border-t border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  placeholder="Pergunte qualquer coisa..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <button
                  type="button"
                  className="text-slate-400 transition hover:text-indigo-600"
                  onClick={() => setQuestion("")}
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
