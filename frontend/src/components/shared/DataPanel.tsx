import { cn } from "@/lib/utils"

export function DataPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-7 rounded-lg border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  )
}
