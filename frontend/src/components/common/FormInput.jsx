import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import Input from './Input'
import Select from './Select'

/**
 * TextInput - Reusable text input component for text, email, and password types
 * 
 * Wrapper around Input component for text, email, and password input types.
 * Provides clearer naming and better discoverability.
 * 
 * @example
 * <TextInput
 *   type="email"
 *   name="email"
 *   label="Email"
 *   value={email}
 *   onChange={handleChange}
 *   error={errors.email}
 *   required
 * />
 */
export const TextInput = forwardRef(function TextInput(
  { type = 'text', ...props },
  ref
) {
  // Ensure type is one of the text input types
  const validTypes = ['text', 'email', 'password', 'tel', 'number']
  const inputType = validTypes.includes(type) ? type : 'text'

  return <Input ref={ref} type={inputType} {...props} />
})

TextInput.propTypes = {
  type: PropTypes.oneOf(['text', 'email', 'password', 'tel', 'number']),
  name: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  autoComplete: PropTypes.string,
}

TextInput.displayName = 'TextInput'

/**
 * TextArea - Reusable textarea component
 * 
 * Wrapper around Input component with type="textarea" pre-set.
 * Provides clearer naming for textarea use cases.
 * 
 * @example
 * <TextArea
 *   name="message"
 *   label="Message"
 *   value={message}
 *   onChange={handleChange}
 *   error={errors.message}
 *   rows={5}
 *   required
 * />
 */
export const TextArea = forwardRef(function TextArea(
  { rows = 4, ...props },
  ref
) {
  return <Input ref={ref} type="textarea" rows={rows} {...props} />
})

TextArea.propTypes = {
  name: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  rows: PropTypes.number,
}

TextArea.displayName = 'TextArea'

/**
 * SelectInput - Reusable select/dropdown component
 * 
 * Alias/export of the existing Select component for consistency
 * and better naming in form contexts.
 * 
 * @example
 * <SelectInput
 *   label="Country"
 *   options={countryOptions}
 *   value={selectedCountry}
 *   onChange={handleChange}
 *   error={errors.country}
 *   required
 * />
 */
export function SelectInput(props) {
  return <Select {...props} />
}

SelectInput.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
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

// Export all components as default object for convenience
export default {
  TextInput,
  TextArea,
  SelectInput,
}

