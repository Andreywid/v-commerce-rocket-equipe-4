import { Sparkles } from "lucide-react"

export function FloatingAssistant({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      aria-label="Assistente inteligente"
      className="fixed bottom-4 right-5 z-40 grid size-12 place-items-center rounded-full bg-[#4F46E5] shadow-xl shadow-indigo-500/35 transition hover:-translate-y-0.5 hover:bg-indigo-500 md:right-7"
      onClick={onClick}
      style={{ zIndex: isOpen ? 40 : 40 }}
      type="button"
    >
      <Sparkles className="size-5 fill-white" strokeWidth={0} />
    </button>
  )
}
