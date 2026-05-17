import { 
  Smartphone, 
  Shirt, 
  Home, 
  Trophy, 
  Sparkles, 
  Car, 
  Gamepad2, 
  Armchair, 
  Package
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Dicionário para correção das etiquetas de categorias de produtos.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  "Eletronicos":   "Eletrônicos",
  "Vestuario":     "Vestuário",
  "Casa":          "Casa",
  "Esportes":      "Esportes",
  "Beleza":        "Beleza",
  "Automotivo":    "Automotivo",
  "Brinquedos":    "Brinquedos",
  "Moveis":        "Móveis",
  "Sem categoria": "Sem categoria",
};

/**
 * Mapeamento de ícones por categoria.
 */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Eletronicos":   Smartphone,
  "Vestuario":     Shirt,
  "Casa":          Home,
  "Esportes":      Trophy,
  "Beleza":        Sparkles,
  "Automotivo":    Car,
  "Brinquedos":    Gamepad2,
  "Moveis":        Armchair,
  "Sem categoria": Package,
};

/**
 * Retorna o label corrigido para uma categoria.
 */
export function formatCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * Retorna o ícone correspondente à categoria.
 */
export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] || Package;
}

import type { RatingLabel } from "@/types"

export function getRatingLabel(nota: number): RatingLabel {
  if (nota >= 4.5) return "Excelente"
  if (nota >= 4.0) return "Ótimo"
  if (nota >= 3.0) return "Bom"
  return "Crítico"
}
