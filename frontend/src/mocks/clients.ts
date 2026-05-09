import type { ClientFormValues, ClientRow, ClientStatus } from "@/types"

export const clientsStorageKey = "v-commerce-clients"

export const clientStatusOptions: ClientStatus[] = ["Novo", "Recorrente"]

export const initialClients: ClientRow[] = [
  {
    id: "CLI-0001",
    name: "Maria Day",
    location: "Jaguaribara, CE",
    status: "Novo",
    lastOrder: new Date("2025-07-29T12:00:00"), 
    orderCount: 1,
    total: 1250.00, 
  },
  {
    id: "CLI-0002",
    name: "Kevin Cantu",
    location: "Rio de Janeiro, RJ",
    status: "Recorrente",
    lastOrder: new Date("2024-01-31T12:00:00"),
    orderCount: 1,
    total: 4890.50,
  },
  {
    id: "CLI-0003",
    name: "Katherine Smith",
    location: "Cuiabá, MT",
    status: "Novo",
    lastOrder: new Date("2024-02-03T12:00:00"),
    orderCount: 2,
    total: 8320.75,
  },
  {
    id: "CLI-0004",
    name: "Ronald Daniel",
    location: "Rio Branco, AC",
    status: "Novo",
    lastOrder: new Date("2024-03-21T12:00:00"),
    orderCount: 2,
    total: 540.00,
  },
  {
    id: "CLI-0005",
    name: "Tony Li",
    location: "Salvador, BA",
    status: "Recorrente",
    lastOrder: new Date("2024-02-11T12:00:00"),
    orderCount: 1,
    total: 12450.20,
  },
  {
    id: "CLI-0006",
    name: "Brandon Glover",
    location: "Blumenau, SC",
    status: "Recorrente",
    lastOrder: new Date("2025-11-09T12:00:00"),
    orderCount: 4,
    total: 45900.10,
  },
]

export const emptyClientForm: ClientFormValues = {
  name: "",
  location: "",
  status: "Novo",
  lastOrder: new Date(), 
  orderCount: 0,
  total: 0,
}