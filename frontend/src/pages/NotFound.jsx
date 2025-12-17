import { Link } from 'react-router-dom'
import { Button } from '../components/common'

/**
 * 404 Not Found Page
 * Displays when user navigates to a non-existent route
 */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      {/* 404 Illustration */}
      <div className="mb-8">
        <svg
          className="mx-auto h-48 w-48 text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      
      {/* Error Code */}
      <h1 className="text-6xl md:text-8xl font-bold text-primary-600 mb-4">
        404
      </h1>
      
      {/* Error Message */}
      <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 mb-3">
        Page Not Found
      </h2>
      
      <p className="text-lg text-neutral-600 mb-8 max-w-md">
        The page you are looking for does not exist or has been moved.
        Please check the URL or return to the homepage.
      </p>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="primary"
          size="lg"
          onClick={() => (window.location.href = '/')}
        >
          Go to Homepage
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
      
      {/* Additional Links */}
      <div className="mt-8 pt-8 border-t border-neutral-200">
        <p className="text-sm text-neutral-500 mb-4">You might be looking for:</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Products
          </Link>
          <Link
            to="/contact"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound

