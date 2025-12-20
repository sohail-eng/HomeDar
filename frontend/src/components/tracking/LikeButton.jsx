import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { toggleProductLike, checkProductLike } from '../../services/trackingService'

/**
 * LikeButton Component
 * Displays a heart icon that can be clicked to like/unlike a product.
 * Only visible when location is granted.
 */
function LikeButton({ productId, className = '' }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  // Check initial like status on mount
  useEffect(() => {
    if (!productId) {
      setLoading(false)
      return
    }

    const checkLike = async () => {
      try {
        const result = await checkProductLike(productId)
        if (result.success) {
          setLiked(result.liked)
          setLikeCount(result.like_count || 0)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Failed to check like status:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    checkLike()
  }, [productId])

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!productId || toggling) return

    setToggling(true)
    try {
      const result = await toggleProductLike(productId)
      if (result.success) {
        setLiked(result.liked)
        setLikeCount(result.like_count || 0)
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Failed to toggle like:', error)
      }
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return null // Don't show anything while loading
  }

  return (
    <div
      className={`
        absolute top-4 right-4 z-10
        flex flex-col items-center
        ${className}
      `}
    >
      <button
        onClick={handleClick}
        disabled={toggling}
        className={`
          p-3 rounded-full
          bg-white/90 backdrop-blur-sm
          shadow-lg
          transition-all duration-200
          hover:bg-white hover:scale-110
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        aria-label={liked ? 'Unlike this product' : 'Like this product'}
        title={liked ? 'Unlike' : 'Like'}
      >
        {liked ? (
          // Filled heart (liked)
          <svg
            className="w-8 h-8 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          // Outline heart (not liked)
          <svg
            className="w-8 h-8 text-neutral-600 hover:text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
      {/* Like Count */}
      <div className="mt-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-md">
        <span className="text-sm font-semibold text-neutral-700">
          {likeCount}
        </span>
      </div>
    </div>
  )
}

LikeButton.propTypes = {
  productId: PropTypes.string.isRequired,
  className: PropTypes.string,
}

export default LikeButton

