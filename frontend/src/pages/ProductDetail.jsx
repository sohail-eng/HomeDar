import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProduct } from '../contexts/ProductContext'
import {
  LoadingSpinner,
  ErrorMessage,
  Button,
} from '../components/common'
import ImageCarousel from '../components/common/ImageCarousel'
import { trackProductView } from '../services/trackingService'
import { useBrowserLocation } from '../hooks/useBrowserLocation'
import AlsoViewed from '../components/tracking/AlsoViewed'
import LikeButton from '../components/tracking/LikeButton'

/**
 * Product Detail Page
 * Displays complete product information with image gallery
 */
function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentProduct, loading, error, fetchProductById } = useProduct()
  const { status: locationStatus, location } = useBrowserLocation()
  
  useEffect(() => {
    if (id) {
      fetchProductById(id)
    }
  }, [id, fetchProductById])

  // Track product view once per product load.
  // Only track if location is granted. If denied, do not track at all.
  useEffect(() => {
    if (!currentProduct || !currentProduct.id) return

    // Wait until we either have a location or know that it was denied.
    if (locationStatus === 'requesting' || locationStatus === 'idle') {
      return
    }

    // Only track if location is granted
    if (locationStatus === 'denied') {
      // Location denied - do not track product views
      return
    }

    // Location is granted - track with location if available
    if (location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      trackProductView(currentProduct.id, {
        latitude: location.latitude,
        longitude: location.longitude,
      })
    } else {
      // Location granted but not available yet - track without location
      trackProductView(currentProduct.id)
    }
  }, [currentProduct?.id, locationStatus, location?.latitude, location?.longitude])
  
  // Prepare images for carousel
  const getProductImages = () => {
    if (!currentProduct) return []
    
    if (currentProduct.images && currentProduct.images.length > 0) {
      return currentProduct.images.map((img) => ({
        url: img.image_url || img.image,
        alt: `${currentProduct.title} - Image ${img.id}`,
      }))
    }
    
    // Fallback to main image if available
    if (currentProduct.main_image_url) {
      return [{
        url: currentProduct.main_image_url,
        alt: currentProduct.title,
      }]
    }
    
    return []
  }
  
  // Format price
  const formatPrice = (price) => {
    if (!price) return 'N/A'
    return `$${parseFloat(price).toFixed(2)}`
  }
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  // Handle back navigation
  const handleBack = () => {
    navigate(-1)
  }
  
  // Loading state
  if (loading && !currentProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-neutral-600">Loading product details...</p>
        </div>
      </div>
    )
  }
  
  // Error state
  if (error && !currentProduct) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Products
        </Button>
        <ErrorMessage
          title="Product Not Found"
          message={error || 'The product you are looking for does not exist or has been removed.'}
        />
      </div>
    )
  }
  
  // No product state
  if (!currentProduct) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleBack} className="mb-4">
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Products
        </Button>
        <div className="text-center py-12">
          <p className="text-neutral-600">Product not found</p>
        </div>
      </div>
    )
  }
  
  const images = getProductImages()
  
  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={handleBack}>
        <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Products
      </Button>
      
      {/* Product Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="relative">
          <ImageCarousel
            images={images}
            showDots={true}
            showArrows={true}
            enableSwipe={true}
            autoPlay={false}
          />
          {/* Like Button - Only show if location is granted */}
          {locationStatus === 'granted' && currentProduct?.id && (
            <LikeButton productId={currentProduct.id} />
          )}
        </div>
        
        {/* Product Information */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
              {currentProduct.title}
            </h1>
            <p className="text-lg text-neutral-600">
              SKU: <span className="font-mono font-semibold">{currentProduct.sku}</span>
            </p>
          </div>
          
          {/* Price */}
          <div className="border-t border-b border-neutral-200 py-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary-600">
                {formatPrice(currentProduct.price)}
              </span>
            </div>
          </div>
          
          {/* Description */}
          {currentProduct.description && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Description</h2>
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {currentProduct.description}
              </p>
            </div>
          )}
          
          {/* Sub-categories */}
          {currentProduct.subcategories && currentProduct.subcategories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-3">Categories</h2>
              <div className="flex flex-wrap gap-2">
                {currentProduct.subcategories.map((subcategory) => (
                  <span
                    key={subcategory.id}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                  >
                    {subcategory.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Product Details */}
          <div className="border-t border-neutral-200 pt-4">
            <h2 className="text-xl font-semibold text-neutral-900 mb-3">Product Details</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-neutral-500">SKU</dt>
                <dd className="mt-1 text-sm text-neutral-900 font-mono">{currentProduct.sku}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-neutral-500">Price</dt>
                <dd className="mt-1 text-sm text-neutral-900 font-semibold">
                  {formatPrice(currentProduct.price)}
                </dd>
              </div>
              {currentProduct.created_at && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Created</dt>
                  <dd className="mt-1 text-sm text-neutral-900">
                    {formatDate(currentProduct.created_at)}
                  </dd>
                </div>
              )}
              {currentProduct.updated_at && (
                <div>
                  <dt className="text-sm font-medium text-neutral-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-neutral-900">
                    {formatDate(currentProduct.updated_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
      
      {/* Also Viewed Products Section */}
      {currentProduct && currentProduct.id && (
        <AlsoViewed
          productId={currentProduct.id}
          onProductClick={(id) => navigate(`/product/${id}`)}
        />
      )}
      
      {/* Additional Information Section */}
      <div className="mt-8 border-t border-neutral-200 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Product Information</h3>
            <p className="text-sm text-neutral-600">
              All product details are displayed above. For any questions or inquiries, please contact us.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Need Help?</h3>
            <p className="text-sm text-neutral-600 mb-3">
              Have questions about this product?
            </p>
            <Button variant="outline" onClick={() => navigate('/contact')}>
              Contact Us
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Browse More</h3>
            <p className="text-sm text-neutral-600 mb-3">
              Explore our full product catalog.
            </p>
            <Button variant="outline" onClick={() => navigate('/')}>
              View All Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
