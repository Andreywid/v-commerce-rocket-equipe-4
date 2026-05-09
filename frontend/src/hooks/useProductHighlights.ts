import { useMemo } from "react"
import type { ProductRow } from "@/types"

export function useProductHighlights(products: ProductRow[]) {
  return useMemo(() => {
    if (products.length === 0) return null
    
    const mostSold = products.reduce((a, b) => (a.sold > b.sold ? a : b))
    const leastSold = products.reduce((a, b) => (a.sold < b.sold ? a : b))
    const bestRated = products.reduce((a, b) => (a.rating > b.rating ? a : b))
    const worstRated = products.reduce((a, b) => (a.rating < b.rating ? a : b))
    
    return { mostSold, leastSold, bestRated, worstRated }
  }, [products])
}