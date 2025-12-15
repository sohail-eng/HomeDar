import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const SearchContext = createContext()

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHistory, setSearchHistory] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimerRef = useRef(null)

  // Update search term
  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term)
  }, [])

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setIsSearching(false)
  }, [])

  // Add to search history
  const addToHistory = useCallback((term) => {
    if (term && term.trim()) {
      setSearchHistory((prev) => {
        const newHistory = [term.trim(), ...prev.filter((item) => item !== term.trim())]
        return newHistory.slice(0, 10) // Keep last 10 searches
      })
    }
  }, [])

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  // Debounced search
  const debouncedSearch = useCallback((term, callback, delay = 300) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setIsSearching(true)

    debounceTimerRef.current = setTimeout(() => {
      if (term && term.trim()) {
        addToHistory(term)
        callback(term.trim())
      } else {
        callback('')
      }
      setIsSearching(false)
    }, delay)
  }, [addToHistory])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const value = {
    // State
    searchTerm,
    searchHistory,
    isSearching,

    // Actions
    updateSearchTerm,
    clearSearch,
    addToHistory,
    clearHistory,
    debouncedSearch,
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}

