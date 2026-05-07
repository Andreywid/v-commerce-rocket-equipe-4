import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function ModalActions({ onClose, submitLabel }: { onClose: () => void; submitLabel: string }) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button variant="outline" onClick={onClose} type="button">
        Cancelar
      </Button>
      <Button type="submit">{submitLabel}</Button>
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
  const id = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        required={required}
        value={value}
      />
    </div>
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
    <div className="grid gap-1.5">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
