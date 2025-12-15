import api, { handleApiError } from './api'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * SubCategory Service
 * Handles all subcategory-related API calls
 */

/**
 * Get all subcategories
 * @param {Object} params - Query parameters (category, name, ordering)
 * @returns {Promise} Promise that resolves to subcategories data
 */
export const getSubCategories = async (params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBCATEGORIES, { params })
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
 * Get subcategories by category ID
 * @param {string} categoryId - Category UUID
 * @param {Object} params - Additional query parameters
 * @returns {Promise} Promise that resolves to subcategories data
 */
export const getSubCategoriesByCategory = async (categoryId, params = {}) => {
  try {
    const response = await api.get(API_ENDPOINTS.SUBCATEGORIES, {
      params: {
        category: categoryId,
        ...params,
      },
    })
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
 * Get a single subcategory by ID
 * @param {string} subCategoryId - SubCategory UUID
 * @returns {Promise} Promise that resolves to subcategory data
 */
export const getSubCategoryById = async (subCategoryId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.SUBCATEGORIES}${subCategoryId}/`)
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
  getSubCategories,
  getSubCategoriesByCategory,
  getSubCategoryById,
}

