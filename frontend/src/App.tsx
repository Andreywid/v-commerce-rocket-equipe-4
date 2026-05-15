import { BrowserRouter, Route, Routes } from "react-router-dom"

import { AppProvider } from "@/context/AppContext"
import { AppLayout } from "@/components/layout/AppLayout"
import { ClientsPage } from "@/pages/Clients"
import { Dashboard } from "@/pages/Dashboard"
import { OrdersPage } from "@/pages/Orders"
import { ProductsPage } from "@/pages/Products"
import { SupportPage } from "@/pages/Support"
import { LoginPage } from "@/pages/Login"
import { useState } from "react"

function App() {
  const [sessionEmail, setSessionEmail] = useState("")

  if (!sessionEmail) {
    return <LoginPage onLogin={setSessionEmail} />
  }

  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout email={sessionEmail} onLogout={() => setSessionEmail("")} />}>
            <Route index element={<Dashboard />} />
            <Route path="produtos" element={<ProductsPage />} />
            <Route path="clientes" element={<ClientsPage />} />
            <Route path="pedidos" element={<OrdersPage />} />
            <Route path="suporte" element={<SupportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
