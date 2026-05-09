import type { ProductCategory, ProductFormValues, ProductRow, RatingLabel } from "@/types"

export const productsStorageKey = "v-commerce-products"

export const productCategoryOptions: ProductCategory[] = [
  "Perfumaria",
  "Artes",
  "Esporte",
  "Lazer",
  "Bebês",
  "Utilidades domésticas",
  "Instrumentos Musicais",
  "Tecnologia",
]

export const ratingLabelOptions: RatingLabel[] = ["Ótimo", "Bom", "Excelente", "Crítico"]

export const initialProducts: ProductRow[] = [
  {
    id: "PROD-0001",
    name: "Perfume Premium",
    categories: ["Perfumaria"],
    price: 32309.95,
    stock: 28,
    rating: 4.8,
    ratingLabel: "Ótimo",
    sold: 1240,
  },
  {
    id: "PROD-0002",
    name: "Conjunto de Pincéis",
    categories: ["Artes"],
    price: 47346.82,
    stock: 123,
    rating: 4.0,
    ratingLabel: "Bom",
    sold: 890,
  },
  {
    id: "PROD-0003",
    name: "Barraca de Camping",
    categories: ["Esporte", "Lazer"],
    price: 189.90,
    stock: 24,
    rating: 4.5,
    ratingLabel: "Ótimo",
    sold: 2100,
  },
  {
    id: "PROD-0004",
    name: "Chupeta Premium",
    categories: ["Bebês"],
    price: 28506.95,
    stock: 53,
    rating: 4.3,
    ratingLabel: "Bom",
    sold: 3300,
  },
  {
    id: "PROD-0005",
    name: "Vassoura Mágica",
    categories: ["Utilidades domésticas"],
    price: 19165.58,
    stock: 12,
    rating: 4.2,
    ratingLabel: "Excelente",
    sold: 420,
  },
  {
    id: "PROD-0006",
    name: "Violão Acústico",
    categories: ["Instrumentos Musicais"],
    price: 2215.40,
    stock: 72,
    rating: 3.6,
    ratingLabel: "Crítico",
    sold: 450,
  },
  {
    id: "PROD-0007",
    name: "IPhone 16 128GB",
    categories: ["Tecnologia"],
    price: 7499.00,
    stock: 156,
    rating: 4.9,
    ratingLabel: "Excelente",
    sold: 4879,
  },
  {
    id: "PROD-0008",
    name: "Samsung S25",
    categories: ["Tecnologia"],
    price: 5299.00,
    stock: 89,
    rating: 4.1,
    ratingLabel: "Bom",
    sold: 68,
  },
  {
    id: "PROD-0009",
    name: "Motorola Edge 60",
    categories: ["Tecnologia"],
    price: 3199.00,
    stock: 210,
    rating: 2.3,
    ratingLabel: "Crítico",
    sold: 312,
  },
]

export const emptyProductForm: ProductFormValues = {
  name: "",
  categories: ["Perfumaria"],
  price: 0,
  stock: 0,
  rating: 5.0,
  ratingLabel: "Bom",
  sold: 0,
}