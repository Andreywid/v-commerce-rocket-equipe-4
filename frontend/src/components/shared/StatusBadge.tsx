export function StatusBadge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ${className}`}>
      {children}
    </span>
  )
}
