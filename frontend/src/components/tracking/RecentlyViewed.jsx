import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { getRecentProducts } from '../../services/trackingService'
import { Card } from '../common'
import { useBrowserLocation } from '../../hooks/useBrowserLocation'
import LocationPermissionBanner from './LocationPermissionBanner'

function RecentlyViewed({ onProductClick }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const { status: locationStatus, requestLocation } = useBrowserLocation()

  useEffect(() => {
    // Only fetch products if location is granted
    if (locationStatus !== 'granted') {
      return
    }

    let mounted = true
    const load = async () => {
      setLoading(true)
      const result = await getRecentProducts(10)
      if (mounted) {
        setItems(result.data || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [locationStatus])

  // Show banner if location is not granted (denied, idle, or requesting)
  if (locationStatus === 'denied' || locationStatus === 'idle' || locationStatus === 'requesting') {
    return (
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-neutral-900">
            Recently Viewed
          </h2>
        </div>
        <LocationPermissionBanner
          onEnableLocation={requestLocation}
          title="Recently Viewed"
          isRequesting={locationStatus === 'requesting'}
        />
      </section>
    )
  }

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-3">
          Recently Viewed
        </h2>
        <p className="text-sm text-neutral-500">Loading your recently viewed products...</p>
      </section>
    )
  }

  if (!items || items.length === 0) {
    return null
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

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-neutral-900">
          Recently Viewed
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((product) => (
          <Card
            key={product.id}
            title={product.title}
            subtitle={formatPrice(product.price)}
            image={getMainImageUrl(product)}
            imageAlt={product.title}
            hover
            onClick={() => onProductClick && onProductClick(product.id)}
          />
        ))}
      </div>
    </section>
  )
}

RecentlyViewed.propTypes = {
  onProductClick: PropTypes.func,
}

export default RecentlyViewed


