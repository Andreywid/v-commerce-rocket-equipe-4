import { useState } from "react"
import { Check, SquarePen, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import type { CustomerOut } from "@/types/api"
import { useCustomerMutations } from "@/hooks/useCustomers"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog"

type AddProps = { mode: "add"; customer?: never; onDelete?: never }
type EditProps = { mode: "edit"; customer: CustomerOut; onDelete: () => void }

type Props = (AddProps | EditProps) & {
  onClose: () => void
  onSubmit: () => void
}

export function ClientFormModal({ mode, customer, onClose, onDelete, onSubmit }: Props) {
  const isEditing = mode === "edit"
  const { create, update, remove } = useCustomerMutations()

  const [nome, setNome] = useState(isEditing ? customer.nome : "")
  const [email, setEmail] = useState(isEditing ? customer.email : "")
  const [telefone, setTelefone] = useState(isEditing ? (customer.telefone ?? "") : "")
  const [cidade, setCidade] = useState(isEditing ? (customer.cidade ?? "") : "")
  const [estado, setEstado] = useState(isEditing ? (customer.estado ?? "") : "")

  const isPending = create.isPending || update.isPending || remove.isPending
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleDelete() {
    if (!isEditing) return
    remove.mutate(customer.id_cliente, { onSuccess: onDelete })
  }

  function handleSubmit() {
    if (!nome.trim()) {
      toast.error("O nome do cliente é obrigatório")
      return
    }
    if (!email.trim()) {
      toast.error("O e-mail do cliente é obrigatório")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Informe um e-mail válido")
      return
    }
    const payload = {
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim() || undefined,
      cidade: cidade.trim() || undefined,
      estado: estado.trim().toUpperCase() || undefined,
    }
    if (isEditing) {
      update.mutate({ id: customer.id_cliente, data: payload }, { onSuccess: onSubmit })
    } else {
      create.mutate(payload, { onSuccess: onSubmit })
    }
  }

  return (
    <>
    <ConfirmDeleteDialog
      open={confirmingDelete}
      entityName="cliente"
      onCancel={() => setConfirmingDelete(false)}
      onConfirm={() => { setConfirmingDelete(false); handleDelete() }}
    />
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-[800px] rounded-lg px-6 py-4 gap-0">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-medium text-[#4F46E5]">
            <SquarePen className="size-4" />
            {isEditing ? "Editar cliente" : "Adicionar cliente"}
          </DialogTitle>
        </DialogHeader>

        <form className="grid gap-5 pt-4" onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
          {/* Nome + E-mail */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Nome do cliente</Label>
              <Input
                placeholder="Nome do cliente"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">E-mail</Label>
              <Input
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Telefone + Cidade + Estado */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Telefone</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Cidade</Label>
              <Input
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Estado (UF)</Label>
              <Input
                placeholder="SP"
                maxLength={2}
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-1 flex items-center justify-between">
            {isEditing ? (
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full border-[#F43F5E] px-6 text-[#F43F5E] hover:bg-rose-50 hover:text-[#F43F5E]"
                disabled={isPending}
                onClick={() => setConfirmingDelete(true)}
                type="button"
              >
                <Trash2 className="size-4" />
                Excluir
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-full px-6"
                disabled={isPending}
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
                Cancelar
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  )
}
