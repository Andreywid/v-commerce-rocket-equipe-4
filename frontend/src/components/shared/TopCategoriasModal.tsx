import { Crown } from "lucide-react"

import type { TopCategoria } from "@/types/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCategoryLabel } from "@/helpers/dictionary"

const DIVIDER = <div style={{ height: 1, backgroundColor: "#E2E8F0" }} />

function CategoriaBadge({ qtd }: { qtd: number }) {
  return (
    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 whitespace-nowrap">
      {qtd.toLocaleString("pt-BR")} un.
    </span>
  )
}

export function TopCategoriasModal({
  onClose,
  categorias,
}: {
  onClose: () => void
  categorias: TopCategoria[]
}) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="rounded-lg gap-0"
        style={{ width: 490, maxWidth: "calc(100vw - 32px)", padding: "16px 24px 32px" }}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-medium leading-[27px] tracking-normal text-[#4F46E5]">
            <Crown className="size-[14px]" />
            Top 5 Categorias
          </DialogTitle>
        </DialogHeader>

        {DIVIDER}

        <ul>
          {categorias.map((cat, idx) => (
            <li key={cat.categoria}>
              <div className="flex items-center justify-between gap-4 py-4 transition-transform duration-300 ease-in-out hover:scale-[1.012] hover:cursor-default">
                <span className="truncate text-[15px] font-semibold text-slate-900">
                  {idx + 1}. {formatCategoryLabel(cat.categoria)}
                </span>
                <CategoriaBadge qtd={cat.qtd_vendida} />
              </div>
              {idx < categorias.length - 1 && DIVIDER}
            </li>
          ))}
          {categorias.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">
              Nenhuma categoria encontrada.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
