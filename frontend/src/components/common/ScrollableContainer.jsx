import { useRef, useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Scrollable Container component for categories and horizontal scrolling
 */
function ScrollableContainer({
  children,
  className = '',
  showScrollButtons = true,
  scrollStep = 200,
}) {
  const containerRef = useRef(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  
  const checkScrollButtons = () => {
    if (!containerRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
    setShowLeftButton(scrollLeft > 0)
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10)
  }
  
  useEffect(() => {
    checkScrollButtons()
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', checkScrollButtons)
      window.addEventListener('resize', checkScrollButtons)
      return () => {
        container.removeEventListener('scroll', checkScrollButtons)
        window.removeEventListener('resize', checkScrollButtons)
      }
    }
  }, [children])
  
  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -scrollStep, behavior: 'smooth' })
    }
  }
  
  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: scrollStep, behavior: 'smooth' })
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      {showScrollButtons && showLeftButton && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-neutral-100 transition-all"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>
      
      {showScrollButtons && showRightButton && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-neutral-100 transition-all"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  )
}

ScrollableContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  showScrollButtons: PropTypes.bool,
  scrollStep: PropTypes.number,
}

export default ScrollableContainer

