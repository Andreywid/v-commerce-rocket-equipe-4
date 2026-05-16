import barracaCampingImage from "@/assets/products/barraca-camping.jpg"
import chupetaPremiumImage from "@/assets/products/chupeta-premium.jpg"
import conjuntoPinceisImage from "@/assets/products/conjunto-pinceis.jpg"
import iphone16ProImage from "@/assets/products/iphone-16-pro.jpg"
import motorolaEdge60Image from "@/assets/products/motorola-edge-60.jpg"
import perfumePremiumImage from "@/assets/products/perfume-premium.jpg"
import samsungS25Image from "@/assets/products/samsung-s25.jpg"
import vassouraMagicaImage from "@/assets/products/vassoura-magica.jpg"
import violaoAcusticoImage from "@/assets/products/violao-acustico.jpg"

import type { ProductRow } from "@/types"

export const productImagesById: Record<string, string> = {
  "PROD-0001": perfumePremiumImage,
  "PROD-0002": conjuntoPinceisImage,
  "PROD-0003": barracaCampingImage,
  "PROD-0004": chupetaPremiumImage,
  "PROD-0005": vassouraMagicaImage,
  "PROD-0006": violaoAcusticoImage,
  "PROD-0007": iphone16ProImage,
  "PROD-0008": samsungS25Image,
  "PROD-0009": motorolaEdge60Image,
}

export function getProductImage(product: ProductRow) {
  return product.imageUrl ?? productImagesById[product.id]
}
