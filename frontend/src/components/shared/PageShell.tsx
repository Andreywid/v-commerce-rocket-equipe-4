export function PageShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="relative flex-1 px-5 py-6 md:px-7">
      <h1 className="mb-6 text-2xl font-semibold leading-tight tracking-tight text-[#334155]">{title}</h1>
      {children}
    </section>
  )
}
