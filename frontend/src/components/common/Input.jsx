import { forwardRef } from 'react'
import PropTypes from 'prop-types'

/**
 * Reusable Input component supporting text, email, phone, and textarea
 */
const Input = forwardRef(function Input({
  type = 'text',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  fullWidth = true,
  rows,
  ...props
}, ref) {
  const baseStyles = 'block rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const inputStyles = error
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
  
  const paddingStyles = type === 'textarea'
    ? 'px-4 py-2'
    : 'px-4 py-2'
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  const inputClasses = `${baseStyles} ${inputStyles} ${paddingStyles} ${widthClass} ${className}`.trim()
  
  const inputElement = type === 'textarea' ? (
    <textarea
      ref={ref}
      rows={rows || 4}
      disabled={disabled}
      className={inputClasses}
      {...props}
    />
  ) : (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      className={inputClasses}
      {...props}
    />
  )
  
  return (
    <div className={widthClass}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      {inputElement}
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
    </div>
  )
})

Input.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'tel', 'password', 'number', 'textarea']),
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  rows: PropTypes.number,
}

export default Input

