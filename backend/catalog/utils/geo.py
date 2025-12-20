"""
Utility functions for IP-based geolocation and visitor-related helpers.

Uses a configurable free geolocation API and includes basic retry logic
to respect rate limits (e.g. 1 request / second), with a maximum total
wait of 60 seconds per lookup.
"""

from __future__ import annotations

import logging
import time
from typing import Optional, Tuple

import requests
from django.conf import settings
from django.http import HttpRequest

from catalog.models import VisitorProfile

logger = logging.getLogger(__name__)


def get_client_ip(request: HttpRequest) -> Optional[str]:
    """
    Extract client IP address from request, respecting common proxy headers.

    - Prefers X-Forwarded-For (left-most IP) when present.
    - Falls back to REMOTE_ADDR.
    """
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
        return ip or None

    ip = request.META.get("REMOTE_ADDR")
    return ip or None


def _get_geo_config() -> Tuple[str, Optional[str]]:
    """
    Resolve geolocation API endpoint and API key from settings / env.

    You can configure:
    - IP_GEO_ENDPOINT: e.g. https://ipapi.co/{ip}/json/
    - IP_GEO_API_KEY: optional, depending on provider
    """
    # Default to a common free endpoint pattern if not overridden.
    default_endpoint = "https://ipapi.co/{ip}/json/"

    endpoint = getattr(settings, "IP_GEO_ENDPOINT", None) or default_endpoint
    api_key = getattr(settings, "IP_GEO_API_KEY", None) or None
    return endpoint, api_key


def lookup_location(ip: str) -> Tuple[Optional[str], Optional[str], Optional[float], Optional[float]]:
    """
    Lookup approximate location for an IP address using a free API.

    Returns a tuple:
        (country_code, city_name, latitude, longitude)

    Retry behaviour (for free APIs with strict rate limits):
    - If we receive a 429 (Too Many Requests) or 5xx response, we wait 1 second
      and retry, up to a maximum of 60 seconds total wait time.
    - Any other HTTP status or exceptions will be logged and return (None, None, None, None).
    """
    if not ip:
        return None, None, None, None

    endpoint_template, api_key = _get_geo_config()

    # Basic protection against accidental blocking:
    max_total_wait_seconds = 60
    sleep_per_retry_seconds = 1

    start_time = time.time()

    # Build URL and headers/query depending on provider style.
    url = endpoint_template.format(ip=ip)
    headers = {}
    params = {}

    if api_key:
        # Many providers use either a header or query param; we keep this generic.
        # Adjust to your provider as needed.
        headers["Authorization"] = f"Bearer {api_key}"

    while True:
        elapsed = time.time() - start_time
        if elapsed > max_total_wait_seconds:
            logger.warning(
                "Geolocation lookup for IP %s exceeded max wait of %s seconds",
                ip,
                max_total_wait_seconds,
            )
            return None, None, None, None

        try:
            response = requests.get(url, headers=headers, params=params, timeout=5)
        except requests.RequestException as exc:
            logger.warning("Geolocation request failed for IP %s: %s", ip, exc)
            # Do not retry endlessly on network errors; just bail out.
            return None, None, None, None

        # Respect rate-limit style responses by waiting and retrying.
        if response.status_code in (429, 500, 502, 503, 504):
            logger.info(
                "Geolocation API rate-limited or temporary error (status %s) for IP %s; "
                "sleeping %s second(s) before retry.",
                response.status_code,
                ip,
                sleep_per_retry_seconds,
            )
            time.sleep(sleep_per_retry_seconds)
            continue

        if not response.ok:
            logger.warning(
                "Geolocation API returned unexpected status %s for IP %s",
                response.status_code,
                ip,
            )
            return None, None, None, None

        try:
            data = response.json()
        except ValueError:
            logger.warning("Failed to parse geolocation JSON for IP %s", ip)
            return None, None, None, None

        # Map common fields from typical free IP APIs (ipapi, ipinfo, etc.).
        # Prefer full country name when available.
        country = (
            data.get("country_name")
            or data.get("country")
            or data.get("country_code")
            or ""
        ).strip() or None
        city = (data.get("city") or data.get("region") or "").strip() or None

        lat = data.get("latitude") or data.get("lat")
        lon = data.get("longitude") or data.get("lon") or data.get("lng")

        try:
            lat_f = float(lat) if lat is not None else None
            lon_f = float(lon) if lon is not None else None
        except (TypeError, ValueError):
            lat_f = None
            lon_f = None

        return country, city, lat_f, lon_f


def ensure_visitor_profile_for_request(request: HttpRequest, visitor_id: str) -> Optional[VisitorProfile]:
    """
    Ensure a VisitorProfile exists for the given visitor_id and update basic info.

    This does NOT create or manage cookies itself – that will be done in a
    dedicated middleware or view – but once you have a visitor_id from the
    cookie, you can call this helper to:
      - create the profile if missing
      - update last_seen / last_ip
      - populate country/city from IP if not already known (with geolocation)
    """
    if not visitor_id:
        return None

    ip = get_client_ip(request)

    profile, created = VisitorProfile.objects.get_or_create(
        visitor_id=visitor_id,
        defaults={"last_ip": ip},
    )

    # Always keep last_seen up to date; update IP when it changes.
    update_fields = ["last_seen"]
    if ip and ip != profile.last_ip:
        profile.last_ip = ip
        update_fields.append("last_ip")

    profile.save(update_fields=update_fields)
    return profile


def lookup_location_from_coords(
    latitude: float, longitude: float
) -> Tuple[Optional[str], Optional[str]]:
    """
    Reverse-geocode approximate location for given latitude/longitude.

    Returns:
        (country_name, city_name)

    Uses a configurable endpoint, defaulting to a common free reverse
    geocoding service (e.g. Nominatim).
    
    Rate limiting:
    - Waits 1 second before each API call to respect free API rate limits (1 req/sec)
    - Includes retry logic: on 429/5xx, waits 1 second and retries,
      up to 60 seconds total wait time.
    """
    if latitude is None or longitude is None:
        return None, None

    endpoint = getattr(
        settings,
        "REVERSE_GEO_ENDPOINT",
        "https://nominatim.openstreetmap.org/reverse",
    )

    params = {
        "lat": latitude,
        "lon": longitude,
        "format": "jsonv2",
        "accept-language": "en",  # Force English language for results
    }
    # Nominatim requires a descriptive User-Agent header
    headers = {
        "User-Agent": "HomeDar-ECommerce/1.0 (Contact: info@homedar.com)"
    }

    max_total_wait_seconds = 60
    sleep_before_request_seconds = 1  # Wait 1 second before each API call to respect rate limits
    sleep_per_retry_seconds = 1
    request_timeout = 10  # Increased timeout to handle slow responses
    start_time = time.time()
    first_request = True

    while True:
        elapsed = time.time() - start_time
        if elapsed > max_total_wait_seconds:
            logger.warning(
                "Reverse geocoding for coords (%s, %s) exceeded max wait of %s seconds",
                latitude,
                longitude,
                max_total_wait_seconds,
            )
            return None, None

        # Wait 1 second before each API call to respect rate limits (1 req/sec)
        # Skip wait for first request to avoid unnecessary delay on initial call
        if not first_request:
            time.sleep(sleep_before_request_seconds)
        first_request = False

        try:
            response = requests.get(
                endpoint, params=params, headers=headers, timeout=request_timeout
            )
        except requests.RequestException as exc:
            logger.warning(
                "Reverse geocoding request failed for coords (%s, %s): %s",
                latitude,
                longitude,
                exc,
            )
            return None, None

        if response.status_code == 403:
            logger.warning(
                "Reverse geocoding API returned 403 Forbidden for coords (%s, %s). "
                "This may indicate missing User-Agent header or API blocking.",
                latitude,
                longitude,
            )
            return None, None

        if response.status_code in (429, 500, 502, 503, 504):
            logger.info(
                "Reverse geocoding rate-limited/temporary error (status %s) "
                "for coords (%s, %s); sleeping %s second(s) before retry.",
                response.status_code,
                latitude,
                longitude,
                sleep_per_retry_seconds,
            )
            time.sleep(sleep_per_retry_seconds)
            continue

        if not response.ok:
            logger.warning(
                "Reverse geocoding API returned status %s for coords (%s, %s)",
                response.status_code,
                latitude,
                longitude,
            )
            return None, None

        try:
            data = response.json()
        except ValueError:
            logger.warning(
                "Failed to parse reverse geocoding JSON for coords (%s, %s)",
                latitude,
                longitude,
            )
            return None, None

        address = data.get("address") or {}
        
        country_name = (address.get("country") or "").strip() or None

        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("district")
            or address.get("state")
            or ""
        ).strip() or None

        return country_name, city
