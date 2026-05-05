import { Bell } from "lucide-react"

export function Header({ onNotify }: { onNotify: () => void }) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-7">
      <div className="md:hidden">
        <div className="flex items-end gap-1.5">
          <span className="text-base font-bold text-indigo-600">V-Commerce</span>
          <span className="pb-0.5 text-[9px] font-medium text-slate-500">CRM 360</span>
        </div>
      </div>

      <div className="hidden md:block" />

      <div className="flex items-center gap-5">
        <button
          aria-label="Notificações"
          className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={onNotify}
          type="button"
        >
          <Bell className="size-4" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none text-slate-900">Mariana Albuquerque</p>
          <p className="mt-1 text-xs text-slate-500">V-Commerce CEO</p>
        </div>
      </div>
    </header>
  )
}
