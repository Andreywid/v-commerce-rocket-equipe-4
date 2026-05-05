export function Notice({ message }: { message: string }) {
  return (
    <div className="fixed right-6 top-6 z-50 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">
      {message}
    </div>
  )
}
