import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { getAlsoViewedProducts } from '../../services/trackingService'
import { Card, Button } from '../common'

function AlsoViewed({ productId, onProductClick }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (!productId) {
      return
    }

    let mounted = true
    const load = async () => {
      setLoading(true)
      const result = await getAlsoViewedProducts(productId, { limit: 10 })
      if (mounted) {
        setItems(result.data || [])
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [productId])

  if (loading) {
    return (
      <section className="mt-8 pt-8 border-t border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-900 mb-3">
          Users who viewed this product also viewed
        </h2>
        <p className="text-sm text-neutral-500">Loading related products...</p>
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

  // On small screens, show only 1 product initially, then all when "Show More" is clicked
  // On larger screens (sm and above), always show all products
  const hasMoreItems = items.length > 1
  // Use CSS classes to hide items on mobile, but show all on sm+ screens
  // On mobile, only show first item unless showAll is true
  const displayedItems = showAll ? items : items

  return (
    <section className="mt-8 pt-8 border-t border-neutral-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold text-neutral-900">
          Users who viewed this product also viewed
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {displayedItems.map((product, index) => (
          <div
            key={product.id}
            className={!showAll && index > 0 ? 'hidden sm:block' : ''}
          >
            <Card
              title={product.title}
              subtitle={formatPrice(product.price)}
              image={getMainImageUrl(product)}
              imageAlt={product.title}
              hover
              onClick={() => onProductClick && onProductClick(product.id)}
            />
          </div>
        ))}
      </div>
      {/* Show More button - only on small screens when there are more items and not all are shown */}
      {!showAll && hasMoreItems && (
        <div className="mt-4 flex justify-center sm:hidden">
          <Button
            variant="outline"
            onClick={() => setShowAll(true)}
            className="text-sm"
          >
            Show More ({items.length - 1} more)
          </Button>
        </div>
      )}
    </section>
  )
}

AlsoViewed.propTypes = {
  productId: PropTypes.string.isRequired,
  onProductClick: PropTypes.func,
}

export default AlsoViewed

