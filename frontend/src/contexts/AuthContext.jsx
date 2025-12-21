import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as authService from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  /**
   * Initialize authentication state from localStorage
   */
  const initializeAuth = useCallback(async () => {
    try {
      const storedToken = authService.getAccessToken()
      const storedUser = authService.getStoredUser()

      if (storedToken && storedUser) {
        // Verify token is still valid by getting profile
        const result = await authService.getProfile()
        
        if (result.success) {
          setUser(result.data.user)
          setToken(storedToken)
          setIsAuthenticated(true)
        } else {
          // Token invalid, clear everything
          authService.clearTokens()
          setUser(null)
          setToken(null)
          setIsAuthenticated(false)
        }
      } else {
        // No stored auth data
        setUser(null)
        setToken(null)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      // Clear on error
      authService.clearTokens()
      setUser(null)
      setToken(null)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Initialize auth on mount
   */
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  /**
   * Login function
   * @param {Object} userData - User data from login response
   * @param {Object} tokens - Token data { access, refresh }
   */
  const login = useCallback(async (userData, tokens) => {
    try {
      // Store tokens and user
      authService.storeTokens(tokens.access, tokens.refresh)
      authService.storeUser(userData)

      // Update state
      setUser(userData)
      setToken(tokens.access)
      setIsAuthenticated(true)
    } catch (error) {
      console.error('Error during login:', error)
      throw error
    }
  }, [])

  /**
   * Logout function
   */
  const logout = useCallback(() => {
    // Clear tokens and user data
    authService.logout()

    // Update state
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
  }, [])

  /**
   * Update user data
   * @param {Object} userData - Updated user data
   */
  const updateUser = useCallback((userData) => {
    // Update stored user data
    authService.storeUser(userData)

    // Update state
    setUser(userData)
  }, [])

  /**
   * Check authentication status
   * Verifies token and gets fresh user profile
   */
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)
      const result = await authService.getProfile()

      if (result.success) {
        const userData = result.data.user
        updateUser(userData)
        setIsAuthenticated(true)
        return true
      } else {
        // Not authenticated
        logout()
        return false
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      logout()
      return false
    } finally {
      setLoading(false)
    }
  }, [logout, updateUser])

  /**
   * Refresh token
   */
  const refreshToken = useCallback(async () => {
    try {
      const refreshTokenValue = authService.getRefreshToken()
      if (!refreshTokenValue) {
        throw new Error('No refresh token available')
      }

      const result = await authService.refreshToken(refreshTokenValue)
      
      if (result.success) {
        const { access, refresh } = result.data
        authService.storeTokens(access, refresh)
        setToken(access)
        return true
      } else {
        // Refresh failed, logout
        logout()
        return false
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      logout()
      return false
    }
  }, [logout])

  const value = {
    user,
    isAuthenticated,
    loading,
    token,
    login,
    logout,
    updateUser,
    checkAuth,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

