import { useState } from "react"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { toast } from "sonner"

import loginHero from "@/assets/login-hero.png"
import { api, HttpError } from "@/services/api"

type LoginResponse = {
  access_token: string
  token_type: string
  user: { id: number; email: string; name: string; role: string }
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function LoginPage({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!email.trim()) {
      toast.error("E-mail obrigatório", {
        description: "Insira seu e-mail para continuar.",
      })
      return
    }

    if (!isValidEmail(email)) {
      toast.error("E-mail inválido", {
        description: "Insira um e-mail no formato correto (ex: nome@dominio.com).",
      })
      return
    }

    if (!password) {
      toast.error("Senha obrigatória", {
        description: "Insira sua senha para continuar.",
      })
      return
    }

    setLoading(true)
    try {
      const data = await api.post<LoginResponse>("/auth/login", { email, password })
      localStorage.setItem("token", data.access_token)
      toast.success(`Bem-vindo, ${data.user.name}!`)
      onLogin(data.user.email)
    } catch (err) {
      if (err instanceof HttpError) {
        if (err.status === 0) {
          toast.error("Sem conexão com o servidor", {
            description: "Verifique se o backend está rodando e tente novamente.",
          })
        } else if (err.status === 401) {
          toast.error("Credenciais inválidas", {
            description: "E-mail ou senha incorretos. Verifique e tente novamente.",
          })
        } else if (err.status === 403) {
          toast.error("Acesso negado", {
            description: "Sua conta está inativa. Entre em contato com o suporte.",
          })
        } else if (err.status >= 500) {
          toast.error("Erro no servidor", {
            description: "Algo deu errado no servidor. Tente novamente em instantes.",
          })
        } else {
          toast.error("Erro ao entrar", {
            description: err.detail || "Tente novamente.",
          })
        }
      } else {
        toast.error("Erro inesperado", {
          description: "Tente novamente mais tarde.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-dvh bg-white text-slate-900 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
      <section className="relative hidden min-h-dvh overflow-hidden lg:block">
        <img
          alt="Atendente usando headset em ambiente de suporte"
          className="h-full w-full object-cover"
          src={loginHero}
        />
      </section>

      <section className="flex min-h-dvh items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-16 flex items-center justify-center">
            <img alt="V-Commerce CRM 360" className="h-7 w-auto" src="/V-Horizontal.svg" />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div className="text-center">
              <h1 className="text-xl font-bold text-slate-950">Entrar na sua conta</h1>
              <p className="mt-2 text-xs text-slate-500">
                Insira seu e-mail e senha para acessar o painel
              </p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">E-mail</span>
                <input
                  autoComplete="email"
                  className="h-10 w-full rounded-md border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                  disabled={loading}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@exemplo.com"
                  type="email"
                  value={email}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">Senha</span>
                <div className="relative">
                  <input
                    autoComplete="current-password"
                    className="h-10 w-full rounded-md border border-slate-200 px-4 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 disabled:opacity-50"
                    disabled={loading}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                    onClick={() => setShowPassword((v) => !v)}
                    type="button"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>
            </div>

            <button
              className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <LogIn className="size-4" />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-center text-xs leading-5 text-slate-400">
              Acesso restrito a usuários autorizados do sistema V-Commerce.
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
