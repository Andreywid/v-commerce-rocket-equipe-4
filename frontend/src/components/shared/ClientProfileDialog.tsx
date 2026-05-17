import { useState } from "react"
import { Calendar, MapPin, Pencil, Phone } from "lucide-react"

import type { ClientRow, OrderRow, SupportRow } from "@/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/StatusBadge"

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ClientProfileDialog({
  client,
  onClose,
  orders,
  tickets,
}: {
  client: ClientRow
  onClose: () => void
  orders: OrderRow[]
  tickets: SupportRow[]
}) {
  const [tab, setTab] = useState<"orders" | "tickets">("orders")
  const clientOrders = orders.slice(0, Math.max(2, Math.min(orders.length, client.orderCount || 2)))
  const clientTickets = tickets.slice(0, 2)
  const resolvedTickets = clientTickets.filter((ticket) => Number(ticket.rating) >= 4).length
  const openTickets = Math.max(0, clientTickets.length - resolvedTickets)

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
                  {getInitials(client.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[24px] font-semibold leading-[29px] text-slate-900">{client.name}</h3>
                  <p className="truncate text-[16px] leading-[24px] text-slate-500">{client.name.toLowerCase().replace(/\s+/g, ".")}@hotmail.com</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1 text-[16px] font-normal leading-[24px] text-slate-600">
                <p className="flex items-center gap-2 truncate"><Phone className="size-4 shrink-0" /> +55 (88) 98888-8888</p>
                <p className="flex items-center gap-2 truncate"><MapPin className="size-4 shrink-0" /> {client.location}</p>
                <p className="flex items-center gap-2 truncate"><Calendar className="size-4 shrink-0" /> Último pedido {client.lastOrder}</p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500">Nível de satisfação</p>
                  <p className="mt-1 text-base font-bold text-slate-900">Alta</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Risco de evasão</p>
                  <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Seguro</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[87%] rounded-full bg-emerald-500" />
              </div>
              <p className="mt-1 text-right text-sm font-medium text-slate-600">87%</p>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Tickets abertos</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-md bg-emerald-50 py-4 text-center text-emerald-700">
                  <p className="text-4xl font-bold">{resolvedTickets}</p>
                  <p className="mt-1 text-xs">resolvidos</p>
                </div>
                <div className="rounded-md bg-amber-50 py-4 text-center text-amber-700">
                  <p className="text-4xl font-bold">{openTickets}</p>
                  <p className="mt-1 text-xs">em aberto</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total gasto</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{client.total.replace("32.309,95", "79.656,77")}</p>
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
                Pedidos ({clientOrders.length})
              </Button>
              <Button
                size="sm"
                variant={tab === "tickets" ? "default" : "ghost"}
                className={tab === "tickets" ? "bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white" : ""}
                onClick={() => setTab("tickets")}
                type="button"
              >
                Tickets ({clientTickets.length})
              </Button>
            </div>

            {tab === "orders" ? (
              <table className="w-full table-fixed text-left text-sm">
                <thead className="text-slate-900">
                  <tr className="h-12 border-b border-slate-100">
                    <th className="px-4 font-semibold">Pedido</th>
                    <th className="font-semibold">Data</th>
                    <th className="font-semibold">Status</th>
                    <th className="font-semibold">Itens</th>
                    <th className="font-semibold">Valor</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {clientOrders.map((order, index) => (
                    <tr className="h-16 border-t border-slate-100" key={`${order.id}-${index}`}>
                      <td className="px-4 font-medium text-slate-600">{order.id.replace("PROD", "PED")}</td>
                      <td>{order.date}</td>
                      <td><StatusBadge className="bg-emerald-50 text-emerald-600 ring-emerald-200">{order.status}</StatusBadge></td>
                      <td>{order.quantity.replace("x", "")}</td>
                      <td>{order.value}</td>
                      <td><button className="grid place-items-center rounded-md p-1 transition hover:bg-indigo-50" type="button"><Pencil className="size-4 text-[#4F46E5]" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full table-fixed text-left text-sm">
                <thead className="text-slate-900">
                  <tr className="h-12 border-b border-slate-100">
                    <th className="px-4 font-semibold">Ticket</th>
                    <th className="font-semibold">Data</th>
                    <th className="font-semibold">Status</th>
                    <th className="font-semibold">Avaliação</th>
                    <th className="w-20" />
                  </tr>
                </thead>
                <tbody>
                  {clientTickets.map((ticket, index) => (
                    <tr className="h-16 border-t border-slate-100" key={`${ticket.ticket}-${index}`}>
                      <td className="px-4 font-medium text-slate-600">{ticket.ticket}</td>
                      <td>{ticket.createdAt}</td>
                      <td><StatusBadge className="bg-emerald-50 text-emerald-600 ring-emerald-200">Resolvido</StatusBadge></td>
                      <td><StatusBadge className="bg-indigo-50 text-indigo-600 ring-indigo-200">{ticket.rating} {ticket.ratingLabel}</StatusBadge></td>
                      <td><button className="grid place-items-center rounded-md p-1 transition hover:bg-indigo-50" type="button"><Pencil className="size-4 text-[#4F46E5]" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
