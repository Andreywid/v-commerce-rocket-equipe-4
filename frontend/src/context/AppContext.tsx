/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

import type { ClientFormValues, ClientRow, OrderFormValues, OrderRow, ProductFormValues, ProductRow, SupportFormValues, SupportRow } from "@/types"
import { initialClients, clientsStorageKey } from "@/mocks/clients"
import { initialOrders, ordersStorageKey } from "@/mocks/orders"
import { initialProducts, productsStorageKey } from "@/mocks/products"
import { initialSupportTickets, supportStorageKey } from "@/mocks/tickets"
import { createClientId, createOrderId, createProductId, createTicketId, readStoredRows } from "@/helpers/storage"

type AppContextValue = {
  orders: OrderRow[]
  addOrder: (values: OrderFormValues) => void
  tickets: SupportRow[]
  addTicket: (values: SupportFormValues) => void
  updateTicket: (index: number, values: SupportFormValues) => void
  products: ProductRow[]
  addProduct: (values: ProductFormValues) => void
  updateProduct: (index: number, values: ProductFormValues) => void
  deleteProduct: (index: number) => void
  clients: ClientRow[]
  addClient: (values: ClientFormValues) => void
  updateClient: (index: number, values: ClientFormValues) => void
  showNotice: (message: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRow[]>(() => readStoredRows(ordersStorageKey, initialOrders))
  const [tickets, setTickets] = useState<SupportRow[]>(() => readStoredRows(supportStorageKey, initialSupportTickets))
  const [products, setProducts] = useState<ProductRow[]>(() => readStoredRows(productsStorageKey, initialProducts))
  const [clients, setClients] = useState<ClientRow[]>(() => readStoredRows(clientsStorageKey, initialClients))
  useEffect(() => {
    localStorage.setItem(ordersStorageKey, JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem(supportStorageKey, JSON.stringify(tickets))
  }, [tickets])

  useEffect(() => {
    localStorage.setItem(productsStorageKey, JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem(clientsStorageKey, JSON.stringify(clients))
  }, [clients])

  function showNotice(message: string) {
    toast(message)
  }

  function addOrder(values: OrderFormValues) {
    setOrders((current) => [{ id: createOrderId(current), ...values }, ...current])
  }

  function addTicket(values: SupportFormValues) {
    setTickets((current) => [{ ticket: createTicketId(current), ...values }, ...current])
  }

  function updateTicket(index: number, values: SupportFormValues) {
    setTickets((current) =>
      current.map((ticket, i) => (i === index ? { ...ticket, ...values } : ticket)),
    )
  }

  function addProduct(values: ProductFormValues) {
    setProducts((current) => [{ id: createProductId(current), ...values }, ...current])
  }

  function updateProduct(index: number, values: ProductFormValues) {
    setProducts((current) =>
      current.map((product, i) => (i === index ? { ...product, ...values } : product)),
    )
  }

  function deleteProduct(index: number) {
    setProducts((current) => current.filter((_, i) => i !== index))
  }

  function addClient(values: ClientFormValues) {
    setClients((current) => [{ id: createClientId(current), ...values }, ...current])
  }

  function updateClient(index: number, values: ClientFormValues) {
    setClients((current) =>
      current.map((client, i) => (i === index ? { ...client, ...values } : client)),
    )
  }

  return (
    <AppContext.Provider value={{ orders, addOrder, tickets, addTicket, updateTicket, products, addProduct, updateProduct, deleteProduct, clients, addClient, updateClient, showNotice }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useAppContext must be used within AppProvider")
  return context
}
