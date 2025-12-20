import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { getPopularProducts } from '../../services/trackingService'
import { Card } from '../common'
import { useBrowserLocation } from '../../hooks/useBrowserLocation'
import LocationPermissionBanner from './LocationPermissionBanner'

function PopularInYourArea({ onProductClick }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState({ country: null, period: null })
  const { status: locationStatus, requestLocation } = useBrowserLocation()

  useEffect(() => {
    // Only fetch products if location is granted
    if (locationStatus !== 'granted') {
      return
    }

    let mounted = true
    const load = async () => {
      setLoading(true)
      const result = await getPopularProducts({ limit: 10 })
      if (mounted) {
        setItems(result.data || [])
        setMeta({ country: result.country, period: result.period })
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
            Popular Near You
          </h2>
        </div>
        <LocationPermissionBanner
          onEnableLocation={requestLocation}
          title="Popular Near You"
          isRequesting={locationStatus === 'requesting'}
        />
      </section>
    )
  }

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-3">
          Popular Near You
        </h2>
        <p className="text-sm text-neutral-500">Loading popular products in your area...</p>
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

  const headingSuffix = meta.country ? ` in ${meta.country}` : ''

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-neutral-900">
          Popular Near You{headingSuffix}
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

PopularInYourArea.propTypes = {
  onProductClick: PropTypes.func,
}

export default PopularInYourArea


