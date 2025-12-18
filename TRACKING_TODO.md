# HomeDar - Visitor Tracking & Personalization TODO

## Phase 4: Visitor Tracking & Personalization (Anonymous Users)

> Goal: Track anonymous visitors and their interactions (viewed products, location) in a privacy‑aware way, so we can power “Recently Viewed”, “Popular Near You”, and future personalization features.

---

### 4.1 Requirements & Design

- [ ] Clarify tracking goals and constraints
  - [ ] Define exactly what we want to track for now:
    - [ ] Product views (which product, when, how often)
    - [ ] Approximate location from IP (country, city/region)
    - [ ] Optional precise location from browser geolocation (lat/lng, rounded)
  - [ ] Decide maximum retention period for raw tracking data (e.g. 6–12 months)
  - [ ] Document privacy approach:
    - [ ] No PII stored (only anonymous visitor ID + derived location)
    - [ ] Clear statement in privacy section / README about tracking

- [ ] Anonymous visitor model & identifier
  - [ ] Decide on visitor identifier format (UUIDv4 string)
  - [ ] Decide where to store it:
    - [ ] HTTP cookie (e.g. `visitor_id`) with long expiry
    - [ ] Fallback to localStorage on frontend (in case cookies are blocked)
  - [ ] Decide how to link visitor to future authenticated users (for later auth phase)

---

### 4.2 Backend: Models

- [ ] Create `VisitorProfile` model
  - [ ] Fields:
    - [ ] `visitor_id` (CharField, primary key or unique, stores UUID from cookie)
    - [ ] `first_seen` (DateTimeField, auto_now_add)
    - [ ] `last_seen` (DateTimeField, auto_now)
    - [ ] `last_ip` (GenericIPAddressField, nullable)
    - [ ] `country` (CharField, 2‑letter ISO code, nullable)
    - [ ] `city` (CharField, nullable)
    - [ ] Optional: `latitude`, `longitude` (FloatFields, nullable, rounded)
  - [ ] Add Meta options (ordering by `-last_seen`)
  - [ ] Add `__str__` for admin readability

- [ ] Create `ProductView` model
  - [ ] Fields:
    - [ ] `id` (UUID primary key)
    - [ ] `visitor` (ForeignKey to `VisitorProfile`, CASCADE)
    - [ ] `product` (ForeignKey to `Product`, CASCADE, related_name=`views`)
    - [ ] `viewed_at` (DateTimeField, auto_now_add)
    - [ ] `country` (CharField, nullable, default from visitor at time of view)
    - [ ] `city` (CharField, nullable)
    - [ ] Optional: `latitude`, `longitude` (FloatFields, nullable, rounded)
    - [ ] Optional: `user_agent` (CharField/TextField, truncated)
  - [ ] Add useful indexes:
    - [ ] (`visitor`, `viewed_at`)
    - [ ] (`product`, `viewed_at`)
    - [ ] (`country`, `viewed_at`)
  - [ ] Add Meta ordering (`-viewed_at`)

---

### 4.3 Backend: IP Geolocation & Visitor Management

- [ ] Choose IP geolocation strategy
  - [ ] Decide on provider:
    - [ ] Option A: Free SaaS API (ipinfo.io, ipapi, etc.) with caching
    - [ ] Option B: Local DB (MaxMind GeoLite2) + library
  - [ ] Add provider configuration to `backend/requirements.txt` (if needed)
  - [ ] Add env vars to `backend/.env.example` (e.g. `IP_GEO_API_KEY`, `IP_GEO_ENDPOINT`)

- [ ] Implement helper for geolocation
  - [ ] Create `utils/geo.py` (or similar) with:
    - [ ] `get_client_ip(request)` that handles proxies / `X-Forwarded-For`
    - [ ] `lookup_location(ip)` that returns `(country_code, city_name)` and optionally `(lat, lng)`
  - [ ] Add simple caching (e.g. in‑memory or using Django cache) to avoid repeated lookups for same IP

- [ ] VisitorProfile creation / update
  - [ ] Implement middleware or utility:
    - [ ] If `visitor_id` cookie is absent:
      - [ ] Generate UUID
      - [ ] Set cookie on response with long expiry (e.g. 1 year)
    - [ ] Ensure `VisitorProfile` exists for `visitor_id`
    - [ ] On each relevant request:
      - [ ] Update `last_seen`, `last_ip`
      - [ ] If no `country/city` yet, or IP changed → perform geolocation and update
  - [ ] Decide scope:
    - [ ] Minimal: only run this logic on tracking endpoints
    - [ ] Optional: global middleware that runs for all API requests

---

### 4.4 Backend: Tracking API Endpoints

- [ ] Create DRF serializer(s) for tracking
  - [ ] `ProductViewCreateSerializer`:
    - [ ] Accepts `product_id` (required)
    - [ ] Optional `latitude`, `longitude` (from browser geolocation)
  - [ ] Validate product existence and ID format

- [ ] Create DRF view(s) / viewset(s)
  - [ ] `ProductViewTrackingViewSet` or `ProductViewCreateAPIView`:
    - [ ] `POST /api/tracking/product-views/`
    - [ ] Use `visitor_id` from cookie (create if missing)
    - [ ] Extract client IP → geolocate to `country` / `city`
    - [ ] Merge optional browser `lat/lng` (rounded for privacy)
    - [ ] Create `ProductView` row
    - [ ] Return minimal success payload (e.g. `{ success: true }`)
  - [ ] Rate limiting / abuse protection (optional but recommended):
    - [ ] Basic throttle: ignore duplicate views of same product within short window (e.g. 30–60s)

- [ ] Read API endpoints for UI features
  - [ ] `GET /api/tracking/recent-products/`:
    - [ ] Uses `visitor_id` to return last N viewed products for current visitor
    - [ ] Shape compatible with existing product cards (reuse serializers)
  - [ ] `GET /api/tracking/popular-products/`:
    - [ ] Supports filters:
      - [ ] `country` (default: infer from IP/visitor)
      - [ ] `period` (e.g. `24h`, `7d`, `30d`)
    - [ ] Returns ranked list of products by view count

- [ ] URL configuration
  - [ ] Register new routes in `catalog/urls.py` under `/api/tracking/...`

- [ ] Tests
  - [ ] Unit tests for geolocation helper
  - [ ] Unit tests for `VisitorProfile` and `ProductView` models
  - [ ] API tests:
    - [ ] Creating product view (valid product, invalid product)
    - [ ] Cookie / visitor creation & reuse
    - [ ] Recent products endpoint
    - [ ] Popular products by country endpoint

---

### 4.5 Frontend: Anonymous Visitor ID & Tracking Hook

- [ ] Visitor ID management on frontend
  - [ ] Implement utility (e.g. `utils/visitor.js`):
    - [ ] `getOrCreateVisitorId()`:
      - [ ] Try to read `visitor_id` from cookie
      - [ ] If not found, generate UUID (use `crypto.randomUUID()` if available)
      - [ ] Set cookie with long expiry (e.g. 365 days)
    - [ ] Optional: mirror ID into `localStorage` as backup

- [ ] Tracking client helper
  - [ ] Create `services/trackingService.js`:
    - [ ] `trackProductView(productId, options)`:
      - [ ] Ensures `visitor_id` cookie exists
      - [ ] Optionally includes `latitude`, `longitude` if available
      - [ ] Sends `POST /api/tracking/product-views/`
    - [ ] Handle errors silently (log to console only in dev)

- [ ] Integrate tracking into pages
  - [ ] `ProductDetail`:
    - [ ] After successful fetch of product (when `currentProduct` is set), call `trackProductView(currentProduct.id)`
    - [ ] Ensure it runs once per page load / product ID
    - [ ] Make sure if user visit product A then Product B then again product A, then the previous record should be delete or update to recent
  - [ ] Optional: track from other entrypoints (e.g. quick‑view modal) if added later

---

### 4.6 Frontend: Location Permission Flow (Browser Geolocation)

- [ ] UX for requesting location
  - [ ] Design a small dialog/banner component:
    - [ ] Explain why location is requested (e.g. “to show products popular near you”)
    - [ ] Buttons: “Allow location” / “Not now”
  - [ ] Decide when to show it:
    - [ ] After first few page views or on visiting product list
    - [ ] Remember user’s choice in `localStorage` (e.g. `location_consent=granted|denied`)

- [ ] Implement geolocation request
  - [ ] On “Allow location”:
    - [ ] Call `navigator.geolocation.getCurrentPosition(...)`
    - [ ] On success:
      - [ ] Store rounded `lat/lng` in local state / context
      - [ ] Immediately send a small update request to backend:
        - [ ] `POST /api/tracking/visitor-location/` or include in next `trackProductView`
    - [ ] On error / denial:
      - [ ] Mark as `denied` and stop prompting

- [ ] Backend endpoint for precise location (optional but recommended)
  - [ ] Accepts `latitude`, `longitude` and updates `VisitorProfile`
  - [ ] Applies rounding (e.g. 3–4 decimal places) before storing

---

### 4.7 Frontend: UI Features Using Tracking Data

- [ ] “Recently Viewed Products” section
  - [ ] Add service call:
    - [ ] `GET /api/tracking/recent-products/`
  - [ ] New component:
    - [ ] `RecentlyViewed`:
      - [ ] Renders grid/carousel of last N products for current visitor
      - [ ] Uses existing `Card` component
  - [ ] Integrate into:
    - [ ] Product detail page (e.g. at bottom)
    - [ ] Product list page sidebar or bottom section

- [ ] “Popular Near You” / “Trending in Your Area”
  - [ ] Add service call:
    - [ ] `GET /api/tracking/popular-products/?country=...`
      - [ ] Default to inferred country from backend if no explicit param
  - [ ] New component:
    - [ ] `PopularInYourArea`:
      - [ ] Accepts list of products
      - [ ] Shows “Popular in Lahore” / “Popular in Pakistan” based on available location data
  - [ ] Decide where to show:
    - [ ] Product list page (extra section/tab)
    - [ ] Home page hero recommendations (future)

---

### 4.8 Analytics & Maintenance

- [ ] Basic admin views
  - [ ] Register `VisitorProfile` and `ProductView` in Django admin
  - [ ] Add list filters (by country, city, product)
  - [ ] Add date hierarchy by `viewed_at`

- [ ] Data retention and cleanup
  - [ ] Implement management command or scheduled task:
    - [ ] Purge `ProductView` records older than N days/months
    - [ ] Optionally prune very inactive `VisitorProfile` entries

- [ ] Performance considerations
  - [ ] Confirm indexes work well on large `ProductView` tables
  - [ ] Consider aggregating into daily summaries for analytics (future)

---

### 4.9 Documentation

- [ ] Update `backend/README.md`
  - [ ] Document new models (`VisitorProfile`, `ProductView`)
  - [ ] Document new tracking endpoints and request/response shapes
  - [ ] Document IP geolocation dependencies and env vars
  - [ ] Document data retention / privacy considerations

- [ ] Update `frontend/README.md`
  - [ ] Document tracking service and usage
  - [ ] Document location consent flow and how it affects features

- [ ] Update root `README.md` or `TOTO.md`
  - [ ] Add high‑level description of Visitor Tracking & Personalization phase


