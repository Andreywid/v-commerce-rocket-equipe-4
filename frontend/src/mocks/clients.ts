import type { ClientFormValues, ClientRow, ClientStatus } from "@/types"

export const clientsStorageKey = "v-commerce-clients"

export const clientStatusOptions: ClientStatus[] = ["Novo", "Recorrente"]

export const initialClients: ClientRow[] = [
  {
    id: "CLI-0001",
    name: "Maria Day",
    location: "Jaguaribara, CE",
    status: "Novo",
    lastOrder: "29/07/2025",
    orderCount: 1,
    total: "R$ 32.309,95",
  },
  {
    id: "CLI-0002",
    name: "Kevin Cantu",
    location: "Rio de Janeiro, RJ",
    status: "Recorrente",
    lastOrder: "31/01/2024",
    orderCount: 1,
    total: "R$ 32.309,95",
  },
  {
    id: "CLI-0003",
    name: "Katherine Smith",
    location: "Cuiabá, MT",
    status: "Novo",
    lastOrder: "03/02/2024",
    orderCount: 2,
    total: "R$ 32.309,95",
  },
  {
    id: "CLI-0004",
    name: "Ronald Daniel",
    location: "Rio Branco, AC",
    status: "Novo",
    lastOrder: "21/03/2024",
    orderCount: 2,
    total: "R$ 32.309,95",
  },
  {
    id: "CLI-0005",
    name: "Tony Li",
    location: "Salvador, BA",
    status: "Recorrente",
    lastOrder: "11/02/2024",
    orderCount: 1,
    total: "R$ 32.309,95",
  },
  {
    id: "CLI-0006",
    name: "Brandon Glover",
    location: "Blumenau, SC",
    status: "Recorrente",
    lastOrder: "09/11/2025",
    orderCount: 4,
    total: "R$ 32.309,95",
  },
]

export const emptyClientForm: ClientFormValues = {
  name: "",
  location: "",
  status: "Novo",
  lastOrder: "",
  orderCount: 0,
  total: "",
}
