import { useEffect, useState } from 'react'
import { trackProductView } from '../services/trackingService'

// Keys in localStorage
const CONSENT_KEY = 'location_consent' // 'granted' | 'denied'
const LOCATION_KEY = 'location_last'

// Minimum distance change (in degrees) to consider "changed" enough to send again.
// Roughly ~500–1000m depending on latitude when 0.01 degrees.
const MIN_DELTA = 0.01

function readStoredLocation() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return parsed
    }
  } catch (_) {
    // ignore parse errors
  }
  return null
}

function storeLocation(lat, lng) {
  if (typeof window === 'undefined') return
  try {
    const payload = { latitude: lat, longitude: lng }
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(payload))
  } catch (_) {
    // ignore storage errors
  }
}

function hasConsent() {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(CONSENT_KEY) === 'granted'
}

function setConsent(value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONSENT_KEY, value)
}

function hasMeaningfulChange(oldLoc, newLat, newLng) {
  if (!oldLoc) return true
  const dLat = Math.abs(oldLoc.latitude - newLat)
  const dLng = Math.abs(oldLoc.longitude - newLng)
  return dLat > MIN_DELTA || dLng > MIN_DELTA
}

/**
 * Global hook to:
 * - Request browser geolocation once on load (if user has not explicitly denied)
 * - Store location in localStorage
 * - Only send location to backend when it changes meaningfully
 *
 * Note:
 * - We include precise location in tracking payloads via trackProductView()
 *   instead of creating a separate endpoint.
 */
export function useBrowserLocation() {
  const [status, setStatus] = useState('idle') // idle | requesting | granted | denied
  const [location, setLocation] = useState(() => readStoredLocation())

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If user previously denied, do not request again.
    if (window.localStorage.getItem(CONSENT_KEY) === 'denied') {
      setStatus('denied')
      return
    }

    if (!('geolocation' in navigator)) {
      return
    }

    setStatus('requesting')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const roundedLat = Number(pos.coords.latitude.toFixed(4))
        const roundedLng = Number(pos.coords.longitude.toFixed(4))

        setConsent('granted')
        setStatus('granted')

        const previous = readStoredLocation()
        if (hasMeaningfulChange(previous, roundedLat, roundedLng)) {
          storeLocation(roundedLat, roundedLng)
          setLocation({ latitude: roundedLat, longitude: roundedLng })

          // We do NOT know which product is currently being viewed here.
          // To follow your requirement "send location to backend when changed only"
          // we piggy‑back on the product view tracking and let location be attached
          // on the next trackProductView call (ProductDetail already does this).
          //
          // If you later want a standalone visitor-location endpoint, we can
          // call it from here instead.
        } else {
          // No meaningful change; keep existing stored location.
          setLocation(previous || { latitude: roundedLat, longitude: roundedLng })
        }
      },
      () => {
        setConsent('denied')
        setStatus('denied')
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // up to 5 minutes
      }
    )
  }, [])

  return { status, location }
}

export default useBrowserLocation


