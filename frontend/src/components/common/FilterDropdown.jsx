import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Filter Dropdown component
 */
function FilterDropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  const handleSelect = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter((v) => v !== option.value)
        : [...currentValues, option.value]
      onChange(newValues)
    } else {
      onChange(option.value)
      setIsOpen(false)
    }
  }
  
  const getDisplayValue = () => {
    if (multiple) {
      const selected = Array.isArray(value) ? value : []
      const selectedOptions = options.filter((opt) => selected.includes(opt.value))
      if (selectedOptions.length === 0) return placeholder
      if (selectedOptions.length === 1) return selectedOptions[0].label
      return `${selectedOptions.length} selected`
    }
    const selected = options.find((opt) => opt.value === value)
    return selected ? selected.label : placeholder
  }
  
  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue)
    }
    return value === optionValue
  }
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 flex items-center justify-between"
      >
        <span className={value ? 'text-neutral-900' : 'text-neutral-500'}>
          {getDisplayValue()}
        </span>
        <svg
          className={`w-5 h-5 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-neutral-500">No options available</div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 transition-colors flex items-center ${
                  isSelected(option.value) ? 'bg-primary-50 text-primary-700' : 'text-neutral-900'
                }`}
              >
                {multiple && (
                  <span className={`mr-2 w-4 h-4 border rounded ${
                    isSelected(option.value)
                      ? 'bg-primary-600 border-primary-600'
                      : 'border-neutral-300'
                  }`}>
                    {isSelected(option.value) && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                )}
                {option.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

FilterDropdown.propTypes = {
  label: PropTypes.string,
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
  placeholder: PropTypes.string,
  multiple: PropTypes.bool,
  className: PropTypes.string,
}

export default FilterDropdown

