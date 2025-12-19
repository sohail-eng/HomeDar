import PropTypes from 'prop-types'
import { Button } from '../common'

/**
 * Location Permission Banner
 * Displays a friendly message asking users to enable location access
 * for personalized product recommendations.
 */
function LocationPermissionBanner({ onEnableLocation, title = 'Recently Viewed', isRequesting = false }) {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6 md:p-8 text-center">
      <div className="max-w-md mx-auto">
        {/* Location Icon */}
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
            {isRequesting ? (
              <svg
                className="w-8 h-8 text-white animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Heading */}
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          {isRequesting
            ? 'Requesting Location Access...'
            : 'Enable Location for Personalized Recommendations'}
        </h3>

        {/* Description */}
        <p className="text-neutral-600 mb-6">
          {isRequesting
            ? 'Please allow location access in your browser to continue.'
            : "Get personalized product recommendations based on your location! We'll show you products that are popular in your area and help you discover items that others nearby are viewing."}
        </p>

        {/* Enable Button */}
        <Button
          onClick={onEnableLocation}
          disabled={isRequesting}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isRequesting ? 'Requesting...' : 'Enable Location'}
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-neutral-500 mt-4">
          Your location data is used only to personalize your experience. 
          We respect your privacy and never share this information.
        </p>
      </div>
    </div>
  )
}

LocationPermissionBanner.propTypes = {
  onEnableLocation: PropTypes.func.isRequired,
  title: PropTypes.string,
  isRequesting: PropTypes.bool,
}

export default LocationPermissionBanner

