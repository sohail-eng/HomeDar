import api, { handleApiError } from './api'
import { API_ENDPOINTS } from '../utils/constants'

/**
 * Contact Service
 * Handles contact form submissions
 */

/**
 * Submit contact form
 * @param {Object} formData - Contact form data
 * @param {string} formData.name - Contact name
 * @param {string} formData.phone - Contact phone
 * @param {string} formData.email - Contact email
 * @param {string} formData.message - Contact message
 * @returns {Promise} Promise that resolves to submission result
 */
export const submitContactForm = async (formData) => {
  try {
    const response = await api.post(API_ENDPOINTS.CONTACT_US, formData)
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || 'Thank you for contacting us! We will get back to you soon.',
    }
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
      data: null,
      message: null,
    }
  }
}

export default {
  submitContactForm,
}

