import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook for API calls with loading and error states
 * @param {Function} apiFunction - API function to call
 * @param {Array} dependencies - Dependencies array for useEffect
 * @param {boolean} immediate - Whether to call API immediately
 * @returns {Object} { data, loading, error, refetch }
 */
export const useApi = (apiFunction, dependencies = [], immediate = true) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await apiFunction(...args)
      
      if (result.success) {
        setData(result.data)
        setError(null)
      } else {
        setError(result.error)
        setData(null)
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [fetchData, immediate, ...dependencies])

  const refetch = useCallback((...args) => {
    return fetchData(...args)
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch,
  }
}

/**
 * Custom hook for API calls with manual trigger
 * @param {Function} apiFunction - API function to call
 * @returns {Object} { data, loading, error, execute }
 */
export const useApiMutation = (apiFunction) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    setData(null)
    
    try {
      const result = await apiFunction(...args)
      
      if (result.success) {
        setData(result.data)
        setError(null)
        return result
      } else {
        setError(result.error)
        setData(null)
        return result
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred'
      setError(errorMessage)
      setData(null)
      return {
        success: false,
        error: errorMessage,
        data: null,
      }
    } finally {
      setLoading(false)
    }
  }, [apiFunction])

  return {
    data,
    loading,
    error,
    execute,
  }
}

export default {
  useApi,
  useApiMutation,
}

