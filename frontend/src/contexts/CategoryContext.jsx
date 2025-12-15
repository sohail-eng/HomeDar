import { createContext, useContext, useState, useCallback } from 'react'
import { getCategories, getCategoryById } from '../services/categoryService'

const CategoryContext = createContext()

export const useCategory = () => {
  const context = useContext(CategoryContext)
  if (!context) {
    throw new Error('useCategory must be used within a CategoryProvider')
  }
  return context
}

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getCategories()

      if (result.success) {
        setCategories(result.data || [])
        setError(null)
      } else {
        setError(result.error)
        setCategories([])
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch categories')
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch category by ID
  const fetchCategoryById = useCallback(async (categoryId) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getCategoryById(categoryId)

      if (result.success) {
        setCurrentCategory(result.data)
        setError(null)
      } else {
        setError(result.error)
        setCurrentCategory(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch category')
      setCurrentCategory(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Select category
  const selectCategory = useCallback((categoryId) => {
    setSelectedCategoryId(categoryId)
  }, [])

  const value = {
    // State
    categories,
    currentCategory,
    selectedCategoryId,
    loading,
    error,

    // Actions
    fetchCategories,
    fetchCategoryById,
    selectCategory,
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

