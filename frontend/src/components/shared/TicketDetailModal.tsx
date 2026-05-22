import { Calendar, MapPin, Phone } from "lucide-react"

import type { SupportType } from "@/types"
import type { TicketOut } from "@/types/api"
import { useCustomer360 } from "@/hooks/useCustomers"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function formatBRL(value: number | null | undefined): string {
  if (value == null) return "—"
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("pt-BR")
}

const TICKET_TITLE: Record<SupportType, string> = {
  Pagamento: "Problema de pagamento",
  Entrega:   "Problema com entrega",
  Reembolso: "Solicitação de reembolso",
  Produto:   "Problema com produto",
  Outros:    "Outros assuntos",
}

const MESSAGES: Record<SupportType, { opening: string; details: string[] }> = {
  Pagamento: {
    opening: "Olá, boa tarde!\nMeu cartão foi cobrado duas vezes.",
    details: ["Pagamento:", "- Método: Cartão de crédito", "- Status: Aprovado"],
  },
  Entrega: {
    opening: "Olá, bom dia!\nMeu pedido está com atraso na entrega.",
    details: ["Pedido:", "- Status: Em trânsito", "- Transportadora: Correios"],
  },
  Reembolso: {
    opening: "Olá!\nGostaria de solicitar o reembolso do meu pedido.",
    details: ["Pedido:", "- Motivo: Produto chegou danificado", "- Forma de pagamento: Cartão de crédito"],
  },
  Produto: {
    opening: "Olá!\nEstou com problema com o produto recebido.",
    details: ["Produto:", "- Problema: Defeito de fabricação", "- Data de entrega: há 3 dias"],
  },
  Outros: {
    opening: "Olá!\nGostaria de relatar uma situação.",
    details: ["Detalhes:", "- Tipo: Outros"],
  },
}

const SATISFACTION_MAP: Record<string, { level: string; percent: number; barColor: string }> = {
  alta:          { level: "Alta",  percent: 87, barColor: "bg-emerald-500" },
  media:         { level: "Média", percent: 60, barColor: "bg-amber-400"   },
  baixa:         { level: "Baixa", percent: 35, barColor: "bg-rose-500"    },
  sem_avaliacao: { level: "—",     percent: 0,  barColor: "bg-slate-300"   },
}

const RISK_MAP: Record<string, { label: string; className: string }> = {
  alta:          { label: "Seguro",   className: "bg-emerald-50 text-emerald-600 border border-emerald-200" },
  media:         { label: "Moderado", className: "bg-amber-50 text-amber-600 border border-amber-200"       },
  baixa:         { label: "Alto",     className: "bg-rose-50 text-rose-600 border border-rose-200"          },
  sem_avaliacao: { label: "—",        className: "bg-slate-50 text-slate-500 border border-slate-200"       },
}

export function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: TicketOut
  onClose: () => void
}) {
  const { data: customer } = useCustomer360(ticket.id_cliente)

  const satisfaction = SATISFACTION_MAP[ticket.satisfacao_atendimento] ?? SATISFACTION_MAP.sem_avaliacao
  const risk = RISK_MAP[ticket.satisfacao_atendimento] ?? RISK_MAP.sem_avaliacao
  const tipo = ticket.tipo_problema as SupportType
  const msg = MESSAGES[tipo]
  const title = TICKET_TITLE[tipo]

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
                  {getInitials(ticket.nome_cliente)}
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-semibold text-slate-900">{ticket.nome_cliente}</h3>
                  <p className="truncate text-sm text-slate-500">{customer?.email ?? "—"}</p>
                </div>
              </div>
              <div className="mt-2.5 grid gap-1 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Phone className="size-4 shrink-0" /> {customer?.telefone ?? "—"}</p>
                <p className="flex items-center gap-2"><MapPin className="size-4 shrink-0" /> {customer ? `${customer.cidade}, ${customer.estado}` : "—"}</p>
                <p className="flex items-center gap-2"><Calendar className="size-4 shrink-0" /> Último pedido {formatDate(customer?.data_ultimo_pedido ?? null)}</p>
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
              <p className="mt-1 text-right text-sm font-medium text-slate-600">{satisfaction.percent > 0 ? `${satisfaction.percent}%` : "—"}</p>
            </section>

            {/* Tickets count */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Tickets abertos</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-emerald-50 py-4 text-center text-emerald-700">
                  <p className="text-4xl font-bold">{customer?.qtd_tickets_resolvidos ?? "—"}</p>
                  <p className="mt-1 text-xs">resolvidos</p>
                </div>
                <div className="rounded-md bg-amber-50 py-4 text-center text-amber-700">
                  <p className="text-4xl font-bold">{customer?.qtd_tickets_abertos ?? "—"}</p>
                  <p className="mt-1 text-xs">em aberto</p>
                </div>
              </div>
            </section>

            {/* Total spent */}
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Total gasto</p>
              <p className="mt-2.5 text-2xl font-bold text-slate-900">
                {customer ? formatBRL(customer.valor_total_gasto) : "—"}
              </p>
            </section>
          </aside>

          {/* ── Right panel ── */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            {/* Ticket header */}
            <div className="border-b border-slate-100 p-5 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              <p className="mt-0.5 text-sm text-slate-400">#{ticket.id_ticket}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {ticket.sla_estourado && (
                  <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-3 py-0.5 text-xs font-medium text-rose-500">
                    Fora do prazo
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs font-medium text-slate-600">
                  {ticket.tipo_problema}
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-0.5 text-xs font-medium text-slate-600">
                  {ticket.status_ticket}
                </span>
              </div>
            </div>

            {/* Message body */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {getInitials(ticket.nome_cliente)}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-slate-900">{ticket.nome_cliente}</p>
                    <p className="text-xs text-slate-400">{formatDate(ticket.data_abertura)}</p>
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

          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
