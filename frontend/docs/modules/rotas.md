# Módulo de Roteamento e Autenticação (Frontend)

## Visão Geral

O roteamento é feito pelo **React Router DOM v7** com `BrowserRouter`. A autenticação é baseada em JWT armazenado no `localStorage`; a guarda de rota verifica a presença de `userEmail` no estado do `App.tsx`.

## Responsabilidades

1. Definir o mapa de rotas públicas e protegidas
2. Impedir acesso a rotas protegidas sem autenticação
3. Redirecionar usuários autenticados para `/` caso acessem `/login`
4. Persistir a sessão entre reloads via `localStorage`
5. Expor callbacks de login/logout para o `AppLayout`

## Arquitetura Interna

### Mapa de rotas

```
/login          → <LoginPage>    (pública)
/               → <Dashboard>    (protegida)
/produtos       → <ProductsPage> (protegida)
/clientes       → <ClientsPage>  (protegida)
/pedidos        → <OrdersPage>   (protegida)
/suporte        → <SupportPage>  (protegida)
*               → redireciona para /login (não autenticado)
                  ou para / (autenticado)
```

### Guarda de rota

```typescript
// App.tsx — lógica simplificada
const [sessionEmail, setSessionEmail] = useState(
  () => localStorage.getItem("userEmail") ?? ""
)
const [sessionName, setSessionName] = useState(
  () => localStorage.getItem("userName") ?? ""
)

// JSX da rota protegida:
sessionEmail
  ? <AppProvider>
      <AppLayout
        userEmail={sessionEmail}
        userName={sessionName}
        onLogout={handleLogout}
      />
    </AppProvider>
  : <Navigate replace to="/login" />
```

## Fluxo de Login

```
Usuário submete formulário (email + senha)
         │
         ▼
LoginPage::handleSubmit()
│
├── api.post("/auth/login", { email, password })
│       └── Backend valida credenciais → retorna { access_token, user }
│
├── localStorage.setItem("token", access_token)
├── localStorage.setItem("userEmail", user.email)
├── localStorage.setItem("userName", user.name)
│
└── onLogin(user.email, user.name)
        └── App.tsx: setSessionEmail + setSessionName
                  └── re-render → rota protegida liberada → redireciona /
```

## Fluxo de Logout

```
Usuário clica em "Sair" no Sidebar
         │
         ▼
AppLayout::onLogout()
│
├── localStorage.removeItem("token")
├── localStorage.removeItem("userEmail")
├── localStorage.removeItem("userName")
│
└── App.tsx: setSessionEmail("") + setSessionName("")
         └── re-render → guarda falha → <Navigate to="/login" />
```

## Integração com Outros Módulos

| Módulo | Direção | Descrição |
|---|---|---|
| `AppLayout` | → usa | Recebe `onLogout`, exibe `userEmail`/`userName` |
| `LoginPage` | → usa | Chama `onLogin` após login bem-sucedido |
| `api.ts` | ← usa | `api.post("/auth/login", ...)` |
| [arquitetura.md](arquitetura.md) | contexto | Visão macro da árvore de componentes |

## Tratamento de Erros

| Situação | Comportamento |
|---|---|
| Credenciais inválidas | LoginPage exibe `showNotice("Erro: ...")` via HttpError |
| Token expirado | Próxima requisição HTTP retorna 401 → `HttpError` propagado para a página |
| Rota inexistente (sem auth) | `<Navigate replace to="/login" />` |
| Rota inexistente (com auth) | `<Navigate replace to="/" />` |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `src/App.tsx` | Estado de sessão, guarda de rota, callbacks login/logout |
| `src/pages/Login.tsx` | Formulário de login, chamada à API, callback `onLogin` |
| `src/components/layout/AppLayout.tsx` | Recebe `onLogout`, passa para Sidebar |
| `src/components/layout/Sidebar.tsx` | Botão "Sair" que chama `onLogout` |

## Glossário

| Termo | Significado |
|---|---|
| Guarda de rota | Verificação condicional antes de renderizar uma rota protegida |
| `sessionEmail` | Estado derivado do `localStorage`; ausência indica usuário não autenticado |
| `<Navigate replace>` | Componente do React Router que redireciona substituindo a entrada no histórico |
| Bearer | Esquema de autenticação HTTP; token JWT é enviado no header `Authorization: Bearer <token>` |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Frontend | **Status**: Produção
