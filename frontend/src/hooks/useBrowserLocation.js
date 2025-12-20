import { useEffect, useState, useCallback, useRef } from 'react'

// Keys in localStorage
const CONSENT_KEY = 'location_consent' // 'granted' | 'denied'
const LOCATION_KEY = 'location_last'

// Minimum distance change (in degrees) to consider "changed" enough to send again.
// Roughly ~500–1000m depending on latitude when 0.01 degrees.
const MIN_DELTA = 0.01

// How often to check for location updates (in milliseconds)
// This ensures we periodically check even if watchPosition doesn't fire
const LOCATION_CHECK_INTERVAL = 60 * 60 * 1000 // 1 hour

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

function getInitialStatus() {
  if (typeof window === 'undefined') return 'idle'
  const storedConsent = window.localStorage.getItem(CONSENT_KEY)
  const storedLocation = readStoredLocation()
  
  if (storedConsent === 'denied') {
    return 'denied'
  }
  
  if (storedConsent === 'granted' && storedLocation) {
    return 'granted'
  }
  
  return 'idle'
}

/**
 * Global hook to:
 * - Request browser geolocation once on load (if user has not explicitly denied)
 * - Store location in localStorage
 * - Only send location to backend when it changes meaningfully
 * - Provide manual requestLocation() function for re-requesting permission
 * - Respect previously granted consent and update location silently when user moves
 *
 * Note:
 * - We include precise location in tracking payloads via trackProductView()
 *   instead of creating a separate endpoint.
 */
export function useBrowserLocation() {
  // Initialize status from localStorage immediately to avoid showing banner unnecessarily
  const [status, setStatus] = useState(() => getInitialStatus()) // idle | requesting | granted | denied
  const [location, setLocation] = useState(() => readStoredLocation())
  const watchIdRef = useRef(null)
  const intervalIdRef = useRef(null)

  // Function to update location silently (without prompting)
  const updateLocationSilently = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) return

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const roundedLat = Number(pos.coords.latitude.toFixed(4))
        const roundedLng = Number(pos.coords.longitude.toFixed(4))

        const previous = readStoredLocation()
        if (hasMeaningfulChange(previous, roundedLat, roundedLng)) {
          // Location changed meaningfully - update it silently
          storeLocation(roundedLat, roundedLng)
          setLocation({ latitude: roundedLat, longitude: roundedLng })
        }
        // If no meaningful change, keep existing location
      },
      (error) => {
        // Silently handle errors - don't change status if permission was already granted
        if (import.meta.env.DEV) {
          console.debug('Periodic location check failed (silent):', error)
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000, // Use cached location if less than 1 minute old
      }
    )
  }, [])

  const requestLocation = useCallback(() => {
    if (typeof window === 'undefined') return

    if (!('geolocation' in navigator)) {
      setStatus('denied')
      return
    }

    // Clear denied consent to allow re-request
    if (window.localStorage.getItem(CONSENT_KEY) === 'denied') {
      window.localStorage.removeItem(CONSENT_KEY)
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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedConsent = window.localStorage.getItem(CONSENT_KEY)
    const storedLocation = readStoredLocation()

    // If user previously denied, do not request again automatically.
    if (storedConsent === 'denied') {
      // Status should already be 'denied' from initial state, but ensure it
      if (status !== 'denied') {
        setStatus('denied')
      }
      return
    }

    // If user previously granted and we have a stored location, use it immediately
    // Then set up silent background updates using watchPosition
    if (storedConsent === 'granted' && storedLocation) {
      // Status should already be 'granted' from initial state, but ensure it
      if (status !== 'granted') {
        setStatus('granted')
      }
      if (!location || location.latitude !== storedLocation.latitude || location.longitude !== storedLocation.longitude) {
        setLocation(storedLocation)
      }

      // Set up silent location monitoring (won't prompt if permission already granted)
      // Only set up if not already watching
      if ('geolocation' in navigator && watchIdRef.current === null) {
        // Start watching for location changes (silent, no prompt if permission already granted)
        // watchPosition is event-driven and fires when device detects movement
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const roundedLat = Number(pos.coords.latitude.toFixed(4))
            const roundedLng = Number(pos.coords.longitude.toFixed(4))

            const previous = readStoredLocation()
            if (hasMeaningfulChange(previous, roundedLat, roundedLng)) {
              // Location changed meaningfully - update it silently
              storeLocation(roundedLat, roundedLng)
              setLocation({ latitude: roundedLat, longitude: roundedLng })
            }
          },
          (error) => {
            // Silently handle errors - don't change status if permission was already granted
            // This handles cases where location is temporarily unavailable
            if (import.meta.env.DEV) {
              console.debug('Location watch error (silent):', error)
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000, // Use cached location if less than 1 minute old
          }
        )

        // Also set up periodic checks (every 1 hour) as a fallback
        // This ensures we check for location updates even if watchPosition doesn't fire
        if (intervalIdRef.current === null) {
          intervalIdRef.current = setInterval(() => {
            updateLocationSilently()
          }, LOCATION_CHECK_INTERVAL)
        }
      }

      // Cleanup function to stop watching when component unmounts
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
        if (intervalIdRef.current !== null) {
          clearInterval(intervalIdRef.current)
          intervalIdRef.current = null
        }
      }
    }

    // Only request if geolocation is available and we don't have stored consent
    // Also skip if status is already 'granted' (from initial state)
    if (!('geolocation' in navigator)) {
      if (status !== 'denied') {
        setStatus('denied')
      }
      return
    }

    // Skip if already granted (shouldn't happen, but safety check)
    if (status === 'granted') {
      return
    }

    // First time - request permission
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
        } else {
          setLocation(previous || { latitude: roundedLat, longitude: roundedLng })
        }

        // Start watching for location changes after first permission grant
        // Only set up if not already watching
        if ('geolocation' in navigator && watchIdRef.current === null) {
          // watchPosition is event-driven and fires when device detects movement
          watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
              const roundedLat = Number(pos.coords.latitude.toFixed(4))
              const roundedLng = Number(pos.coords.longitude.toFixed(4))

              const previous = readStoredLocation()
              if (hasMeaningfulChange(previous, roundedLat, roundedLng)) {
                // Location changed meaningfully - update it silently
                storeLocation(roundedLat, roundedLng)
                setLocation({ latitude: roundedLat, longitude: roundedLng })
              }
            },
            (error) => {
              // Silently handle errors
              if (import.meta.env.DEV) {
                console.debug('Location watch error:', error)
              }
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000, // Use cached location if less than 1 minute old
            }
          )

          // Also set up periodic checks (every 1 hour) as a fallback
          // This ensures we check for location updates even if watchPosition doesn't fire
          if (intervalIdRef.current === null) {
            intervalIdRef.current = setInterval(() => {
              updateLocationSilently()
            }, LOCATION_CHECK_INTERVAL)
          }
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

    // Cleanup function to stop watching when component unmounts
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current)
        intervalIdRef.current = null
      }
    }
  }, [])

  return { status, location, requestLocation }
}

export default useBrowserLocation


