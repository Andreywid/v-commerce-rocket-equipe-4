import { useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { Toaster } from "@/components/ui/sonner"
import { AppProvider } from "@/context/AppContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ClientsPage } from "@/pages/Clients"
import { Dashboard } from "@/pages/Dashboard"
import { LoginPage } from "@/pages/Login"
import { OrdersPage } from "@/pages/Orders"
import { ProductsPage } from "@/pages/Products"
import { SupportPage } from "@/pages/Support"

function App() {
  const [sessionEmail, setSessionEmail] = useState<string>(
    () => localStorage.getItem("userEmail") ?? "",
  )
  const [sessionName, setSessionName] = useState<string>(
    () => localStorage.getItem("userName") ?? "",
  )

  function handleLogin(email: string, name: string = "") {
    localStorage.setItem("userEmail", email)
    localStorage.setItem("userName", name)
    setSessionEmail(email)
    setSessionName(name)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userName")
    setSessionEmail("")
    setSessionName("")
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="login"
          element={
            sessionEmail ? <Navigate replace to="/" /> : <LoginPage mode="login" onLogin={handleLogin} />
          }
        />
        <Route
          path="cadastro"
          element={
            sessionEmail ? <Navigate replace to="/" /> : <LoginPage mode="register" onLogin={handleLogin} />
          }
        />

        <Route
          element={
            sessionEmail ? (
              <AppProvider>
                <AppLayout email={sessionEmail} name={sessionName} onLogout={handleLogout} />
              </AppProvider>
            ) : (
              <Navigate replace to="/login" />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="produtos" element={<ProductsPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="suporte" element={<SupportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
