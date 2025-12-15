import api, { handleApiError } from './api'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Category Service
 * Handles all category-related API calls
 */

/**
 * Get all categories
 * @param {Object} params - Query parameters (name, ordering)
 * @returns {Promise} Promise that resolves to categories data
 */
export const getCategories = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.CATEGORIES, { params })
    return {
      success: true,
      data: response.data.results || response.data,
      count: response.data.count,
      next: response.data.next,
      previous: response.data.previous,
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
 * Get a single category by ID
 * @param {string} categoryId - Category UUID
 * @returns {Promise} Promise that resolves to category data
 */
export const getCategoryById = async (categoryId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.CATEGORIES}${categoryId}/`)
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

export default {
  getCategories,
  getCategoryById,
}

