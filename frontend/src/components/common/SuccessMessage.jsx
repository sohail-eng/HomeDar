import PropTypes from 'prop-types'

/**
 * Success Message component for displaying success messages
 */
function SuccessMessage({ message, title = 'Success', onDismiss, className = '', autoDismiss = false, autoDismissDelay = 5000 }) {
  if (!message) return null

  // Auto-dismiss functionality (handled by parent component via useEffect)
  // This component just displays the message

  return (
    <div className={`bg-success-50 border border-success-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-success-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium text-success-800 mb-1">{title}</h3>
          )}
          <p className="text-sm text-success-700">{message}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto flex-shrink-0 text-success-600 hover:text-success-800"
            aria-label="Dismiss success message"
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

SuccessMessage.propTypes = {
  message: PropTypes.string,
  title: PropTypes.string,
  onDismiss: PropTypes.func,
  className: PropTypes.string,
  autoDismiss: PropTypes.bool,
  autoDismissDelay: PropTypes.number,
}

export default SuccessMessage

