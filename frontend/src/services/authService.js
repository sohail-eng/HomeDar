import api, { handleApiError } from './api'
import { 
  saveVisitorId, 
  getVisitorId, 
  saveOldVisitorId, 
  restoreOldVisitorId 
} from '../utils/visitor'

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

const TOKEN_STORAGE_KEY = 'access_token'
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token'
const USER_STORAGE_KEY = 'user_data'

/**
 * Store tokens in localStorage
 */
export const storeTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken)
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken)
  }
}

/**
 * Get access token from localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)
}

/**
 * Clear tokens from localStorage
 */
export const clearTokens = () => {
  // Restore old_visitor_id to visitor_id before clearing auth data
  restoreOldVisitorId()
  
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}

/**
 * Store user data in localStorage
 */
export const storeUser = (userData) => {
  if (userData) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
  }
}

/**
 * Get user data from localStorage
 */
export const getStoredUser = () => {
  const userData = localStorage.getItem(USER_STORAGE_KEY)
  return userData ? JSON.parse(userData) : null
}

/**
 * User signup
 * @param {Object} userData - User signup data
 * @param {string} userData.first_name - User's first name
 * @param {string} userData.last_name - User's last name
 * @param {string} userData.username - Username (unique)
 * @param {string} userData.email - Email address (unique)
 * @param {string} userData.password - Password
 * @param {string} userData.visitor_id - Optional visitor ID
 * @param {Array} userData.security_questions - Array of 3 security questions
 * @returns {Promise} Promise that resolves to { success, data: { user, access, refresh }, error }
 */
export const signup = async (userData) => {
  try {
    const response = await api.post('/auth/signup/', userData)
    
    // Validate response structure
    if (!response || !response.data) {
      console.error('Signup: Invalid response structure', response)
      return {
        success: false,
        data: null,
        error: 'Invalid response from server. Please try again.',
        fieldErrors: null,
      }
    }
    
    const { user, access, refresh, visitor_id } = response.data
    
    // Validate required fields
    if (!user || !access || !refresh) {
      console.error('Signup: Missing required fields in response', { user, access, refresh })
      return {
        success: false,
        data: null,
        error: 'Invalid response data. Please try again.',
        fieldErrors: null,
      }
    }
    
    // Save existing visitor_id as old_visitor_id before updating
    const currentVisitorId = getVisitorId()
    if (currentVisitorId) {
      saveOldVisitorId(currentVisitorId)
    }
    
    // Store tokens and user data
    storeTokens(access, refresh)
    storeUser(user)
    
    // Save visitor_id from response to localStorage
    if (visitor_id) {
      saveVisitorId(visitor_id)
    }
    
    return {
      success: true,
      data: {
        user,
        access,
        refresh,
        visitor_id,
      },
      error: null,
      fieldErrors: null,
    }
  } catch (error) {
    // Extract field-specific errors from API response
    let fieldErrors = null
    let generalError = null
    
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data
      
      // Check for general error message (detail, error, message, etc.)
      if (data.detail) {
        generalError = Array.isArray(data.detail) ? data.detail[0] : data.detail
      } else if (data.error) {
        generalError = Array.isArray(data.error) ? data.error[0] : data.error
      } else if (data.message) {
        generalError = Array.isArray(data.message) ? data.message[0] : data.message
      }
      
      // Extract field-specific errors (e.g., { username: [...], email: [...] })
      // Only if there are field errors (not just a general detail message)
      const fieldKeys = Object.keys(data).filter(
        key => !['detail', 'error', 'message'].includes(key.toLowerCase())
      )
      
      if (fieldKeys.length > 0) {
        fieldErrors = {}
        fieldKeys.forEach((field) => {
          if (Array.isArray(data[field]) && data[field].length > 0) {
            // Get first error message for each field
            fieldErrors[field] = data[field][0]
          } else if (typeof data[field] === 'string' && data[field].trim()) {
            fieldErrors[field] = data[field]
          } else if (data[field] && typeof data[field] === 'object') {
            // Handle nested errors (e.g., security_questions[0].question_text)
            // Convert nested object to string representation
            fieldErrors[field] = JSON.stringify(data[field])
          }
        })
      }
    }
    
    return {
      success: false,
      data: null,
      error: generalError || (fieldErrors ? 'Please correct the errors below.' : handleApiError(error)),
      fieldErrors: Object.keys(fieldErrors || {}).length > 0 ? fieldErrors : null,
    }
  }
}

/**
 * Request signup OTP code (4-digit) to be sent to user's email.
 * Uses: POST /auth/signup/request-code/
 */
export const requestSignupCode = async (userData) => {
  try {
    await api.post('/auth/signup/request-code/', userData)
    return {
      success: true,
      error: null,
      fieldErrors: null,
    }
  } catch (error) {
    // Reuse signup-style field error extraction if backend returns them
    let fieldErrors = null
    let generalError = null

    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data

      if (data.detail) {
        generalError = Array.isArray(data.detail) ? data.detail[0] : data.detail
      } else if (data.error) {
        generalError = Array.isArray(data.error) ? data.error[0] : data.error
      } else if (data.message) {
        generalError = Array.isArray(data.message) ? data.message[0] : data.message
      }

      const fieldKeys = Object.keys(data).filter(
        key => !['detail', 'error', 'message', 'code'].includes(key.toLowerCase())
      )

      if (fieldKeys.length > 0) {
        fieldErrors = {}
        fieldKeys.forEach((field) => {
          if (Array.isArray(data[field]) && data[field].length > 0) {
            fieldErrors[field] = data[field][0]
          } else if (typeof data[field] === 'string' && data[field].trim()) {
            fieldErrors[field] = data[field]
          }
        })
      }
    }

    return {
      success: false,
      error: generalError || handleApiError(error),
      fieldErrors,
    }
  }
}

/**
 * Verify signup OTP code and complete account creation.
 * Uses: POST /auth/signup/verify-code/
 * Handles file uploads using FormData when llc_certificate is present.
 */
export const verifySignupCode = async (payload) => {
  try {
    // Check if there's a file to upload
    const hasFile = payload.llc_certificate && payload.llc_certificate instanceof File
    
    let response
    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData()
      
      // Add all fields to FormData
      Object.keys(payload).forEach((key) => {
        if (key === 'llc_certificate' && payload[key] instanceof File) {
          formData.append(key, payload[key])
        } else if (payload[key] !== null && payload[key] !== undefined) {
          formData.append(key, payload[key])
        }
      })
      
      // Make request with FormData (axios will set Content-Type to multipart/form-data)
      response = await api.post('/auth/signup/verify-code/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } else {
      // Regular JSON request
      response = await api.post('/auth/signup/verify-code/', payload)
    }

    const { user, access, refresh, visitor_id } = response.data

    // Save existing visitor_id as old_visitor_id before updating
    const currentVisitorId = getVisitorId()
    if (currentVisitorId) {
      saveOldVisitorId(currentVisitorId)
    }

    // Store tokens and user data
    storeTokens(access, refresh)
    storeUser(user)

    // Save visitor_id from response
    if (visitor_id) {
      saveVisitorId(visitor_id)
    }

    return {
      success: true,
      data: {
        user,
        access,
        refresh,
        visitor_id,
      },
      error: null,
      fieldErrors: null,
    }
  } catch (error) {
    let generalError = null
    let errorCode = null

    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data
      errorCode = data.code || null

      if (data.detail) {
        generalError = Array.isArray(data.detail) ? data.detail[0] : data.detail
      }
    }

    // Map known OTP error codes to friendly messages
    if (errorCode === 'invalid_code') {
      generalError = 'The code you entered is incorrect. Please try again.'
    } else if (errorCode === 'code_expired') {
      generalError = 'This code has expired. Please request a new one.'
    } else if (errorCode === 'too_many_attempts') {
      generalError = 'Too many incorrect attempts. We have invalidated this code. Please try again later.'
    }

    return {
      success: false,
      data: null,
      error: generalError || handleApiError(error),
      fieldErrors: null,
    }
  }
}

/**
 * User login
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username_or_email - Username or email
 * @param {string} credentials.password - Password
 * @returns {Promise} Promise that resolves to { success, data: { user, access, refresh }, error }
 */
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login/', credentials)
    
    const { user, access, refresh, visitor_id } = response.data
    
    // Save existing visitor_id as old_visitor_id before updating
    const currentVisitorId = getVisitorId()
    if (currentVisitorId) {
      saveOldVisitorId(currentVisitorId)
    }
    
    // Save new visitor_id from user to visitor_id
    if (visitor_id) {
      saveVisitorId(visitor_id)
    }
    
    // Store tokens and user data
    storeTokens(access, refresh)
    storeUser(user)
    
    return {
      success: true,
      data: {
        user,
        access,
        refresh,
        visitor_id,
      },
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleApiError(error),
    }
  }
}

/**
 * Forgot password step 1: Get security questions
 * @param {string} usernameOrEmail - User's username or email address
 * @returns {Promise} Promise that resolves to { success, data: { questions }, error }
 */
export const forgotPasswordStep1 = async (usernameOrEmail) => {
  try {
    const response = await api.post('/auth/forgot-password/step1/', { 
      username_or_email: usernameOrEmail 
    })
    
    return {
      success: true,
      data: {
        questions: response.data.questions || [],
      },
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleApiError(error),
    }
  }
}

/**
 * Forgot password step 2: Verify answer and get password
 * @param {Object} data - Password reset data
 * @param {string} data.email - User's email address
 * @param {number} data.question_order - Question order (1, 2, or 3)
 * @param {string} data.answer - Answer to the security question
 * @returns {Promise} Promise that resolves to { success, data: { password }, error }
 */
export const forgotPasswordStep2 = async (data) => {
  try {
    const response = await api.post('/auth/forgot-password/step2/', data)
    
    return {
      success: true,
      data: {
        password: response.data.password,
      },
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleApiError(error),
    }
  }
}

/**
 * Request a 4-digit code for password reset.
 * Uses: POST /auth/password-reset/request-code/
 */
export const requestPasswordResetCode = async (usernameOrEmail) => {
  try {
    await api.post('/auth/password-reset/request-code/', {
      username_or_email: usernameOrEmail,
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      error: handleApiError(error),
    }
  }
}

/**
 * Confirm password reset using 4-digit code and new password.
 * Uses: POST /auth/password-reset/confirm/
 */
export const confirmPasswordReset = async ({ usernameOrEmail, code, password }) => {
  try {
    await api.post('/auth/password-reset/confirm/', {
      username_or_email: usernameOrEmail,
      code,
      password,
    })

    return {
      success: true,
      error: null,
    }
  } catch (error) {
    let generalError = null
    let errorCode = null

    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data
      errorCode = data.code || null
      if (data.detail) {
        generalError = Array.isArray(data.detail) ? data.detail[0] : data.detail
      }
    }

    if (errorCode === 'invalid_code') {
      generalError = 'The code you entered is incorrect. Please try again.'
    } else if (errorCode === 'code_expired') {
      generalError = 'This code has expired. Please request a new one.'
    } else if (errorCode === 'too_many_attempts') {
      generalError = 'Too many incorrect attempts. We have invalidated this code. Please try again later.'
    }

    return {
      success: false,
      error: generalError || handleApiError(error),
    }
  }
}

/**
 * Get current user profile (requires authentication)
 * @returns {Promise} Promise that resolves to { success, data: { user }, error }
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile/')
    
    const user = response.data
    
    // Update stored user data
    storeUser(user)
    
    return {
      success: true,
      data: {
        user,
      },
      error: null,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: handleApiError(error),
    }
  }
}

/**
 * Update user profile (requires authentication)
 * @param {Object} data - Profile update data
 * @param {string} data.first_name - Optional first name
 * @param {string} data.last_name - Optional last name
 * @param {string} data.email - Optional email
 * @param {string} data.business_type - Optional business type
 * @param {string} data.ein_number - Optional EIN number
 * @param {File} data.llc_certificate - Optional LLC certificate file
 * @returns {Promise} Promise that resolves to { success, data: { user }, error }
 */
export const updateProfile = async (data) => {
  try {
    // Check if there's a file to upload
    const hasFile = data.llc_certificate && data.llc_certificate instanceof File
    
    let response
    if (hasFile) {
      // Use FormData for file uploads
      const formData = new FormData()
      
      // Add all fields to FormData
      Object.keys(data).forEach((key) => {
        if (key === 'llc_certificate' && data[key] instanceof File) {
          formData.append(key, data[key])
        } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key])
        }
      })
      
      // Make request with FormData
      response = await api.patch('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } else {
      // Regular JSON request
      response = await api.patch('/auth/profile/', data)
    }
    
    const user = response.data
    
    // Update stored user data
    storeUser(user)
    
    return {
      success: true,
      data: {
        user,
      },
      error: null,
    }
  } catch (error) {
    let fieldErrors = null
    let generalError = null

    if (error.response?.data && typeof error.response.data === 'object') {
      const responseData = error.response.data
      
      if (responseData.detail) {
        generalError = Array.isArray(responseData.detail) ? responseData.detail[0] : responseData.detail
      } else if (responseData.error) {
        generalError = Array.isArray(responseData.error) ? responseData.error[0] : responseData.error
      }
      
      // Extract field-specific errors
      const fieldKeys = Object.keys(responseData).filter(
        key => !['detail', 'error', 'message'].includes(key.toLowerCase())
      )
      
      if (fieldKeys.length > 0) {
        fieldErrors = {}
        fieldKeys.forEach((field) => {
          if (Array.isArray(responseData[field]) && responseData[field].length > 0) {
            fieldErrors[field] = responseData[field][0]
          } else if (typeof responseData[field] === 'string' && responseData[field].trim()) {
            fieldErrors[field] = responseData[field]
          }
        })
      }
    }
    
    return {
      success: false,
      data: null,
      error: generalError || handleApiError(error),
      fieldErrors,
    }
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Promise} Promise that resolves to { success, data: { access, refresh }, error }
 */
export const refreshToken = async (refreshToken) => {
  try {
    const response = await api.post('/auth/token/refresh/', {
      refresh: refreshToken,
    })
    
    const { access, refresh: newRefresh } = response.data
    
    // Update stored tokens
    storeTokens(access, newRefresh || refreshToken)
    
    return {
      success: true,
      data: {
        access,
        refresh: newRefresh || refreshToken,
      },
      error: null,
    }
  } catch (error) {
    // If refresh fails, clear tokens
    clearTokens()
    return {
      success: false,
      data: null,
      error: handleApiError(error),
    }
  }
}

/**
 * Logout - clear tokens and user data
 */
export const logout = () => {
  clearTokens()
  return {
    success: true,
    data: null,
    error: null,
  }
}

export default {
  signup,
  login,
  forgotPasswordStep1,
  forgotPasswordStep2,
  requestSignupCode,
  verifySignupCode,
  requestPasswordResetCode,
  confirmPasswordReset,
  getProfile,
  updateProfile,
  refreshToken,
  logout,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  storeTokens,
  storeUser,
  getStoredUser,
}

