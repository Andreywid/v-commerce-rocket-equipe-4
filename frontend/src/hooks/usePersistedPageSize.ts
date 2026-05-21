import { useState } from "react"

const DEFAULT_PAGE_SIZE = 6
const VALID_SIZES = [6, 10, 20, 50]

export function usePersistedPageSize(pageKey: string): [number, (size: number) => void] {
  const storageKey = `pageSize:${pageKey}`

  const [pageSize, setPageSizeState] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      const parsed = stored ? parseInt(stored, 10) : NaN
      return VALID_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE
    } catch {
      return DEFAULT_PAGE_SIZE
    }
  })

  function setPageSize(size: number) {
    try {
      localStorage.setItem(storageKey, String(size))
    } catch {
      // localStorage indisponível — continua funcionando sem persistência
    }
    setPageSizeState(size)
  }

  return [pageSize, setPageSize]
}
