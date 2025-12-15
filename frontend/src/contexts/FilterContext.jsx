import { createContext, useContext, useState, useCallback } from 'react'

const FilterContext = createContext()

export const useFilter = () => {
  const context = useContext(FilterContext)
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider')
  }
  return context
}

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    // Price filters
    minPrice: '',
    maxPrice: '',
    
    // Date filters
    created_at_after: '',
    created_at_before: '',
    updated_at_after: '',
    updated_at_before: '',
    
    // Category filters
    category: null,
    subcategories: [],
    
    // Other filters
    sku: '',
    ordering: '-created_at',
  })

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }, [])

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      created_at_after: '',
      created_at_before: '',
      updated_at_after: '',
      updated_at_before: '',
      category: null,
      subcategories: [],
      sku: '',
      ordering: '-created_at',
    })
  }, [])

  // Toggle subcategory in filter
  const toggleSubcategory = useCallback((subcategoryId) => {
    setFilters((prev) => {
      const isSelected = prev.subcategories.includes(subcategoryId)
      return {
        ...prev,
        subcategories: isSelected
          ? prev.subcategories.filter((id) => id !== subcategoryId)
          : [...prev.subcategories, subcategoryId],
      }
    })
  }, [])

  // Clear subcategories
  const clearSubcategories = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      subcategories: [],
    }))
  }, [])

  // Get active filters count
  const getActiveFiltersCount = useCallback(() => {
    let count = 0
    if (filters.minPrice) count++
    if (filters.maxPrice) count++
    if (filters.created_at_after) count++
    if (filters.created_at_before) count++
    if (filters.updated_at_after) count++
    if (filters.updated_at_before) count++
    if (filters.category) count++
    if (filters.subcategories.length > 0) count++
    if (filters.sku) count++
    if (filters.ordering !== '-created_at') count++
    return count
  }, [filters])

  const value = {
    // State
    filters,

    // Actions
    updateFilter,
    updateFilters,
    resetFilters,
    toggleSubcategory,
    clearSubcategories,
    getActiveFiltersCount,
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}

