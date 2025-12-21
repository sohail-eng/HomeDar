import axios from 'axios'
import { restoreOldVisitorId } from '../utils/visitor'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const TOKEN_STORAGE_KEY = 'access_token'
const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
  withCredentials: true, // Enable credentials for CORS (if needed for other features)
})

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor - Add JWT token to Authorization header
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY)

      if (!refreshToken) {
        // No refresh token, clear everything and redirect to login
        processQueue(error, null)
        isRefreshing = false
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      try {
        // Try to refresh the token
        // Use a new axios instance to avoid interceptors (which would cause infinite loop)
        const refreshApi = axios.create({
          baseURL: API_BASE_URL,
          headers: {
            'Content-Type': 'application/json',
          },
        })
        const response = await refreshApi.post('/auth/token/refresh/', {
          refresh: refreshToken,
        })

        const { access, refresh: newRefresh } = response.data

        // Update stored tokens
        localStorage.setItem(TOKEN_STORAGE_KEY, access)
        if (newRefresh) {
          localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, newRefresh)
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`

        // Process queued requests
        processQueue(null, access)
        isRefreshing = false

        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, clear everything and redirect to login
        processQueue(refreshError, null)
        isRefreshing = false
        clearAuthAndRedirect()
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data)
          break
        case 401:
          console.error('Unauthorized:', data)
          // Already handled above, but log for debugging
          break
        case 403:
          console.error('Forbidden:', data)
          break
        case 404:
          console.error('Not Found:', data)
          break
        case 422:
          console.error('Validation Error:', data)
          break
        case 429:
          console.error('Rate Limited:', data)
          break
        case 500:
          console.error('Server Error:', data)
          break
        default:
          console.error('API Error:', data)
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error: No response from server', error.message)
      // Check if it's a CORS error
      if (error.message && error.message.includes('CORS')) {
        console.error('CORS Error: Make sure the backend CORS settings allow requests from the frontend origin')
      }
    } else {
      // Error in request setup
      console.error('Request Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

/**
 * Clear authentication data and redirect to login
 * This is called when token refresh fails
 */
const clearAuthAndRedirect = () => {
  // Restore old_visitor_id to visitor_id before clearing auth data
  restoreOldVisitorId()
  
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY)
  localStorage.removeItem('user_data')
  
  // Redirect to login page if we're not already there
  if (window.location.pathname !== '/login') {
    // Store the current location for redirect after login
    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
  }
}

export default api

// Error handling utility
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response
    
    if (data && typeof data === 'object') {
      // Return first error message from response
      const firstError = Object.values(data)[0]
      if (Array.isArray(firstError)) {
        return firstError[0]
      }
      return firstError || 'An error occurred'
    }
    
    return `Error ${status}: ${data?.detail || 'An error occurred'}`
  } else if (error.request) {
    return 'Network error: Please check your connection'
  } else {
    return error.message || 'An unexpected error occurred'
  }
}

