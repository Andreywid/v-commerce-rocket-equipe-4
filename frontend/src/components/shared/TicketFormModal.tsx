import { useState } from "react"
import { Check, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import type { TicketOut } from "@/types/api"
import { useSupportMutations } from "@/hooks/useSupport"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"

const TIPOS = ["Entrega", "Reembolso", "Produto", "Pagamento"] as const
const STATUSES = ["Aberto", "Resolvido"] as const

type AddProps = { mode: "add"; ticket?: never; onDelete?: never }
type EditProps = { mode: "edit"; ticket: TicketOut; onDelete: () => void }

type Props = (AddProps | EditProps) & {
  onClose: () => void
  onSubmit: () => void
}

export function TicketFormModal({ mode, ticket, onClose, onDelete, onSubmit }: Props) {
  const isEditing = mode === "edit"
  const { create, update, remove } = useSupportMutations()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const [cliente, setCliente] = useState(isEditing ? ticket.nome_cliente : "")
  const [agente, setAgente] = useState(isEditing ? (ticket.agente_suporte ?? "") : "")
  const [tipo, setTipo] = useState<typeof TIPOS[number]>(isEditing ? ticket.tipo_problema : "Entrega")
  const [status, setStatus] = useState<typeof STATUSES[number]>(isEditing ? ticket.status_ticket : "Aberto")

  const isPending = create.isPending || update.isPending || remove.isPending

  function handleDelete() {
    if (!isEditing) return
    remove.mutate(ticket.id_ticket, { onSuccess: onDelete })
  }

  function handleSubmit() {
    if (!isEditing && !cliente.trim()) {
      toast.error("O nome do cliente é obrigatório")
      return
    }
    if (!agente.trim()) {
      toast.error("O nome do agente de suporte é obrigatório")
      return
    }
    if (isEditing) {
      update.mutate(
        { id: ticket.id_ticket, data: { tipo_problema: tipo, status_ticket: status, agente_suporte: agente || undefined } },
        { onSuccess: onSubmit },
      )
    } else {
      create.mutate(
        {
          id_cliente: crypto.randomUUID(),
          nome_cliente: cliente.trim(),
          tipo_problema: tipo,
          agente_suporte: agente.trim(),
        },
        { onSuccess: onSubmit },
      )
    }
  }

  return (
    <>
    <ConfirmDeleteDialog
      open={confirmingDelete}
      entityName="ticket"
      onCancel={() => setConfirmingDelete(false)}
      onConfirm={() => { setConfirmingDelete(false); handleDelete() }}
    />
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[800px] rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-[18px] font-medium text-[#4F46E5]">
            {isEditing ? "Editar ticket" : "Registrar novo ticket"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4 pt-4"
          onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {isEditing && (
              <div className="grid gap-1.5 sm:col-span-2">
                <Label className="text-sm font-semibold text-slate-700">Ticket ID</Label>
                <Input className="bg-slate-50 text-slate-500" disabled readOnly value={ticket.id_ticket} />
              </div>
            )}

            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Cliente</Label>
              <Input
                disabled={isEditing}
                placeholder="Insira o nome do cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className={isEditing ? "bg-slate-50 text-slate-500" : ""}
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Agente de suporte</Label>
              <Input
                placeholder="Nome do agente responsável"
                value={agente}
                onChange={(e) => setAgente(e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-3">
            {isEditing && (
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full border-[#F43F5E] px-6 text-[#F43F5E] hover:bg-rose-50 hover:text-[#F43F5E]"
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
                type="button"
              >
                <Trash2 className="size-4" /> Excluir
              </Button>
            )}
            <Button
              variant="outline"
              className="h-10 gap-2 rounded-full px-6"
              disabled={isPending}
              onClick={onClose}
              type="button"
            >
              <X className="size-4" /> Cancelar
            </Button>
            <Button
              className="h-10 gap-2 rounded-full px-6 bg-[#0F172A] hover:bg-[#0F172A]/90 text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              <Check className="size-4" />
              {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
