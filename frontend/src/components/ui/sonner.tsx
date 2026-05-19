"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info:    <InfoIcon className="size-4 text-indigo-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error:   <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-slate-400" />,
      }}
      style={
        {
          "--normal-bg":      "var(--color-slate-800)",
          "--normal-text":    "var(--color-slate-50)",
          "--normal-border":  "var(--color-slate-700)",
          "--success-bg":     "var(--color-slate-800)",
          "--success-text":   "var(--color-slate-50)",
          "--success-border": "var(--color-slate-700)",
          "--error-bg":       "var(--color-slate-800)",
          "--error-text":     "var(--color-slate-50)",
          "--error-border":   "var(--color-slate-700)",
          "--warning-bg":     "var(--color-slate-800)",
          "--warning-text":   "var(--color-slate-50)",
          "--warning-border": "var(--color-slate-700)",
          "--border-radius":  "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:       "cn-toast",
          description: "cn-toast-desc",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
