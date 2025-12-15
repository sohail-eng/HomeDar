import PropTypes from 'prop-types'

/**
 * Error Message component for displaying errors
 */
function ErrorMessage({ message, title = 'Error', onDismiss, className = '' }) {
  if (!message) return null
  
  return (
    <div className={`bg-error-50 border border-error-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-error-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium text-error-800 mb-1">{title}</h3>
          )}
          <p className="text-sm text-error-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto flex-shrink-0 text-error-600 hover:text-error-800"
            aria-label="Dismiss error"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

ErrorMessage.propTypes = {
  message: PropTypes.string,
  title: PropTypes.string,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
}

export default ErrorMessage

