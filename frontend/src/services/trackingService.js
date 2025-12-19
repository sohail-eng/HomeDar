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
 * @param {number} [options.limit] - Optional limit (default: 12, max: 20)
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

export default {
  trackProductView,
  getRecentProducts,
  getPopularProducts,
  getAlsoViewedProducts,
}



