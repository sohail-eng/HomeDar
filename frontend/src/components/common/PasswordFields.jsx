import { useState } from 'react'
import PropTypes from 'prop-types'
import Input from './Input'

/**
 * Reusable Password Fields Component
 * Includes password and confirm password fields with:
 * - Eye icon to toggle password visibility
 * - Password strength indicator
 * - Visual indicator when passwords don't match
 */
function PasswordFields({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  passwordError,
  confirmPasswordError,
  disabled = false,
  showStrengthIndicator = true,
  passwordLabel = 'Password',
  confirmPasswordLabel = 'Confirm Password',
  passwordPlaceholder = 'Enter your password',
  confirmPasswordPlaceholder = 'Confirm your password',
  required = true,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Calculate password strength
  const calculatePasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, feedback: [] }

    let score = 0
    const feedback = []

    if (pwd.length >= 8) {
      score++
    } else {
      feedback.push('Password must be at least 8 characters long')
    }

    if (/[A-Z]/.test(pwd)) {
      score++
    } else {
      feedback.push('Add an uppercase letter')
    }

    if (/[a-z]/.test(pwd)) {
      score++
    } else {
      feedback.push('Add a lowercase letter')
    }

    if (/\d/.test(pwd)) {
      score++
    } else {
      feedback.push('Add a number')
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      score++
    } else {
      feedback.push('Add a special character')
    }

    return { score, feedback }
  }

  const passwordStrength = calculatePasswordStrength(password)

  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-error-500'
    if (passwordStrength.score === 3) return 'bg-warning-500'
    if (passwordStrength.score >= 4) return 'bg-success-500'
    return 'bg-neutral-300'
  }

  // Check if passwords match
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsDontMatch = password && confirmPassword && password !== confirmPassword

  // Eye icon SVG
  const EyeIcon = ({ onClick, className, isVisible }) => (
    <button
      type="button"
      onClick={onClick}
      className={`absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none ${className}`}
      tabIndex={-1}
    >
      {isVisible ? (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      )}
    </button>
  )

  EyeIcon.propTypes = {
    onClick: PropTypes.func.isRequired,
    className: PropTypes.string,
    isVisible: PropTypes.bool.isRequired,
  }

  return (
    <div className="space-y-4 p-4 border-2 border-neutral-200 rounded-lg bg-neutral-50">
      {/* Password Field */}
      <div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label={passwordLabel}
            value={password}
            onChange={onPasswordChange}
            error={passwordError}
            required={required}
            disabled={disabled}
            placeholder={passwordPlaceholder}
            className="pr-10"
          />
          <EyeIcon
            onClick={() => !disabled && setShowPassword(!showPassword)}
            className={disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            isVisible={showPassword}
          />
        </div>

        {/* Password Strength Indicator */}
        {showStrengthIndicator && password && (
          <div className="mt-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-neutral-600">
                {passwordStrength.score}/5
              </span>
            </div>
            {passwordStrength.feedback.length > 0 && (
              <ul className="text-xs text-neutral-600 mt-1 space-y-1">
                {passwordStrength.feedback.slice(0, 3).map((feedback, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-error-500 mr-1">•</span>
                    {feedback}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            label={confirmPasswordLabel}
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            error={confirmPasswordError}
            required={required}
            disabled={disabled}
            placeholder={confirmPasswordPlaceholder}
            className={`pr-10 ${passwordsDontMatch ? 'border-error-500' : ''}`}
          />
          
          {/* Red symbol indicator when passwords don't match */}
          {passwordsDontMatch && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-error-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          
          {/* Green checkmark when passwords match */}
          {passwordsMatch && !confirmPasswordError && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-success-500"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
          
          <EyeIcon
            onClick={() => !disabled && setShowConfirmPassword(!showConfirmPassword)}
            className={disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            isVisible={showConfirmPassword}
          />
        </div>
      </div>
    </div>
  )
}

PasswordFields.propTypes = {
  password: PropTypes.string.isRequired,
  confirmPassword: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onConfirmPasswordChange: PropTypes.func.isRequired,
  passwordError: PropTypes.string,
  confirmPasswordError: PropTypes.string,
  disabled: PropTypes.bool,
  showStrengthIndicator: PropTypes.bool,
  passwordLabel: PropTypes.string,
  confirmPasswordLabel: PropTypes.string,
  passwordPlaceholder: PropTypes.string,
  confirmPasswordPlaceholder: PropTypes.string,
  required: PropTypes.bool,
}

export default PasswordFields
