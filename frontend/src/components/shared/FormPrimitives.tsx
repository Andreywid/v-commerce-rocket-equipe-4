import { X } from "lucide-react"

export function ModalFrame({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <section className="w-full max-w-xl rounded-lg bg-white p-5 shadow-2xl shadow-slate-950/25">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            aria-label="Fechar"
            className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

export function ModalActions({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        onClick={onClose}
        type="button"
      >
        Cancelar
      </button>
      <button className="h-10 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800" type="submit">
        {submitLabel}
      </button>
    </div>
  )
}

export function FormInput({
  label,
  onChange,
  placeholder,
  required = true,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <input
        className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder ?? label}
        required={required}
        value={value}
      />
    </label>
  )
}

export function FormSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
      {label}
      <select
        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
