import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, LoadingSpinner, ErrorMessage } from '../components/common'
import { getFavoriteProducts } from '../services/trackingService'
import { useBrowserLocation } from '../hooks/useBrowserLocation'
import LocationPermissionBanner from '../components/tracking/LocationPermissionBanner'

/**
 * Favorites Page
 * Displays all products liked by the current visitor
 */
function Favorites() {
  const navigate = useNavigate()
  const { status: locationStatus, requestLocation } = useBrowserLocation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only fetch products if location is granted
    if (locationStatus !== 'granted') {
      setLoading(false)
      return
    }

    const loadFavorites = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getFavoriteProducts({ limit: 100 })
        if (result.success) {
          setProducts(result.data || [])
        } else {
          setError('Failed to load favorite products')
        }
      } catch (err) {
        setError('An error occurred while loading favorites')
        if (import.meta.env.DEV) {
          console.error('Error loading favorites:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [locationStatus])

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`)
  }

  const getMainImageUrl = (product) => {
    if (product.main_image_url) return product.main_image_url
    if (product.images && product.images.length > 0) {
      const mainImage = product.images.find((img) => img.is_main) || product.images[0]
      return mainImage.image_url || mainImage.image
    }
    return null
  }

  const formatPrice = (price) => {
    if (!price) return ''
    return `$${parseFloat(price).toFixed(2)}`
  }

  // Show location permission banner if location is not granted
  if (locationStatus !== 'granted') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">My Favorites</h1>
        </div>
        <LocationPermissionBanner
          onEnableLocation={requestLocation}
          title="Favorites"
          isRequesting={locationStatus === 'requesting'}
        />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">My Favorites</h1>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-neutral-600">Loading your favorite products...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">My Favorites</h1>
        </div>
        <ErrorMessage
          title="Error Loading Favorites"
          message={error}
        />
      </div>
    )
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">My Favorites</h1>
        </div>
        <div className="text-center py-12">
          <svg
            className="w-24 h-24 mx-auto text-neutral-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <h2 className="text-2xl font-semibold text-neutral-900 mb-2">No favorites yet</h2>
          <p className="text-neutral-600 mb-6">
            Start liking products to see them here!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">My Favorites</h1>
          <p className="text-neutral-600 mt-1">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            title={product.title}
            subtitle={`SKU: ${product.sku}`}
            image={getMainImageUrl(product)}
            imageAlt={product.title}
            onClick={() => handleProductClick(product.id)}
            hover={true}
            className="h-full"
          >
            <div className="mt-2">
              <p className="text-xl font-bold text-primary-600">
                {formatPrice(product.price)}
              </p>
              {product.description && (
                <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default Favorites

