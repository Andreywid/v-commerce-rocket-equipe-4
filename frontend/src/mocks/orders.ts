import type { OrderFormValues, OrderRow, OrderStatus } from "@/types"

export const ordersStorageKey = "v-commerce-orders"

export const orderStatusOptions: OrderStatus[] = ["Processando", "Entregue", "Cancelado", "Em trânsito"]

export const initialOrders: OrderRow[] = [
  {
    id: "PROD-0001",
    product: "Perfume Premium",
    customer: "Nome do Cliente",
    value: "R$ 32.309,95",
    stock: "9.999",
    date: "29/12/2026",
    status: "Processando",
    quantity: "1x",
    prazo: "Fora do prazo",
  },
  {
    id: "PROD-0002",
    product: "Conjunto de Pincéis",
    customer: "Nome do Cliente",
    value: "R$ 47.346,82",
    stock: "123",
    date: "12/04/2026",
    status: "Entregue",
    quantity: "2x",
    prazo: "No prazo",
  },
  {
    id: "PROD-0003",
    product: "Barraca de Camping",
    customer: "Nome do Cliente",
    value: "R$ 899,90",
    stock: "24",
    date: "24/04/2026",
    status: "Cancelado",
    quantity: "6x",
    prazo: "No prazo",
  },
  {
    id: "PROD-0004",
    product: "Chupeta Premium",
    customer: "Nome do Cliente",
    value: "R$ 28.506,95",
    stock: "53",
    date: "25/04/2026",
    status: "Entregue",
    quantity: "3x",
    prazo: "Fora do prazo",
  },
  {
    id: "PROD-0005",
    product: "Vassoura Mágica",
    customer: "Nome do Cliente",
    value: "R$ 19.165,58",
    stock: "12",
    date: "26/04/2026",
    status: "Em trânsito",
    quantity: "4x",
    prazo: "Fora do prazo",
  },
  {
    id: "PROD-0006",
    product: "Violão Acústico",
    customer: "Nome do Cliente",
    value: "R$ 2.215,40",
    stock: "72",
    date: "27/04/2026",
    status: "Processando",
    quantity: "2x",
    prazo: "No prazo",
  },
]

export const emptyOrderForm: OrderFormValues = {
  product: "",
  customer: "",
  value: "",
  stock: "",
  date: "",
  status: "Processando",
  quantity: "",
  prazo: "No prazo",
}
