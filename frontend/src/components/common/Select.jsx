import PropTypes from 'prop-types'

/**
 * Select component for single and multi-select
 */
function Select({
  options,
  value,
  onChange,
  multiple = false,
  placeholder = 'Select...',
  label,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  fullWidth = true,
}) {
  const baseStyles = 'block rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const selectStyles = error
    ? 'border-error-500 focus:border-error-500 focus:ring-error-500'
    : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'
  
  const widthClass = fullWidth ? 'w-full' : ''
  
  const selectClasses = `${baseStyles} ${selectStyles} ${widthClass} px-4 py-2 ${className}`.trim()
  
  const handleChange = (e) => {
    if (multiple) {
      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value)
      onChange(selectedOptions)
    } else {
      onChange(e.target.value)
    }
  }
  
  return (
    <div className={widthClass}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <select
        multiple={multiple}
        value={multiple ? (Array.isArray(value) ? value : []) : value || ''}
        onChange={handleChange}
        disabled={disabled}
        className={selectClasses}
        size={multiple ? Math.min(options.length, 5) : undefined}
      >
        {!multiple && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-neutral-500">{helperText}</p>
      )}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <p className="mt-1 text-sm text-neutral-500">
          {value.length} item{value.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.array,
  ]),
  onChange: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
}

export default Select

