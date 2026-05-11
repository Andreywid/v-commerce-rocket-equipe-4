import { LogIn } from "lucide-react"
import { useState } from "react"

import loginHero from "@/assets/login-hero.png"

export function LoginPage({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState("")

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

          <form
            className="space-y-5 text-center"
            onSubmit={(event) => {
              event.preventDefault()
              onLogin(email)
            }}
          >
            <div>
              <h1 className="text-xl font-bold text-slate-950">Entrar na sua conta</h1>
              <p className="mt-2 text-xs text-slate-500">Insira seu e-mail para entrar na sua conta</p>
            </div>

            <label className="block text-left">
              <span className="sr-only">E-mail</span>
              <input
                className="h-10 w-full rounded-md border border-slate-200 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nome@exemplo.com"
                required
                type="email"
                value={email}
              />
            </label>

            <button
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              <LogIn className="size-4" />
              Entrar
            </button>

            <p className="mx-auto max-w-[290px] text-xs leading-5 text-slate-500">
              Ao clicar em criar conta, você concorda com nossos Termos de serviço e nossa Política de privacidade.
            </p>

            <div className="flex items-center justify-center gap-5 pt-8 text-xs">
              <span className="text-slate-500">Não tem uma conta?</span>
              <button className="font-semibold text-slate-900 transition hover:text-indigo-600" type="button">
                Criar uma conta
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
