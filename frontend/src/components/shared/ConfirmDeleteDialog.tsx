import { AlertTriangle, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ConfirmDeleteDialog({
  entityName,
  onCancel,
  onConfirm,
  open,
}: {
  entityName: string
  onCancel: () => void
  onConfirm: () => void
  open: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="sm:max-w-md rounded-lg px-6 py-6 gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-medium text-slate-900">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-rose-50">
              <AlertTriangle className="size-5 text-[#F43F5E]" />
            </span>
            Excluir {entityName}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-500 pb-6">
          Tem certeza que deseja excluir este {entityName}? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="h-10 gap-2 rounded-full px-6"
            onClick={onCancel}
            type="button"
          >
            <X className="size-4" />
            Cancelar
          </Button>
          <Button
            className="h-10 gap-2 rounded-full px-6 bg-[#F43F5E] hover:bg-[#F43F5E]/90 text-white"
            onClick={onConfirm}
            type="button"
          >
            <Trash2 className="size-4" />
            Excluir {entityName}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
