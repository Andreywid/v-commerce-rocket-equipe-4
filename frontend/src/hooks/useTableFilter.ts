// hooks/useTableFilters.ts
import { useState } from "react"

export function useTableFilters<T extends string>() {
  const [search, setSearch] = useState("")
  const [filterValue, setFilterValue] = useState<T | "Todos">("Todos")
  const [currentPage, setCurrentPage] = useState(1)

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleFilterChange(value: string) {
    setFilterValue(value as T | "Todos")
    setCurrentPage(1)
  }

  return {
    search,
    filterValue,
    currentPage,
    setCurrentPage,
    handleSearchChange,
    handleFilterChange,
  }
}