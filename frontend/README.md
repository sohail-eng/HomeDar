# HomeDar Frontend

React frontend application for the HomeDar e-commerce platform. Built with React 18, React Router, Tailwind CSS, and Vite.

## Table of Contents

- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running Development Server](#running-development-server)
- [Building for Production](#building-for-production)
 - [Project Structure](#project-structure)
 - [Component Documentation](#component-documentation)
 - [API Integration](#api-integration)
 - [Testing](#testing)
 - [Visitor Tracking & Location](#visitor-tracking--location)

## Installation

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- Backend API server running (see backend documentation)

### Step-by-Step Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Create .env file (if it doesn't exist)
   touch .env
   ```

4. **Configure environment variables** (see [Environment Setup](#environment-setup) section)

## Environment Setup

### Environment Variables

Create a `.env` file in the `frontend` directory with the following variables:

```env
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:8000/api
```

### Environment Variable Details

- **`VITE_API_BASE_URL`** (required)
  - Description: Base URL for the backend API
  - Default: `http://localhost:8000/api`
  - Example: `https://api.homedar.com/api`
  - Note: Must start with `VITE_` prefix for Vite to expose it to the client

### Development vs Production

- **Development**: Uses the default `http://localhost:8000/api` if not specified
- **Production**: Must be set to your production API URL

## Running Development Server

### Start the Development Server

```bash
npm run dev
```

The application will be available at:
- **Local**: `http://localhost:3000`
- **Network**: Check the terminal output for the network URL

### Development Server Features

- **Hot Module Replacement (HMR)**: Changes reflect immediately without full page reload
- **Fast Refresh**: React components update while preserving state
- **Proxy Configuration**: API requests to `/api` are proxied to `http://localhost:8000` (configured in `vite.config.js`)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |

### Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3000 (Linux/Mac)
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.js
```

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Building for Production

### Build Command

```bash
npm run build
```

This command:
- Creates an optimized production build in the `dist/` directory
- Minifies JavaScript and CSS
- Optimizes assets (images, fonts, etc.)
- Generates source maps (for debugging)

### Build Output

The build process generates:
```
dist/
├── index.html          # Entry HTML file
├── assets/
│   ├── index-[hash].js # Main JavaScript bundle
│   └── index-[hash].css # Main CSS bundle
└── [other assets]
```

### Preview Production Build

To test the production build locally:

```bash
npm run preview
```

This serves the `dist/` folder at `http://localhost:4173` (or another port if 4173 is busy).

### Deployment

#### Static Hosting (Recommended)

The build output is a static site that can be deployed to:

- **Vercel**: `vercel --prod`
- **Netlify**: Drag and drop `dist/` folder or connect Git repository
- **GitHub Pages**: Configure GitHub Actions to build and deploy
- **AWS S3 + CloudFront**: Upload `dist/` to S3 bucket
- **Any static hosting service**

#### Environment Variables in Production

Make sure to set `VITE_API_BASE_URL` in your hosting platform's environment variables configuration.

## Project Structure

```
frontend/
├── public/                 # Static assets (not processed by Vite)
├── src/
│   ├── components/         # Reusable React components
│   │   ├── common/         # Common UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   ├── ErrorMessage.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ImageCarousel.jsx
│   │   │   ├── ScrollableContainer.jsx
│   │   │   ├── FilterDropdown.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── index.js    # Component exports
│   │   └── layout/          # Layout components
│   │       ├── Header.jsx
│   │       ├── Footer.jsx
│   │       └── Layout.jsx
│   ├── contexts/           # React Context providers
│   │   ├── AppContext.jsx  # Main context provider
│   │   ├── ProductContext.jsx
│   │   ├── CategoryContext.jsx
│   │   ├── FilterContext.jsx
│   │   ├── SearchContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/              # Page components (routes)
│   │   ├── AppRoutes.jsx   # Route configuration
│   │   ├── ProductList.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── ContactUs.jsx
│   │   └── NotFound.jsx
│   ├── services/           # API service layer
│   │   ├── api.js          # Axios instance & interceptors
│   │   ├── productService.js
│   │   ├── categoryService.js
│   │   ├── subCategoryService.js
│   │   ├── contactService.js
│   │   └── trackingService.js  # Visitor tracking endpoints
│   ├── hooks/              # Custom React hooks
│   │   ├── useApi.js
│   │   └── useBrowserLocation.js  # Global browser geolocation helper
│   ├── utils/              # Utility functions
│   │   ├── constants.js    # App constants
│   │   ├── theme.js        # Theme configuration
│   │   └── visitor.js      # Anonymous visitor ID utility
│   ├── styles/             # Global styles
│   │   └── index.css       # Tailwind CSS imports
│   ├── App.jsx             # Root App component (wires global location hook)
│   └── main.jsx            # Application entry point
├── dist/                   # Production build output (generated)
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── README.md               # This file
```

### Key Directories

- **`src/components/`**: Reusable UI components organized by purpose
- **`src/pages/`**: Top-level page components that correspond to routes
- **`src/contexts/`**: React Context API for global state management
- **`src/services/`**: API communication layer (Axios-based)
- **`src/utils/`**: Helper functions and constants
- **`public/`**: Static files served as-is (favicon, images, etc.)

## Component Documentation

### Common Components

#### Button
Reusable button component with multiple variants and sizes.

**Props:**
- `variant`: `'primary' | 'secondary' | 'outline' | 'ghost'` (default: `'primary'`)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `fullWidth`: `boolean` (default: `false`)
- `disabled`: `boolean` (default: `false`)
- `onClick`: `function`
- `children`: React node

**Example:**
```jsx
import { Button } from '../components/common'

<Button variant="primary" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

## Visitor Tracking & Location

### Anonymous Visitor ID

- Implemented in `src/utils/visitor.js`:
  - `getOrCreateVisitorId()`:
    - Tries to read `visitor_id` from cookies.
    - Falls back to localStorage if needed.
    - Generates a UUID (using `crypto.randomUUID()` when available) if missing.
    - Writes the ID back to both cookie and localStorage with a long expiry.
  - Used by the tracking service before calling any tracking endpoint.

### Tracking Service

- Implemented in `src/services/trackingService.js`:
  - `trackProductView(productId, options)`:
    - Ensures `visitor_id` exists.
    - Accepts optional `latitude` / `longitude` (from browser geolocation).
    - Sends `POST /api/tracking/product-views/` to the backend.
  - `getRecentProducts(limit)`:
    - Calls `GET /api/tracking/recent-products/?limit=...`.
    - Returns an array of products compatible with existing `Card` components.
  - `getPopularProducts({ country, period, limit })`:
    - Calls `GET /api/tracking/popular-products/` with optional filters.
    - Returns products plus resolved `country` and `period` from the backend.

### Location Consent & Browser Geolocation

- Global hook `src/hooks/useBrowserLocation.js`:
  - Runs once when `App.jsx` mounts.
  - If the user has **not** previously denied location:
    - Calls `navigator.geolocation.getCurrentPosition(...)`.
    - Rounds latitude/longitude to 4 decimals for privacy.
    - Stores the last known location in `localStorage.location_last`.
    - Marks consent in `localStorage.location_consent = 'granted'`.
  - On error/denial:
    - Sets `localStorage.location_consent = 'denied'` so the user is not repeatedly prompted.
  - Only updates stored location when it changes more than a small threshold (to avoid noise).

### UI Features Using Tracking Data

- `RecentlyViewed` (`src/components/tracking/RecentlyViewed.jsx`):
  - Fetches recent products via `getRecentProducts(8)`.
  - Renders a responsive grid of cards.
  - Integrated at the bottom of the main `ProductList` page.

- `PopularInYourArea` (`src/components/tracking/PopularInYourArea.jsx`):
  - Fetches popular products via `getPopularProducts({ limit: 8 })`.
  - Shows heading “Popular Near You” with optional country suffix.
  - Also rendered under the main product grid on the `ProductList` page.

### Product Detail Integration

- In `src/pages/ProductDetail.jsx`:
  - After a product is successfully loaded (`currentProduct` is set), it:
    - Reads `location_last` from localStorage (if available).
    - Calls `trackProductView(currentProduct.id, { latitude, longitude })`.
    - Ensures tracking runs once per product ID / page load.

#### Input
Form input component with label, error, and helper text support.

**Props:**
- `type`: `string` (default: `'text'`)
- `name`: `string` (required)
- `label`: `string`
- `value`: `string`
- `onChange`: `function`
- `error`: `string` (error message)
- `helperText`: `string`
- `placeholder`: `string`
- `required`: `boolean`
- `disabled`: `boolean`
- `fullWidth`: `boolean` (default: `true`)
- `rows`: `number` (for textarea)

**Example:**
```jsx
import { Input } from '../components/common'

<Input
  type="text"
  name="email"
  label="Email"
  value={email}
  onChange={handleChange}
  error={errors.email}
  required
/>
```

#### Card
Card component for displaying content with optional image and click handler.

**Props:**
- `title`: `string`
- `subtitle`: `string`
- `image`: `string` (image URL)
- `imageAlt`: `string`
- `onClick`: `function`
- `hover`: `boolean` (default: `false`)
- `className`: `string`
- `loading`: `'lazy' | 'eager'` (default: `'lazy'`)
- `decoding`: `'sync' | 'async' | 'auto'` (default: `'async'`)
- `children`: React node

**Example:**
```jsx
import { Card } from '../components/common'

<Card
  title="Product Name"
  subtitle="SKU: 12345"
  image="/product.jpg"
  onClick={() => navigate('/product/1')}
  hover
>
  <p>Product description</p>
</Card>
```

#### LoadingSpinner
Loading indicator component.

**Props:**
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `className`: `string`

#### ErrorMessage
Error message display component.

**Props:**
- `message`: `string` (required)
- `title`: `string`
- `onDismiss`: `function`

#### Pagination
Pagination component for navigating through pages.

**Props:**
- `currentPage`: `number` (required)
- `totalPages`: `number` (required)
- `onPageChange`: `function` (required)
- `pageSize`: `number`
- `totalItems`: `number`
- `showPageSize`: `boolean` (default: `true`)

#### ImageCarousel
Image carousel with swipe support, dots, arrows, and lightbox.

**Props:**
- `images`: `array` (required) - Array of image objects or URLs
- `autoPlay`: `boolean` (default: `false`)
- `autoPlayInterval`: `number` (default: `3000`)
- `showDots`: `boolean` (default: `true`)
- `showArrows`: `boolean` (default: `true`)
- `enableSwipe`: `boolean` (default: `true`)
- `enableLightbox`: `boolean` (default: `true`)
- `className`: `string`

**Image Object Format:**
```javascript
{
  url: 'string',      // Required
  alt: 'string',      // Optional
  loading: 'lazy',    // Optional
  decoding: 'async'   // Optional
}
```

#### ScrollableContainer
Horizontal scrollable container with navigation buttons.

**Props:**
- `children`: React node (required)
- `className`: `string`
- `showScrollButtons`: `boolean` (default: `true`)
- `scrollStep`: `number` (default: `200`)

### Layout Components

#### Header
Main navigation header with logo and menu links.

**Features:**
- Responsive mobile menu
- Active route highlighting
- Sticky positioning

#### Footer
Site footer with company info, links, and contact details.

**Features:**
- Responsive grid layout
- Social media links
- Quick navigation links

#### Layout
Main layout wrapper that includes Header and Footer.

**Usage:**
```jsx
<Layout>
  <YourPageContent />
</Layout>
```

## API Integration

### API Configuration

The API client is configured in `src/services/api.js` using Axios.

**Base Configuration:**
- Base URL: `VITE_API_BASE_URL` environment variable (default: `http://localhost:8000/api`)
- Timeout: 30 seconds
- Content-Type: `application/json`

### Request Interceptors

The API client includes request interceptors for:
- Adding authentication tokens (currently commented out, ready for implementation)
- Logging requests (development)

### Response Interceptors

The API client handles:
- Success responses (passed through)
- Error responses with status code handling:
  - `400`: Bad Request
  - `401`: Unauthorized
  - `403`: Forbidden
  - `404`: Not Found
  - `422`: Validation Error
  - `500`: Server Error
  - Network errors (no response)
  - CORS errors

### API Services

#### Product Service (`productService.js`)

**Functions:**
- `getProducts(page, filters)`: Fetch paginated products with filters
- `getProductById(id)`: Fetch single product by ID

**Example:**
```javascript
import { getProducts } from '../services/productService'

const products = await getProducts(1, {
  search: 'laptop',
  min_price: 100,
  max_price: 1000,
  ordering: '-created_at'
})
```

#### Category Service (`categoryService.js`)

**Functions:**
- `getCategories()`: Fetch all categories with subcategories

#### Subcategory Service (`subCategoryService.js`)

**Functions:**
- `getSubcategories(categoryId)`: Fetch subcategories for a category

#### Contact Service (`contactService.js`)

**Functions:**
- `submitContactForm(data)`: Submit contact form
  - `data`: `{ name, phone, email, message }`

### API Endpoints

Defined in `src/utils/constants.js`:

```javascript
export const API_ENDPOINTS = {
  CATEGORIES: '/categories/',
  SUBCATEGORIES: '/subcategories/',
  PRODUCTS: '/products/',
  PRODUCT_IMAGES: '/product-images/',
  CONTACT_US: '/contact-us/',
}
```

### Error Handling

Use the `handleApiError` utility from `api.js`:

```javascript
import api, { handleApiError } from '../services/api'

try {
  const response = await api.get('/products/')
  // Handle success
} catch (error) {
  const errorMessage = handleApiError(error)
  // Display error message to user
}
```

### Context-Based API Usage

The application uses React Context for API state management:

- **ProductContext**: Manages product data, loading, and pagination
- **CategoryContext**: Manages category data
- **FilterContext**: Manages filter state
- **SearchContext**: Manages search term and debouncing

**Example:**
```jsx
import { useProduct } from '../contexts/ProductContext'

function MyComponent() {
  const { products, loading, error, fetchProducts } = useProduct()
  
  useEffect(() => {
    fetchProducts(1, { search: 'laptop' })
  }, [])
  
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} />
  
  return <div>{/* Render products */}</div>
}
```

## Testing

### Running Linter

Check code quality and catch errors:

```bash
npm run lint
```

### Manual Testing Checklist

#### Responsive Design
- [ ] Test on mobile devices (< 768px)
- [ ] Test on tablets (768px - 1024px)
- [ ] Test on desktop (> 1024px)
- [ ] Verify touch interactions work on mobile
- [ ] Check image loading and optimization

#### Functionality
- [ ] Product listing with pagination
- [ ] Product search functionality
- [ ] Category and subcategory filtering
- [ ] Price range filtering (Min/Max)
- [ ] Sort functionality
- [ ] Product detail page navigation
- [ ] Image carousel with swipe gestures
- [ ] Contact form submission
- [ ] 404 page navigation

#### Performance
- [ ] Check lazy loading of images
- [ ] Verify debounced search (300ms delay)
- [ ] Test pagination performance
- [ ] Check bundle size (should be optimized)

#### Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Testing Tools

**Recommended:**
- Browser DevTools (Chrome/Firefox)
- React DevTools extension
- Network tab for API monitoring
- Lighthouse for performance auditing

### Common Issues and Solutions

**CORS Errors:**
- Ensure backend CORS settings allow frontend origin
- Check `VITE_API_BASE_URL` is correct

**API Connection Issues:**
- Verify backend server is running
- Check API base URL in `.env` file
- Review network tab in browser DevTools

**Build Errors:**
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Verify all environment variables are set

## Additional Resources

- [React Documentation](https://react.dev/)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Axios Documentation](https://axios-http.com/)

## Support

For issues or questions:
1. Check this README for common solutions
2. Review the backend API documentation
3. Check browser console for error messages
4. Review network requests in DevTools

---

**Last Updated**: 2024
