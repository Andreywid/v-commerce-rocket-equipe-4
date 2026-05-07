import { NavLink } from "react-router-dom"
import { HeartHandshake, LayoutDashboard, LogOut, Package, Tag, Users, type LucideIcon } from "lucide-react"

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/produtos", label: "Produtos", icon: Package },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/pedidos", label: "Pedidos", icon: Tag },
  { to: "/suporte", label: "Suporte", icon: HeartHandshake },
]

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-8 py-8">
      <span className="text-xl font-bold leading-tight text-indigo-600">V-Commerce</span>
      <span className="text-[11px] font-semibold text-slate-500">CRM 360</span>
    </div>
  )
}

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <nav className="px-4">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onItemClick}
            className={({ isActive }) =>
              [
                "mb-2 flex h-9 w-full items-center gap-2 rounded-md px-3 text-sm font-medium transition",
                isActive
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")
            }
          >
            <Icon className="size-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

function SidebarLogout() {
  return (
    <button className="mt-auto flex h-11 items-center gap-3 px-7 text-sm font-medium text-slate-600 transition hover:text-indigo-600">
      <LogOut className="size-4" />
      Sair
    </button>
  )
}

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────── */}
      <aside className="hidden min-h-screen flex-col border-r border-slate-200 bg-white md:flex">
        <SidebarLogo />
        <SidebarNav />
        <SidebarLogout />
      </aside>

      {/* ── Mobile Sheet ─────────────────────────────────────────────── */}
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <SheetContent side="left" showCloseButton={false} className="max-w-[270px] gap-0 p-0">
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SidebarLogo />
          <SidebarNav onItemClick={onClose} />
          <SidebarLogout />
        </SheetContent>
      </Sheet>
    </>
  )
}
