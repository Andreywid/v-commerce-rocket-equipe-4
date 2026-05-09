import { useState, useMemo } from "react"
import type { SortConfig } from "@/components/shared/DataTable"

export function useTableSort<T>(data: T[], getProperty: (item: T, key: string) => any) {
    const [sortConfig, setSortConfig] = useState<SortConfig<T>>(null)

  const sortedData = useMemo(() => {
    if (!sortConfig) return data

    return [...data].sort((a, b) => {
      const aValue = getProperty(a, sortConfig.key as string)
      const bValue = getProperty(b, sortConfig.key as string)

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })
  }, [data, sortConfig, getProperty])

  function handleSort(key: keyof T) {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") return { key, direction: "desc" }
        return null
      }
      return { key, direction: "asc" }
    })
  }

  return { sortedData, sortConfig, handleSort }
}