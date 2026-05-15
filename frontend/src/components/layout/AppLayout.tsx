import { useState } from "react"
import { Outlet, useLocation } from "react-router-dom"

import type { PageKey } from "@/types"
import { useAppContext } from "@/context/AppContext"
import { AssistantPanel } from "@/components/shared/AssistantPanel"
import { FloatingAssistant } from "@/components/shared/FloatingAssistant"
import { Toaster } from "@/components/ui/sonner"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

function deriveCurrentPage(pathname: string): PageKey {
  if (pathname.includes("pedidos")) return "orders"
  if (pathname.includes("suporte")) return "support"
  return "dashboard"
}

export function AppLayout({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { orders, tickets, showNotice } = useAppContext()
  const { pathname } = useLocation()
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-dvh w-full bg-[#fbfcff] text-slate-900">
      <div className="grid min-h-dvh w-full grid-cols-1 bg-[#fbfcff] md:grid-cols-[270px_1fr]">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} onLogout={onLogout} />
        <div className="flex min-w-0 flex-col">
          <Header
            email={email}
            onMenuOpen={() => setIsMobileMenuOpen(true)}
            onNotify={() => showNotice("Nenhuma nova notificação")}
          />
          <Outlet />
        </div>
      </div>

      <Toaster />
      <FloatingAssistant onClick={() => setIsAssistantOpen(true)} />
      {isAssistantOpen && (
        <AssistantPanel
          currentPage={deriveCurrentPage(pathname)}
          onClose={() => setIsAssistantOpen(false)}
          orders={orders}
          tickets={tickets}
        />
      )}
    </main>
  )
}
