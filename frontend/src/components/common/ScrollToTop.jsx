import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop component that scrolls to top on route change
 * Excludes the listing page (/) from scrolling
 */
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Don't scroll to top on the listing page
    if (pathname !== '/') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant', // Use instant for immediate scroll
      })
    }
  }, [pathname])

  return null
}

export default ScrollToTop

