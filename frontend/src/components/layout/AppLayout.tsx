import { useState } from "react"
import { Outlet } from "react-router-dom"

import { AssistantPanel } from "@/components/shared/AssistantPanel"
import { FloatingAssistant } from "@/components/shared/FloatingAssistant"
import { Header } from "./Header"
import { Sidebar } from "./Sidebar"

export function AppLayout({ email, name, onLogout }: { email: string; name: string; onLogout: () => void }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <main className="min-h-dvh w-full bg-[#fbfcff] text-slate-900">
      <div className="grid min-h-dvh w-full grid-cols-1 bg-[#fbfcff] md:grid-cols-[270px_1fr]">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} onLogout={onLogout} />
        <div className="flex min-w-0 flex-col">
          <Header
            email={email}
            name={name}
            onMenuOpen={() => setIsMobileMenuOpen(true)}
          />
          <Outlet />
        </div>
      </div>

      <FloatingAssistant onClick={() => setIsAssistantOpen((o) => !o)} isOpen={isAssistantOpen} />
      <AssistantPanel
        isVisible={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </main>
  )
}
