import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Image Carousel component with dots indicator and swipe/drag functionality
 */
function ImageCarousel({
  images,
  autoPlay = false,
  autoPlayInterval = 3000,
  showDots = true,
  showArrows = true,
  enableSwipe = true,
  className = '',
  enableLightbox = true,
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const carouselRef = useRef(null)
  const lightboxRef = useRef(null)
  
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)
    
    return () => clearInterval(interval)
  }, [autoPlay, autoPlayInterval, images.length])
  
  const goToSlide = (index) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index)
    }
  }
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }
  
  // Touch/Mouse event handlers for swipe
  const handleStart = (clientX) => {
    if (!enableSwipe) return
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }
  
  const handleMove = (clientX) => {
    if (!isDragging || !enableSwipe) return
    setCurrentX(clientX)
  }
  
  const handleEnd = () => {
    if (!isDragging || !enableSwipe) return
    
    const diff = startX - currentX
    const threshold = 50 // Minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext() // Swipe left (next)
      } else {
        goToPrevious() // Swipe right (previous)
      }
    }
    
    setIsDragging(false)
    setStartX(0)
    setCurrentX(0)
  }
  
  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleStart(e.clientX)
  }
  
  const handleMouseMove = (e) => {
    handleMove(e.clientX)
  }
  
  const handleMouseUp = () => {
    handleEnd()
  }
  
  const handleMouseLeave = () => {
    if (isDragging) {
      handleEnd()
    }
  }
  
  // Touch events
  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX)
  }
  
  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    handleEnd()
  }
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (images.length <= 1) return
      
      if (isLightboxOpen) {
        // Lightbox keyboard navigation
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setLightboxIndex((prev) => (prev + 1) % images.length)
        } else if (e.key === 'Escape') {
          e.preventDefault()
          setIsLightboxOpen(false)
        }
      } else {
        // Carousel keyboard navigation
        if (e.key === 'ArrowLeft') {
          goToPrevious()
        } else if (e.key === 'ArrowRight') {
          goToNext()
        }
      }
    }
    
    if (isLightboxOpen || carouselRef.current) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [images.length, isLightboxOpen])
  
  // Handle image click to open lightbox
  const handleImageClick = (e) => {
    e.stopPropagation()
    if (enableLightbox && !isDragging) {
      setLightboxIndex(currentIndex)
      setIsLightboxOpen(true)
    }
  }
  
  // Lightbox navigation
  const goToLightboxPrevious = () => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)
  }
  
  const goToLightboxNext = () => {
    setLightboxIndex((prev) => (prev + 1) % images.length)
  }
  
  // Lightbox swipe handlers
  const [lightboxDragging, setLightboxDragging] = useState(false)
  const [lightboxStartX, setLightboxStartX] = useState(0)
  const [lightboxCurrentX, setLightboxCurrentX] = useState(0)
  
  const handleLightboxStart = (clientX) => {
    setLightboxDragging(true)
    setLightboxStartX(clientX)
    setLightboxCurrentX(clientX)
  }
  
  const handleLightboxMove = (clientX) => {
    if (!lightboxDragging) return
    setLightboxCurrentX(clientX)
  }
  
  const handleLightboxEnd = () => {
    if (!lightboxDragging) return
    
    const diff = lightboxStartX - lightboxCurrentX
    const threshold = 50
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToLightboxNext()
      } else {
        goToLightboxPrevious()
      }
    }
    
    setLightboxDragging(false)
    setLightboxStartX(0)
    setLightboxCurrentX(0)
  }
  
  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isLightboxOpen])
  
  if (!images || images.length === 0) {
    return (
      <div className={`w-full h-64 bg-neutral-200 flex items-center justify-center rounded-lg ${className}`}>
        <p className="text-neutral-500">No images available</p>
      </div>
    )
  }
  
  const dragOffset = isDragging ? currentX - startX : 0
  const slideWidthPercent = 100 / images.length
  const translateXPercent = -currentIndex * slideWidthPercent
  const dragOffsetPercent = carouselRef.current 
    ? (dragOffset / carouselRef.current.offsetWidth) * 100 
    : 0
  
  return (
    <div className={`relative w-full ${className}`}>
      <div
        ref={carouselRef}
        className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[500px] overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(calc(${translateXPercent}% + ${dragOffsetPercent}%))`,
            width: `${images.length * 100}%`,
          }}
        >
          {images.map((image, index) => (
            <div
              key={index}
              className="h-full flex-shrink-0"
              style={{ 
                flexBasis: `${100 / images.length}%`,
                width: `${100 / images.length}%`,
                minWidth: `${100 / images.length}%`,
                maxWidth: `${100 / images.length}%`,
              }}
            >
              <img
                src={image.url || image}
                alt={image.alt || `Image ${index + 1}`}
                className={`w-full h-full object-cover ${enableLightbox ? 'cursor-zoom-in' : ''}`}
                draggable={false}
                onClick={enableLightbox ? handleImageClick : undefined}
                onMouseDown={(e) => {
                  if (enableLightbox) {
                    e.stopPropagation()
                  }
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e5e5" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
          ))}
        </div>
        
        {showArrows && images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition-all z-10 shadow-md"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-75 hover:bg-opacity-100 rounded-full p-2 transition-all z-10 shadow-md"
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
      
      {/* Full-screen Lightbox */}
      {isLightboxOpen && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 z-[9999] bg-neutral-900 bg-opacity-95 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === lightboxRef.current) {
              setIsLightboxOpen(false)
            }
          }}
          onMouseDown={(e) => {
            if (e.target === lightboxRef.current || e.target.tagName === 'IMG') {
              handleLightboxStart(e.clientX)
            }
          }}
          onMouseMove={(e) => {
            if (lightboxDragging) {
              handleLightboxMove(e.clientX)
            }
          }}
          onMouseUp={handleLightboxEnd}
          onMouseLeave={handleLightboxEnd}
          onTouchStart={(e) => {
            if (e.target === lightboxRef.current || e.target.tagName === 'IMG') {
              handleLightboxStart(e.touches[0].clientX)
            }
          }}
          onTouchMove={(e) => {
            if (lightboxDragging) {
              handleLightboxMove(e.touches[0].clientX)
            }
          }}
          onTouchEnd={handleLightboxEnd}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 bg-neutral-800 bg-opacity-75 hover:bg-opacity-100 text-white rounded-full p-2 transition-all"
            aria-label="Close lightbox"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-neutral-800 bg-opacity-75 text-white px-4 py-2 rounded-full text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
          
          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToLightboxPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-neutral-800 bg-opacity-75 hover:bg-opacity-100 text-white rounded-full p-3 transition-all"
              aria-label="Previous image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToLightboxNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-neutral-800 bg-opacity-75 hover:bg-opacity-100 text-white rounded-full p-3 transition-all"
              aria-label="Next image"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          {/* Image Container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: lightboxDragging
                ? `translateX(${lightboxCurrentX - lightboxStartX}px)`
                : 'translateX(0)',
              transition: lightboxDragging ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            <img
              src={images[lightboxIndex]?.url || images[lightboxIndex]}
              alt={images[lightboxIndex]?.alt || `Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
              draggable={false}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e5e5" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
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
  enableSwipe: PropTypes.bool,
  enableLightbox: PropTypes.bool,
  className: PropTypes.string,
}

export default ImageCarousel
