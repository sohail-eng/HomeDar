// Utility for managing anonymous visitor IDs on the frontend.
//
// The backend also creates / updates a visitor_id cookie defensively,
// but we keep this helper so the frontend can ensure the cookie exists
// before making tracking calls and optionally mirror it in localStorage.

const VISITOR_COOKIE_NAME = 'visitor_id'
const VISITOR_STORAGE_KEY = 'visitor_id'

const isBrowser = typeof window !== 'undefined'

function readCookie(name) {
  if (!isBrowser || !document.cookie) return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop().split(';').shift() || null
  }
  return null
}

function setCookie(name, value, days = 365) {
  if (!isBrowser) return
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
}

export function getOrCreateVisitorId() {
  if (!isBrowser) {
    return null
  }

  // 1. Try cookie
  let visitorId = readCookie(VISITOR_COOKIE_NAME)

  // 2. Fallback to localStorage
  if (!visitorId && window.localStorage) {
    visitorId = window.localStorage.getItem(VISITOR_STORAGE_KEY)
  }

  // 3. Generate if still missing
  if (!visitorId) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      visitorId = window.crypto.randomUUID()
    } else {
      // Very small fallback for older browsers
      visitorId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
  }

  // 4. Persist to cookie and localStorage
  setCookie(VISITOR_COOKIE_NAME, visitorId, 365)
  if (window.localStorage) {
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId)
  }

  return visitorId
}

export default {
  getOrCreateVisitorId,
}


