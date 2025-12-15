import { createContext, useContext, useState, useCallback } from 'react'
import { getProducts, getProductById } from '../services/productService'

const ProductContext = createContext()

export const useProduct = () => {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider')
  }
  return context
}

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([])
  const [currentProduct, setCurrentProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    totalPages: 0,
    count: 0,
    next: null,
    previous: null,
  })
  const [filters, setFilters] = useState({
    search: '',
    sku: '',
    minPrice: '',
    maxPrice: '',
    subcategories: [],
    ordering: '-created_at',
    created_at_after: '',
    created_at_before: '',
    updated_at_after: '',
    updated_at_before: '',
  })

  // Fetch products with current filters
  const fetchProducts = useCallback(async (page = 1, additionalFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const params = {
        page,
        page_size: pagination.pageSize,
        ...filters,
        ...additionalFilters,
      }

      // Clean up empty values
      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key]
        }
      })

      // Handle subcategories array
      if (params.subcategories && Array.isArray(params.subcategories) && params.subcategories.length > 0) {
        params.subcategories = params.subcategories.join(',')
      } else if (params.subcategories && !Array.isArray(params.subcategories)) {
        delete params.subcategories
      }

      const result = await getProducts(params)

      if (result.success) {
        setProducts(result.data || [])
        setPagination({
          page: result.page || page,
          pageSize: result.pageSize || pagination.pageSize,
          totalPages: result.totalPages || 0,
          count: result.count || 0,
          next: result.next,
          previous: result.previous,
        })
        setError(null)
      } else {
        setError(result.error)
        setProducts([])
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.pageSize])

  // Fetch single product
  const fetchProductById = useCallback(async (productId) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getProductById(productId)

      if (result.success) {
        setCurrentProduct(result.data)
        setError(null)
      } else {
        setError(result.error)
        setCurrentProduct(null)
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch product')
      setCurrentProduct(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }, [])

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      sku: '',
      minPrice: '',
      maxPrice: '',
      subcategories: [],
      ordering: '-created_at',
      created_at_after: '',
      created_at_before: '',
      updated_at_after: '',
      updated_at_before: '',
    })
  }, [])

  // Update pagination
  const updatePagination = useCallback((newPagination) => {
    setPagination((prev) => ({
      ...prev,
      ...newPagination,
    }))
  }, [])

  // Go to specific page
  const goToPage = useCallback((page) => {
    fetchProducts(page)
  }, [fetchProducts])

  const value = {
    // State
    products,
    currentProduct,
    loading,
    error,
    pagination,
    filters,

    // Actions
    fetchProducts,
    fetchProductById,
    updateFilters,
    resetFilters,
    updatePagination,
    goToPage,
  }

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  )
}

