import { Crown } from "lucide-react"

import type { ProductOut } from "@/types/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const DIVIDER = <div style={{ height: 1, backgroundColor: "#E2E8F0" }} />

function UnidadesBadge({ qtd }: { qtd: number }) {
  return (
    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600 whitespace-nowrap">
      {qtd.toLocaleString("pt-BR")} unidades vendidas
    </span>
  )
}

export function TopProdutosModal({
  onClose,
  produtos,
}: {
  onClose: () => void
  produtos: ProductOut[]
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
            Top 5 Produtos
          </DialogTitle>
        </DialogHeader>

        {DIVIDER}

        <ul>
          {produtos.map((produto, idx) => (
            <li key={produto.id_produto}>
              <div className="flex items-center justify-between gap-4 py-4 transition-transform duration-300 ease-in-out hover:scale-[1.012] hover:cursor-default">
                <span className="truncate text-[15px] font-semibold text-slate-900">
                  {idx + 1}. {produto.nome_produto}
                </span>
                <UnidadesBadge qtd={produto.qtd_vendida_total} />
              </div>
              {idx < produtos.length - 1 && DIVIDER}
            </li>
          ))}
          {produtos.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">
              Nenhum produto encontrado.
            </li>
          )}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
