// Utility for managing anonymous visitor IDs on the frontend.
// Stores visitor_id in localStorage only (no cookies).

const VISITOR_STORAGE_KEY = 'visitor_id'

const isBrowser = typeof window !== 'undefined'

export function getOrCreateVisitorId() {
  if (!isBrowser) {
    return null
  }

  // 1. Try localStorage
  let visitorId = null
  if (window.localStorage) {
    visitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY)
  }

  // 2. Generate if still missing
  if (!visitorId) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      visitorId = window.crypto.randomUUID()
    } else {
      // Very small fallback for older browsers
      visitorId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
  }

  // 3. Persist to localStorage
  if (window.localStorage) {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId)
  }

  return visitorId
}

export default {
  getOrCreateVisitorId,
}


