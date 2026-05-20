/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react"
import { toast } from "sonner"

type AppContextValue = {
  showNotice: (message: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  function showNotice(message: string) {
    toast(message)
  }

  return (
    <AppContext.Provider value={{ showNotice }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useAppContext must be used within AppProvider")
  return context
}
