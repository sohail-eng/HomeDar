import api from './api'
import { getOrCreateVisitorId } from '../utils/visitor'

/**
 * Tracking Service
 * Handles calls to tracking-related backend endpoints.
 */

/**
 * Track a product view for the current anonymous visitor.
 *
 * @param {string} productId - Product UUID
 * @param {Object} options
 * @param {number} [options.latitude] - Optional latitude from browser geolocation
 * @param {number} [options.longitude] - Optional longitude from browser geolocation
 */
export const trackProductView = async (productId, options = {}) => {
  try {
    if (!productId) return

    // Ensure visitor_id cookie exists (also stored in localStorage).
    const visitorId = getOrCreateVisitorId()

    const payload = {
      product_id: productId,
      visitor_id: visitorId,
    }

    if (typeof options.latitude === 'number') {
      payload.latitude = options.latitude
    }
    if (typeof options.longitude === 'number') {
      payload.longitude = options.longitude
    }

    await api.post('/tracking/product-views/', payload)
  } catch (error) {
    // Intentionally silent in production; log only in development.
    if (import.meta.env.DEV) {
      console.error('Failed to track product view:', error)
    }
  }
}

/**
 * Get recently viewed products for the current visitor.
 * Returns an array of products compatible with existing product cards.
 */
export const getRecentProducts = async (limit = 10) => {
  try {
    // Ensure visitor_id cookie exists so backend can resolve visitor.
    getOrCreateVisitorId()
    const response = await api.get('/tracking/recent-products/', {
      params: { limit },
    })
    return {
      success: true,
      data: response.data.results || [],
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to fetch recent products:', error)
    }
    return {
      success: false,
      data: [],
    }
  }
}

/**
 * Get popular products (optionally by country / period).
 */
export const getPopularProducts = async (options = {}) => {
  try {
    const params = {}
    if (options.country) params.country = options.country
    if (options.period) params.period = options.period
    if (options.limit) params.limit = options.limit

    const response = await api.get('/tracking/popular-products/', { params })
    return {
      success: true,
      data: response.data.results || [],
      country: response.data.country || null,
      period: response.data.period || null,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to fetch popular products:', error)
    }
    return {
      success: false,
      data: [],
      country: null,
      period: null,
    }
  }
}

/**
 * Get products that were viewed by visitors who also viewed the specified product.
 * 
 * @param {string} productId - Product UUID
 * @param {Object} options
 * @param {number} [options.limit] - Optional limit (default: 10, max: 10)
 * @param {string} [options.period] - Optional time period: '30d' or '90d' (default: '90d')
 */
export const getAlsoViewedProducts = async (productId, options = {}) => {
  try {
    if (!productId) {
      return {
        success: false,
        data: [],
      }
    }

    const params = {}
    if (options.limit) params.limit = options.limit
    if (options.period) params.period = options.period

    const response = await api.get(`/tracking/also-viewed/${productId}/`, { params })
    return {
      success: true,
      data: response.data.results || [],
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to fetch also viewed products:', error)
    }
    return {
      success: false,
      data: [],
    }
  }
}

/**
 * Toggle like/unlike for a product.
 * 
 * @param {string} productId - Product UUID
 * @returns {Promise<{success: boolean, liked: boolean, product_id: string}>}
 */
export const toggleProductLike = async (productId) => {
  try {
    if (!productId) {
      return {
        success: false,
        liked: false,
        product_id: null,
      }
    }

    const visitorId = getOrCreateVisitorId()
    const payload = {
      product_id: productId,
      visitor_id: visitorId,
    }

    const response = await api.post('/tracking/product-like/', payload)
    return {
      success: true,
      liked: response.data.liked || false,
      product_id: response.data.product_id || productId,
      like_count: response.data.like_count || 0,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to toggle product like:', error)
    }
    return {
      success: false,
      liked: false,
      product_id: productId,
    }
  }
}

/**
 * Check if the current visitor has liked a product.
 * 
 * @param {string} productId - Product UUID
 * @returns {Promise<{success: boolean, liked: boolean, product_id: string}>}
 */
export const checkProductLike = async (productId) => {
  try {
    if (!productId) {
      return {
        success: false,
        liked: false,
        product_id: null,
      }
    }

    getOrCreateVisitorId() // Ensure visitor_id cookie exists
    const response = await api.get(`/tracking/product-like/${productId}/`)
    return {
      success: true,
      liked: response.data.liked || false,
      product_id: response.data.product_id || productId,
      like_count: response.data.like_count || 0,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to check product like:', error)
    }
    return {
      success: false,
      liked: false,
      product_id: productId,
    }
  }
}

/**
 * Get favorite (liked) products for the current visitor.
 * 
 * @param {Object} options
 * @param {number} [options.limit] - Optional limit (default: 50, max: 100)
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export const getFavoriteProducts = async (options = {}) => {
  try {
    getOrCreateVisitorId() // Ensure visitor_id cookie exists
    const params = {}
    if (options.limit) params.limit = options.limit

    const response = await api.get('/tracking/favorite-products/', { params })
    return {
      success: true,
      data: response.data.results || [],
      count: response.data.count || 0,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to fetch favorite products:', error)
    }
    return {
      success: false,
      data: [],
      count: 0,
    }
  }
}

/**
 * Get reviews for a product.
 * 
 * @param {string} productId - Product UUID
 * @returns {Promise<{success: boolean, data: Array, count: number}>}
 */
export const getProductReviews = async (productId) => {
  try {
    if (!productId) {
      return {
        success: false,
        data: [],
        count: 0,
      }
    }

    const response = await api.get(`/products/${productId}/reviews/`)
    return {
      success: true,
      data: response.data.results || [],
      count: response.data.count || 0,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to fetch product reviews:', error)
    }
    return {
      success: false,
      data: [],
      count: 0,
    }
  }
}

/**
 * Create a review for a product.
 * 
 * @param {string} productId - Product UUID
 * @param {Object} reviewData
 * @param {string} [reviewData.name] - Optional reviewer name
 * @param {string} reviewData.review_text - Required review text
 * @returns {Promise<{success: boolean, data: Object, error: string}>}
 */
export const createProductReview = async (productId, reviewData) => {
  try {
    if (!productId || !reviewData || !reviewData.review_text) {
      return {
        success: false,
        data: null,
        error: 'Product ID and review text are required',
      }
    }

    const visitorId = getOrCreateVisitorId()
    const payload = {
      ...reviewData,
      visitor_id: visitorId,
    }

    const response = await api.post(`/products/${productId}/reviews/create/`, payload)
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to create product review:', error)
    }
    return {
      success: false,
      data: null,
      error: error.response?.data?.error || 'Failed to create review',
    }
  }
}

export default {
  trackProductView,
  getRecentProducts,
  getPopularProducts,
  getAlsoViewedProducts,
  toggleProductLike,
  checkProductLike,
  getFavoriteProducts,
  getProductReviews,
  createProductReview,
}



