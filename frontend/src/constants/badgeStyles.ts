import type { ClienteStatus, ClientSegmento, OrderStatus, ProductCategory, ProductClassificacao, ReviewSentimento, SupportStatus, SupportType } from "@/types"

export const clienteStatusClasses: Record<ClienteStatus, string> = {
  "Novo":       "bg-indigo-50 text-indigo-600 border-indigo-200",
  "Recorrente": "bg-emerald-50 text-emerald-600 border-emerald-200",
}

export const segmentoClasses: Record<ClientSegmento, string> = {
  "Alto":  "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Medio": "bg-amber-50 text-amber-600 border-amber-200",
  "Baixo": "bg-slate-50 text-slate-500 border-slate-200",
}

export const categoryClasses: Record<ProductCategory, string> = {
  "Eletronicos":   "bg-[#C7D2FE]/30 text-[#6366F1] border-[#C7D2FE]",
  "Vestuario":     "bg-[#FECDD3]/30 text-[#F43F5E] border-[#FECDD3]",
  "Casa":          "bg-[#BBF7D0]/30 text-[#10B981] border-[#BBF7D0]",
  "Esportes":      "bg-[#FDE68A]/30 text-[#F59E0B] border-[#FDE68A]",
  "Beleza":        "bg-[#F5D0FE]/30 text-[#D946EF] border-[#F5D0FE]",
  "Automotivo":    "bg-[#E2E8F0]/30 text-[#64748B] border-[#E2E8F0]",
  "Brinquedos":    "bg-[#FFEDD5]/30 text-[#F97316] border-[#FFEDD5]",
  "Moveis":        "bg-[#CFFAFE]/30 text-[#06B6D4] border-[#CFFAFE]",
  "Sem categoria": "bg-[#CBD5E1]/30 text-[#94A3B8] border-[#CBD5E1]",
}

export const orderStatusClasses: Record<OrderStatus, string> = {
  "Aprovado":    "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Processando": "bg-amber-50 text-amber-600 border-amber-200",
  "Recusado":    "bg-rose-50 text-rose-600 border-rose-200",
  "Reembolsado": "bg-slate-50 text-slate-600 border-slate-200",
}

export const supportStatusClasses: Record<SupportStatus, string> = {
  "Aberto":    "bg-rose-50 text-rose-600 border-rose-200",
  "Resolvido": "bg-emerald-50 text-emerald-600 border-emerald-200",
}

export const supportTypeClasses: Record<SupportType, string> = {
  "Entrega":   "bg-sky-50 text-sky-600 border-sky-200",
  "Reembolso": "bg-amber-50 text-amber-600 border-amber-200",
  "Produto":   "bg-violet-50 text-violet-600 border-violet-200",
  "Pagamento": "bg-rose-50 text-rose-600 border-rose-200",
  "Outros":    "bg-slate-50 text-slate-600 border-slate-200",
}

export const classificacaoClasses: Record<ProductClassificacao, string> = {
  "Top Vendedor": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Estavel":      "bg-sky-50 text-sky-600 border-sky-200",
  "Problematico": "bg-amber-50 text-amber-600 border-amber-200",
  "Encalhado":    "bg-rose-50 text-rose-600 border-rose-200",
}

export const sentimentoClasses: Record<ReviewSentimento, string> = {
  "positivo": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "neutro":   "bg-amber-50 text-amber-600 border-amber-200",
  "negativo": "bg-rose-50 text-rose-600 border-rose-200",
}
