import { NavLink } from "react-router-dom"
import { HeartHandshake, LayoutDashboard, LogOut, Package, Tag, Users, type LucideIcon } from "lucide-react"

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

export function Sidebar() {
  return (
    <aside className="flex border-b border-slate-200 bg-white md:min-h-screen md:flex-col md:border-b-0 md:border-r">
      <div className="hidden px-8 py-8 md:block">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold leading-tight text-indigo-600">V-Commerce</span>
          <span className="text-[11px] font-semibold text-slate-500">CRM 360</span>
        </div>
      </div>

      <nav className="flex w-full gap-2 overflow-x-auto px-4 py-3 md:block md:px-4 md:py-0">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition md:mb-2 md:w-full",
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

      <button className="mt-auto hidden h-11 items-center gap-3 px-7 text-sm font-medium text-slate-600 transition hover:text-indigo-600 md:flex">
        <LogOut className="size-4" />
        Sair
      </button>
    </aside>
  )
}
