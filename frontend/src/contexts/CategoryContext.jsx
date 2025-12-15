import { createContext, useContext, useState, useCallback } from 'react'
import { getCategories, getCategoryById } from '../services/categoryService'
import { getSubCategories, getSubCategoriesByCategory } from '../services/subCategoryService'

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
  const [subCategories, setSubCategories] = useState([])
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

  // Fetch all subcategories
  const fetchSubCategories = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getSubCategories()

      if (result.success) {
        setSubCategories(result.data || [])
        setError(null)
      } else {
        setError(result.error)
        setSubCategories([])
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch subcategories')
      setSubCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch subcategories by category
  const fetchSubCategoriesByCategory = useCallback(async (categoryId) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getSubCategoriesByCategory(categoryId)

      if (result.success) {
        setSubCategories(result.data || [])
        setSelectedCategoryId(categoryId)
        setError(null)
      } else {
        setError(result.error)
        setSubCategories([])
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch subcategories')
      setSubCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Select category
  const selectCategory = useCallback((categoryId) => {
    setSelectedCategoryId(categoryId)
    if (categoryId) {
      fetchSubCategoriesByCategory(categoryId)
    } else {
      fetchSubCategories()
    }
  }, [fetchSubCategoriesByCategory, fetchSubCategories])

  const value = {
    // State
    categories,
    subCategories,
    currentCategory,
    selectedCategoryId,
    loading,
    error,

    // Actions
    fetchCategories,
    fetchCategoryById,
    fetchSubCategories,
    fetchSubCategoriesByCategory,
    selectCategory,
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}

