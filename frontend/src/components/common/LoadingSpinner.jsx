import PropTypes from 'prop-types'

/**
 * Loading Spinner component
 */
function LoadingSpinner({ size = 'md', className = '', fullScreen = false }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  }
  
  const spinner = (
    <div
      className={`${sizes[size]} border-primary-200 border-t-primary-600 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
  
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    )
  }
  
  return spinner
}

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  fullScreen: PropTypes.bool,
}

export default LoadingSpinner

