// Utility for managing anonymous visitor IDs on the frontend.
// Stores visitor_id in localStorage only (no cookies).

const VISITOR_STORAGE_KEY = 'visitor_id'
const OLD_VISITOR_STORAGE_KEY = 'old_visitor_id'

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

/**
 * Save visitor_id to localStorage
 */
export function saveVisitorId(visitorId) {
  if (!isBrowser || !visitorId) {
    return
  }
  if (window.localStorage) {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId)
  }
}

/**
 * Get current visitor_id from localStorage
 */
export function getVisitorId() {
  if (!isBrowser) {
    return null
  }
  if (window.localStorage) {
    return window.localStorage.getItem(VISITOR_STORAGE_KEY)
  }
  return null
}

/**
 * Save old_visitor_id to localStorage (used when logging in)
 */
export function saveOldVisitorId(visitorId) {
  if (!isBrowser || !visitorId) {
    return
  }
  if (window.localStorage) {
    window.localStorage.setItem(OLD_VISITOR_STORAGE_KEY, visitorId)
  }
}

/**
 * Get old_visitor_id from localStorage
 */
export function getOldVisitorId() {
  if (!isBrowser) {
    return null
  }
  if (window.localStorage) {
    return window.localStorage.getItem(OLD_VISITOR_STORAGE_KEY)
  }
  return null
}

/**
 * Restore old_visitor_id to visitor_id (used when logging out or session expires)
 */
export function restoreOldVisitorId() {
  if (!isBrowser) {
    return null
  }
  if (window.localStorage) {
    const oldVisitorId = window.localStorage.getItem(OLD_VISITOR_STORAGE_KEY)
    if (oldVisitorId) {
      window.localStorage.setItem(VISITOR_STORAGE_KEY, oldVisitorId)
      window.localStorage.removeItem(OLD_VISITOR_STORAGE_KEY)
      return oldVisitorId
    }
  }
  return null
}

/**
 * Clear old_visitor_id from localStorage
 */
export function clearOldVisitorId() {
  if (!isBrowser) {
    return
  }
  if (window.localStorage) {
    window.localStorage.removeItem(OLD_VISITOR_STORAGE_KEY)
  }
}

export default {
  getOrCreateVisitorId,
  saveVisitorId,
  getVisitorId,
  saveOldVisitorId,
  getOldVisitorId,
  restoreOldVisitorId,
  clearOldVisitorId,
}


