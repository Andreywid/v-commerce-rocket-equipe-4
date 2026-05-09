import type { OrderFormValues, OrderRow, OrderStatus } from "@/types"

export const ordersStorageKey = "v-commerce-orders"

export const orderStatusOptions: OrderStatus[] = ["Processando", "Entregue", "Cancelado", "Em trânsito"]

export const initialOrders: OrderRow[] = [
  {
    id: "PROD-0001",
    product: "Perfume Premium",
    customer: "Nome do Cliente da Silva Júnior",
    value: 32309.95,
    stock: 9999,
    date: new Date("2026-12-29T12:00:00"),
    status: "Processando",
    quantity: 1,
    timeline: "No Prazo",
  },
  {
    id: "PROD-0002",
    product: "Conjunto de Pincéis",
    customer: "Nome do Cliente da Silva Júnior",
    value: 47346.82,
    stock: 123,
    date: new Date("2026-04-12T12:00:00"),
    status: "Entregue",
    quantity: 2,
    timeline: "No Prazo",
  },
  {
    id: "PROD-0003",
    product: "Barraca de Camping",
    customer: "Nome do Cliente da Silva Júnior",
    value: 899.90,
    stock: 24,
    date: new Date("2026-04-24T12:00:00"),
    status: "Cancelado",
    quantity: 6,
    timeline: "Fora do Prazo",
  },
  {
    id: "PROD-0004",
    product: "Chupeta Premium",
    customer: "Nome do Cliente da Silva Júnior",
    value: 28506.95,
    stock: 53,
    date: new Date("2026-04-25T12:00:00"),
    status: "Entregue",
    quantity: 3,
    timeline: "No Prazo",
  },
  {
    id: "PROD-0005",
    product: "Vassoura Mágica",
    customer: "Nome do Cliente da Silva Júnior",
    value: 19165.58,
    stock: 12,
    date: new Date("2026-04-26T12:00:00"),
    status: "Em trânsito",
    quantity: 4,
    timeline: "Fora do Prazo",
  },
  {
    id: "PROD-0006",
    product: "Violão Acústico",
    customer: "Nome do Cliente da Silva Júnior",
    value: 2215.40,
    stock: 72,
    date: new Date("2026-04-27T12:00:00"),
    status: "Processando",
    quantity: 2,
    timeline: "No Prazo",
  },
]

export const emptyOrderForm: OrderFormValues = {
  product: "",
  customer: "",
  value: 0,
  stock: 0,
  date: new Date(),
  status: "Processando",
  quantity: 1,
  timeline: "No Prazo",
}