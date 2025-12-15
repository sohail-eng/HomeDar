import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          console.error('Bad Request:', data)
          break
        case 401:
          console.error('Unauthorized:', data)
          // Handle unauthorized - redirect to login if needed
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

