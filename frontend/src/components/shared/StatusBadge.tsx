import { Badge } from "@/components/ui/badge"

export function StatusBadge({ children, className }: { children: React.ReactNode; className: string }) {
  return <Badge className={`ring-1 ${className}`}>{children}</Badge>
}
