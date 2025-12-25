import PropTypes from 'prop-types'

/**
 * Reusable Card component for product cards and other content
 */
function Card({
  children,
  title,
  subtitle,
  image,
  imageAlt,
  imageBadge,
  onClick,
  className = '',
  hover = false,
  ...props
}) {
  const baseStyles = 'bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200'
  const hoverStyles = hover || onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''
  const classes = `${baseStyles} ${hoverStyles} ${className}`.trim()
  
  return (
    <div
      className={classes}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(e)
        }
      } : undefined}
      {...props}
    >
      {image && (
        <div className="relative w-full h-56 sm:h-48 md:h-40 bg-neutral-200 overflow-hidden">
          <img
            src={image}
            alt={imageAlt || title || 'Card image'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e5e5" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'
            }}
          />
          {imageBadge && (
            <div className="absolute top-2 left-2 z-10">
              {imageBadge}
            </div>
          )}
        </div>
      )}
      {(title || subtitle || children) && (
        <div className="p-3">
          {title && (
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-neutral-600 mb-2">{subtitle}</p>
          )}
          {children}
        </div>
      )}
    </div>
  )
}

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  image: PropTypes.string,
  imageAlt: PropTypes.string,
  imageBadge: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  hover: PropTypes.bool,
}

export default Card

