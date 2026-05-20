import { useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

import { Toaster } from "@/components/ui/sonner"
import { AppProvider } from "@/context/AppContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ClientsPage } from "@/pages/Clients"
import { Dashboard } from "@/pages/Dashboard"
import { LoginPage } from "@/pages/Login"
import { OrdersPage } from "@/pages/Orders"
import { ProductsPage } from "@/pages/Products"
import { SupportPage } from "@/pages/Support"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

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
    <QueryClientProvider client={queryClient}>
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
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
