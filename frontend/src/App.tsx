import { useState } from "react"
import { BrowserRouter, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { AppProvider } from "@/context/AppContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ClientsPage } from "@/pages/Clients"
import { Dashboard } from "@/pages/Dashboard"
import { OrdersPage } from "@/pages/Orders"
import { ProductsPage } from "@/pages/Products"
import { SupportPage } from "@/pages/Support"
import { LoginPage } from "@/pages/Login"

function App() {
  const [sessionEmail, setSessionEmail] = useState<string>(
    () => localStorage.getItem("userEmail") ?? "",
  )

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    setSessionEmail("")
  }

  return (
    <>
      <Toaster position="top-right" />
      {!sessionEmail ? (
        <LoginPage onLogin={setSessionEmail} />
      ) : (
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout email={sessionEmail} onLogout={handleLogout} />}>
                <Route index element={<Dashboard />} />
                <Route path="produtos" element={<ProductsPage />} />
                <Route path="clientes" element={<ClientsPage />} />
                <Route path="pedidos" element={<OrdersPage />} />
                <Route path="suporte" element={<SupportPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppProvider>
      )}
    </>
  )
}

export default App
