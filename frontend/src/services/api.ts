const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api/v1"

export class HttpError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token")

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    })
  } catch {
    throw new HttpError(0, "network_error")
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Erro desconhecido" })) as { detail: string }
    throw new HttpError(response.status, body.detail)
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
}
