import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

/**
 * Protected Route Component
 * Wraps routes that require authentication
 * 
 * - Shows loading state while checking authentication
 * - Redirects to login if not authenticated
 * - Preserves intended destination for redirect after login
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" />
  }

  // Redirect to login if not authenticated
  // Preserve the current location so we can redirect back after login
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    )
  }

  // User is authenticated, render the protected content
  return children
}

export default ProtectedRoute

