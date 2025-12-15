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
  const fetchProducts = useCallback(async (page = 1, additionalFilters = null) => {
    console.log('fetchProducts called with:', { page, additionalFilters, filters })
    setLoading(true)
    setError(null)

    try {
      // Use additionalFilters if provided
      // null = use context filters
      // {} = no filters (for initial load)
      // object with values = use those filters
      const params = {
        page,
        page_size: pagination.pageSize,
      }
      
      // Add filters based on additionalFilters
      if (additionalFilters === null) {
        // Use context filters
        Object.assign(params, filters)
      } else if (additionalFilters && typeof additionalFilters === 'object') {
        // Use provided filters (even if empty object)
        Object.assign(params, additionalFilters)
      }

      // Handle subcategories array
      if (params.subcategories && Array.isArray(params.subcategories) && params.subcategories.length > 0) {
        params.subcategories = params.subcategories.join(',')
      } else if (params.subcategories && typeof params.subcategories === 'string' && params.subcategories.trim() !== '') {
        // Already a string, keep it
      } else {
        delete params.subcategories
      }

      // Clean up empty values (including whitespace-only strings)
      Object.keys(params).forEach((key) => {
        const value = params[key]
        if (value === '' || value === null || value === undefined || 
            (typeof value === 'string' && value.trim() === '')) {
          delete params[key]
        }
      })

      const result = await getProducts(params)

      if (result.success) {
        setProducts(result.data || [])
        setPagination((prev) => ({
          ...prev,
          page: result.page || page,
          pageSize: result.pageSize || prev.pageSize,
          totalPages: result.totalPages || 0,
          count: result.count || 0,
          next: result.next,
          previous: result.previous,
        }))
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

