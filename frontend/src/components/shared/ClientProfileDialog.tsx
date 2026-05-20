import { useState } from "react"
import { Calendar, MapPin, Phone } from "lucide-react"

import type { OrderOut, TicketOut } from "@/types/api"
import { orderStatusClasses, supportStatusClasses } from "@/constants/badgeStyles"
import { useCustomer360 } from "@/hooks/useCustomers"
import { useOrders } from "@/hooks/useOrders"
import { useSupport } from "@/hooks/useSupport"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/StatusBadge"

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

function OrdersTab({ orders }: { orders: OrderOut[] }) {
  if (orders.length === 0)
    return <p className="px-4 py-8 text-center text-sm text-slate-400">Nenhum pedido encontrado.</p>

  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead className="text-slate-900">
        <tr className="h-12 border-b border-slate-100">
          <th className="w-36 px-4 font-semibold">Pedido</th>
          <th className="font-semibold">Data</th>
          <th className="font-semibold">Status</th>
          <th className="font-semibold">Itens</th>
          <th className="font-semibold">Valor</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr className="h-16 border-t border-slate-100" key={order.id_pedido}>
            <td className="max-w-0 truncate px-4 font-medium text-slate-600">#{order.id_pedido}</td>
            <td>{formatDate(order.data_pedido)}</td>
            <td><StatusBadge className={orderStatusClasses[order.status]}>{order.status}</StatusBadge></td>
            <td>{order.quantidade}</td>
            <td>{formatBRL(order.valor_total)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function TicketsTab({ tickets }: { tickets: TicketOut[] }) {
  if (tickets.length === 0)
    return <p className="px-4 py-8 text-center text-sm text-slate-400">Nenhum ticket encontrado.</p>

  return (
    <table className="w-full table-fixed text-left text-sm">
      <thead className="text-slate-900">
        <tr className="h-12 border-b border-slate-100">
          <th className="w-36 px-4 font-semibold">Ticket</th>
          <th className="font-semibold">Data</th>
          <th className="font-semibold">Status</th>
          <th className="font-semibold">Satisfação</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr className="h-16 border-t border-slate-100" key={ticket.id_ticket}>
            <td className="max-w-0 truncate px-4 font-medium text-slate-600">#{ticket.id_ticket}</td>
            <td>{formatDate(ticket.data_abertura)}</td>
            <td><StatusBadge className={supportStatusClasses[ticket.status_ticket]}>{ticket.status_ticket}</StatusBadge></td>
            <td className="capitalize">{ticket.satisfacao_atendimento.replace("_", " ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}


export function ClientProfileDialog({
  customerId,
  onClose,
}: {
  customerId: string
  onClose: () => void
}) {
  const [tab, setTab] = useState<"orders" | "tickets">("orders")

  const { data: customer } = useCustomer360(customerId)
  const { data: ordersData } = useOrders({ id_cliente: customerId }, 1, 5)
  const { data: ticketsData } = useSupport({ id_cliente: customerId }, 1, 5)

  const orders = ordersData?.items ?? []
  const tickets = ticketsData?.items ?? []

  if (!customer) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-[1198px] h-[807px] max-h-[90dvh] rounded-lg pt-4 pr-6 pb-6 pl-6 gap-[10px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#4F46E5] text-[18px] font-medium leading-6.75 tracking-normal">Perfil do cliente</DialogTitle>
          </DialogHeader>
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">Carregando...</div>
        </DialogContent>
      </Dialog>
    )
  }

  const satisfactionPct = customer.nota_media_dada != null
    ? Math.round((customer.nota_media_dada / 5) * 100)
    : 0

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[1198px] h-[807px] max-h-[90dvh] rounded-lg pt-4 pr-6 pb-6 pl-6 gap-[10px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#4F46E5] text-[18px] font-medium leading-6.75 tracking-normal">Perfil do cliente</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 lg:grid-cols-[411px_1fr]">
          <aside className="space-y-2.5">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:h-[226px] flex flex-col gap-[10px]">
              <div className="flex items-center gap-[10px]">
                <span className="grid size-20 shrink-0 place-items-center rounded-full bg-rose-100 text-lg font-bold text-rose-600">
                  {getInitials(customer.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[24px] font-semibold leading-[29px] text-slate-900">{customer.nome}</h3>
                  <p className="truncate text-[16px] leading-[24px] text-slate-500">{customer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 text-[16px] font-normal leading-[24px] text-slate-600">
                <p className="flex items-center gap-2 truncate"><Phone className="size-4 shrink-0" /> {customer.telefone || "—"}</p>
                <p className="flex items-center gap-2 truncate"><MapPin className="size-4 shrink-0" /> {customer.cidade}, {customer.estado}</p>
                <p className="flex items-center gap-2 truncate"><Calendar className="size-4 shrink-0" /> Último pedido {formatDate(customer.data_ultimo_pedido)}</p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Nível de satisfação</p>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {customer.nota_media_dada == null ? "—" : customer.nota_media_dada >= 4 ? "Alta" : customer.nota_media_dada >= 3 ? "Média" : "Baixa"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Risco de evasão</p>
                  <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${customer.is_em_risco ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                    {customer.is_em_risco ? "Em risco" : "Seguro"}
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${satisfactionPct}%` }} />
              </div>
              <p className="mt-1 text-right text-sm font-medium text-slate-600">
                {customer.nota_media_dada != null ? `${satisfactionPct}%` : "—"}
              </p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Tickets abertos</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-emerald-50 py-4 text-center text-emerald-700">
                  <p className="text-4xl font-bold">{customer.qtd_tickets_resolvidos}</p>
                  <p className="mt-1 text-xs">resolvidos</p>
                </div>
                <div className="rounded-md bg-amber-50 py-4 text-center text-amber-700">
                  <p className="text-4xl font-bold">{customer.qtd_tickets_abertos}</p>
                  <p className="mt-1 text-xs">em aberto</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total gasto</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatBRL(customer.valor_total_gasto)}</p>
            </section>
          </aside>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex justify-end gap-2 border-b border-slate-100 px-4 py-2.5">
              <Button
                size="sm"
                variant={tab === "orders" ? "default" : "ghost"}
                className={tab === "orders" ? "bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white" : ""}
                onClick={() => setTab("orders")}
                type="button"
              >
                Pedidos ({ordersData?.total ?? customer.qtd_pedidos_total})
              </Button>
              <Button
                size="sm"
                variant={tab === "tickets" ? "default" : "ghost"}
                className={tab === "tickets" ? "bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white" : ""}
                onClick={() => setTab("tickets")}
                type="button"
              >
                Tickets ({ticketsData?.total ?? customer.qtd_tickets_total})
              </Button>
            </div>

            {tab === "orders" && <OrdersTab orders={orders} />}
            {tab === "tickets" && <TicketsTab tickets={tickets} />}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
