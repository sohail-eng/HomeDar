import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { getProductReviews, createProductReview } from '../../services/trackingService'
import { useBrowserLocation } from '../../hooks/useBrowserLocation'
import LocationPermissionBanner from './LocationPermissionBanner'
import { Button, Input, LoadingSpinner } from '../common'

/**
 * Reviews Component
 * Displays product reviews and allows users to submit reviews (if location is granted)
 */
function Reviews({ productId }) {
  const { status: locationStatus, requestLocation } = useBrowserLocation()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', review_text: '' })
  const [error, setError] = useState(null)

  // Load reviews on mount
  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const loadReviews = async () => {
      setLoading(true)
      const result = await getProductReviews(productId)
      if (result.success) {
        setReviews(result.data || [])
      }
      setLoading(false)
    }

    loadReviews()
  }, [productId])

  // If location becomes granted while form is open, keep form open
  // (The form will automatically show when locationStatus changes to 'granted')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.review_text || !formData.review_text.trim()) {
      setError('Review text is required')
      return
    }

    setSubmitting(true)
    setError(null)

    const result = await createProductReview(productId, {
      name: formData.name.trim() || null,
      review_text: formData.review_text.trim(),
    })

    if (result.success) {
      // Add new review to the list
      setReviews([result.data, ...reviews])
      // Reset form
      setFormData({ name: '', review_text: '' })
      setShowForm(false)
      setError(null)
    } else {
      setError(result.error || 'Failed to submit review')
    }

    setSubmitting(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleWriteReviewClick = () => {
    if (locationStatus !== 'granted') {
      // If location not granted, show the banner (it will be shown when showForm is true and location is not granted)
      setShowForm(true)
    } else {
      // If location is granted, show the form
      setShowForm(true)
    }
  }

  return (
    <section className="mt-8 pt-8 border-t border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-neutral-900">
          Customer Reviews
          {reviews.length > 0 && (
            <span className="ml-2 text-lg font-normal text-neutral-600">
              ({reviews.length})
            </span>
          )}
        </h2>
      </div>

      {/* Write Review Button - Always visible */}
      {!showForm && (
        <div className="mb-8">
          <Button
            variant="primary"
            onClick={handleWriteReviewClick}
          >
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Form - Show if button clicked and location is granted */}
      {showForm && locationStatus === 'granted' && (
        <div className="mb-8">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="review-name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Name (Optional)
                </label>
                <Input
                  id="review-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name (optional)"
                  className="w-full"
                />
              </div>
              <div>
                <label htmlFor="review-text" className="block text-sm font-medium text-neutral-700 mb-1">
                  Review <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review-text"
                  value={formData.review_text}
                  onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                  placeholder="Share your thoughts about this product..."
                  required
                  rows={5}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ name: '', review_text: '' })
                    setError(null)
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Permission Banner - Show if button clicked and location not granted */}
      {showForm && locationStatus !== 'granted' && (
        <div className="mb-8">
          <LocationPermissionBanner
            onEnableLocation={requestLocation}
            title="Write a Review"
            isRequesting={locationStatus === 'requesting'}
          />
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false)
                setError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
          <span className="ml-3 text-neutral-600">Loading reviews...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-neutral-600">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-neutral-200 rounded-lg p-2 shadow-sm"
            >
              <div className="mb-1">
                <h4 className="font-semibold text-neutral-900 inline">
                  {review.reviewer_name}
                </h4>
                <span className="text-xs text-neutral-500 ml-2">
                  ({formatDate(review.created_at)})
                </span>
              </div>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap text-sm">
                {review.review_text}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

Reviews.propTypes = {
  productId: PropTypes.string.isRequired,
}

export default Reviews

