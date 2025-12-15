import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Image Carousel component with dots indicator
 */
function ImageCarousel({
  images,
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  className = '',
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)
    
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, images.length])
  
  const goToSlide = (index) => {
    setCurrentIndex(index)
  }
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }
  
  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-64 bg-neutral-200 flex items-center justify-center ${className}`}>
        <p className="text-neutral-500">No images available</p>
      </div>
    )
  }
  
  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden rounded-lg">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image.url || image}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e5e5" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
        ))}
        
        {showArrows && images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition-all"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition-all"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {showDots && images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-primary-600'
                  : 'w-2 bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

ImageCarousel.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        url: PropTypes.string.isRequired,
        alt: PropTypes.string,
      }),
    ])
  ).isRequired,
  autoPlay: PropTypes.bool,
  autoPlayInterval: PropTypes.number,
  showDots: PropTypes.bool,
  showArrows: PropTypes.bool,
  className: PropTypes.string,
}

export default ImageCarousel

