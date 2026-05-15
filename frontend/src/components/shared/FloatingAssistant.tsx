import { Sparkles } from "lucide-react"

export function FloatingAssistant({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Assistente inteligente"
      className="fixed bottom-7 right-5 z-30 grid size-16 place-items-center rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-500/35 transition hover:-translate-y-0.5 hover:bg-indigo-500 md:right-7"
      onClick={onClick}
      type="button"
    >
      <Sparkles className="size-7" />
    </button>
  )
}
