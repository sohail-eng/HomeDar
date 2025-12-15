import api, { handleApiError } from './api'
import { API_ENDPOINTS, DEFAULT_PAGE_SIZE } from '../utils/constants'

/**
 * Product Service
 * Handles all product-related API calls with filtering, search, and pagination
 */

/**
 * Get products with filters, search, and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search term (searches title and description)
 * @param {string} params.sku - Filter by exact SKU
 * @param {number} params.min_price - Minimum price filter
 * @param {number} params.max_price - Maximum price filter
 * @param {string} params.created_at_after - Filter by creation date (after)
 * @param {string} params.created_at_before - Filter by creation date (before)
 * @param {string} params.updated_at_after - Filter by update date (after)
 * @param {string} params.updated_at_before - Filter by update date (before)
 * @param {string} params.subcategories - Comma-separated subcategory IDs
 * @param {string} params.ordering - Order by field (price, created_at, updated_at, title)
 * @param {number} params.page - Page number
 * @param {number} params.page_size - Items per page
 * @returns {Promise} Promise that resolves to products data
 */
export const getProducts = async (params = {}) => {
  try {
    console.log('getProducts called with params:', params)
    // Build query parameters
    const queryParams = {
      page: params.page || 1,
      page_size: params.page_size || DEFAULT_PAGE_SIZE,
      ...params,
    }
    
    // Remove undefined values
    Object.keys(queryParams).forEach((key) => {
      if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
        delete queryParams[key]
      }
    })
    
    console.log('getProducts final queryParams:', queryParams)
    console.log('getProducts API endpoint:', API_ENDPOINTS.PRODUCTS)
    const response = await api.get(API_ENDPOINTS.PRODUCTS, { params: queryParams })
    console.log('getProducts response:', response.data)
    return {
      success: true,
      data: response.data.results || response.data,
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
      page: response.data.page || (params.page || 1),
      pageSize: response.data.page_size || DEFAULT_PAGE_SIZE,
      totalPages: Math.ceil((response.data.count || 0) / (response.data.page_size || DEFAULT_PAGE_SIZE)),
    }
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      data: null,
      count: 0,
      next: null,
      previous: null,
    }
  }
}

/**
 * Get a single product by ID
 * @param {string} productId - Product UUID
 * @returns {Promise} Promise that resolves to product data
 */
export const getProductById = async (productId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.PRODUCTS}${productId}/`)
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      data: null,
    }
  }
}

/**
 * Search products by title
 * @param {string} searchTerm - Search term
 * @param {Object} additionalParams - Additional query parameters
 * @returns {Promise} Promise that resolves to products data
 */
export const searchProducts = async (searchTerm, additionalParams = {}) => {
  return getProducts({
    search: searchTerm,
    ...additionalParams,
  })
}

/**
 * Filter products by price range
 * @param {number} minPrice - Minimum price
 * @param {number} maxPrice - Maximum price
 * @param {Object} additionalParams - Additional query parameters
 * @returns {Promise} Promise that resolves to products data
 */
export const filterProductsByPrice = async (minPrice, maxPrice, additionalParams = {}) => {
  return getProducts({
    min_price: minPrice,
    max_price: maxPrice,
    ...additionalParams,
  })
}

export default {
  getProducts,
  getProductById,
  searchProducts,
  filterProductsByPrice,
}

