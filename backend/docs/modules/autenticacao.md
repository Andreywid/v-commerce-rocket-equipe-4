# Módulo de Autenticação e Segurança (Backend)

## Visão Geral

A autenticação usa **JWT (HS256)** com expiração de 8 horas e senhas armazenadas com **bcrypt**. O controle de acesso é baseado em dois papéis: `admin` e `viewer`. O endpoint de login é protegido por **rate limiting** de 5 requisições/minuto por IP.

## Responsabilidades

1. Verificar credenciais e emitir tokens JWT
2. Validar tokens em todas as requisições protegidas via `HTTPBearer`
3. Controlar acesso a operações de escrita via `require_admin`
4. Hash e verificação segura de senhas com bcrypt
5. Limitar tentativas de login por IP com SlowAPI

## Arquitetura Interna

### Fluxo completo de login

```
POST /auth/login  { email, password }
         │
         ▼
auth_service.login(db, email, password)
         │
         ├── user_repository.get_by_email(db, email)
         │       └── 401 se não encontrado
         ├── verify_password(password, user.hashed_password)
         │       └── bcrypt.checkpw  →  401 se inválido
         └── create_access_token({ "sub": str(user.id) })
                 ├── payload["exp"] = now() + 480 minutos
                 └── jwt.encode(payload, SECRET_KEY, algorithm="HS256")
         │
         ▼
{ access_token, token_type: "bearer", user: UserOut }
```

### Fluxo de validação de token (por requisição)

```
Authorization: Bearer <token>
         │
         ▼
Depends(get_current_user)
         │
         ├── HTTPBearer extrai o token do header
         ├── decode_token(token)
         │       ├── jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
         │       └── JWTError → 401 "Token inválido"
         ├── user_id = int(payload["sub"])
         ├── user_repository.get_by_id(db, user_id)
         │       └── None → 401 "Usuário não encontrado"
         └── verifica user.is_active
                 └── False → 401 "Conta inativa"
         │
         ▼
retorna User (injetado na rota)
```

### Verificação de papel admin

```python
# core/deps.py
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permissão insuficiente")
    return current_user
```

## Funções de Segurança (`core/security.py`)

```python
hash_password(password: str) -> str
# bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
# Usado em: seed.py (criação do admin), POST /customers

verify_password(plain: str, hashed: str) -> bool
# bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
# Usado em: auth_service.login()

create_access_token(data: dict) -> str
# Adiciona "exp" ao payload e assina com SECRET_KEY e ALGORITHM="HS256"
# Tempo de expiração: ACCESS_TOKEN_EXPIRE_MINUTES (padrão: 480 = 8h)

decode_token(token: str) -> dict
# jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
# Levanta JWTError se inválido, expirado ou assinatura incorreta
```

## Rate Limiting (`core/limiter.py`)

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

Aplicado exclusivamente ao endpoint de login:

```python
# api/v1/auth.py
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

Se o limite for excedido → **HTTP 429 Too Many Requests**.

## Papéis de Usuário

| Papel | Valor no banco | Permissões |
|---|---|---|
| Administrador | `admin` | Leitura + escrita em **todos** os recursos |
| Visualizador | `viewer` | Leitura em todos + escrita em recursos sem `require_admin` |

**Rotas que exigem `admin`:**
- `POST /products`, `PUT /products/{id}`, `DELETE /products/{id}`
- `POST /orders`, `PUT /orders/{id}`, `DELETE /orders/{id}`

## Configurações de Auth (`config.py`)

```python
SECRET_KEY: str = "change-me-in-production"   # assinar tokens JWT
ALGORITHM: str = "HS256"                       # algoritmo de assinatura
ACCESS_TOKEN_EXPIRE_MINUTES: int = 480         # 8 horas
```

> Rotacionar `SECRET_KEY` invalida **todos** os tokens emitidos anteriormente.

## Tratamento de Erros

| Situação | HTTP | Detalhe |
|---|---|---|
| E-mail não encontrado | 401 | "Credenciais inválidas" |
| Senha incorreta | 401 | "Credenciais inválidas" |
| Token inválido ou expirado | 401 | "Token inválido" |
| Usuário inativo | 401 | "Conta inativa" |
| Papel insuficiente | 403 | "Permissão insuficiente" |
| Login: excedeu 5 req/min | 429 | Mensagem padrão SlowAPI |

## Referências de Código

| Arquivo | Responsabilidade |
|---|---|
| `app/core/security.py` | hash_password, verify_password, create_access_token, decode_token |
| `app/core/deps.py` | get_current_user, require_admin |
| `app/core/limiter.py` | SlowAPI limiter com key_func=get_remote_address |
| `app/api/v1/auth.py` | POST /auth/login, GET /auth/me |
| `app/services/auth_service.py` | Orquestra login: get_by_email + verify + create_token |

## Glossário

| Termo | Significado |
|---|---|
| JWT | JSON Web Token — token compacto com payload assinado digitalmente |
| HS256 | HMAC com SHA-256 — algoritmo de assinatura simétrica |
| bcrypt | Algoritmo de hash adaptativo para senhas (custo computacional configurável) |
| HTTPBearer | Esquema de segurança FastAPI que extrai `Bearer <token>` do header |
| `sub` | Subject — campo padrão JWT que identifica o usuário (aqui: `str(user.id)`) |
| rate limiting | Limite de requisições por janela de tempo por cliente (IP) |

---

**Versão**: 1.0 | **Última Atualização**: Mai 2026 | **Autor**: Equipe Backend | **Status**: Produção
