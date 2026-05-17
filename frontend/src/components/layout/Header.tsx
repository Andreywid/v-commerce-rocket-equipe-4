import { Menu, User } from "lucide-react"

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar"

function displayName(name: string, email: string): string {
  if (name) return name
  const local = email.split("@")[0] ?? ""
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function Header({
  email,
  name,
  onMenuOpen,
}: {
  email: string
  name: string
  onMenuOpen: () => void
}) {
  const resolvedName = displayName(name, email)

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 md:px-7">
      {/* Left: hamburger (mobile) or spacer (desktop) */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          aria-label="Abrir menu"
          className="grid size-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={onMenuOpen}
          type="button"
        >
          <Menu className="size-5" />
        </button>
        <img src="/V-Horizontal.svg" alt="V-Commerce" className="h-4 w-auto" />
      </div>
      <div className="hidden md:block" />

      {/* Right: avatar + user info */}
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-slate-100 text-slate-600">
            <User className="size-4" />
          </AvatarFallback>
          <AvatarBadge className="bg-emerald-500" />
        </Avatar>

        <div className="hidden sm:block">
          <p className="text-sm font-semibold leading-none text-slate-900">{resolvedName}</p>
          <p className="mt-1 text-xs text-slate-500">{email}</p>
        </div>
      </div>
    </header>
  )
}
