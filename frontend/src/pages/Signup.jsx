import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import { requestSignupCode, verifySignupCode } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { getOrCreateVisitorId } from '../utils/visitor'

function Signup() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1) // 1: details, 2: code verification
  const [code, setCode] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  })

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) {
      return { score: 0, feedback: [] }
    }

    let score = 0
    const feedback = []

    // Length check (8+ characters)
    if (password.length >= 8) {
      score++
    } else {
      feedback.push('Password must be at least 8 characters long')
    }

    // Uppercase letter check
    if (/[A-Z]/.test(password)) {
      score++
    } else {
      feedback.push('Add an uppercase letter')
    }

    // Lowercase letter check
    if (/[a-z]/.test(password)) {
      score++
    } else {
      feedback.push('Add a lowercase letter')
    }

    // Number check
    if (/\d/.test(password)) {
      score++
    } else {
      feedback.push('Add a number')
    }

    // Special character check (optional but recommended)
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score++
    } else {
      feedback.push('Add a special character (recommended)')
    }

    return { score, feedback }
  }

  // Update password strength when password changes
  useEffect(() => {
    if (formData.password) {
      const strength = calculatePasswordStrength(formData.password)
      setPasswordStrength(strength)
    } else {
      setPasswordStrength({ score: 0, feedback: [] })
    }
  }, [formData.password])

  // Validation functions
  const validateFirstName = (value) => {
    if (!value || !value.trim()) {
      return 'First name is required'
    }
    return null
  }

  const validateLastName = (value) => {
    if (!value || !value.trim()) {
      return 'Last name is required'
    }
    return null
  }

  const validateUsername = (value) => {
    if (!value || !value.trim()) {
      return 'Username is required'
    }
    const trimmed = value.trim()
    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters long'
    }
    if (trimmed.length > 150) {
      return 'Username must be at most 150 characters long'
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Username can only contain letters, numbers, and underscores'
    }
    return null
  }

  const validateEmail = (value) => {
    if (!value || !value.trim()) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value.trim())) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const validatePassword = (value) => {
    if (!value) {
      return 'Password is required'
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/\d/.test(value)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const validateConfirmPassword = (value, password) => {
    if (!value) {
      return 'Please confirm your password'
    }
    if (value !== password) {
      return 'Passwords do not match'
    }
    return null
  }

  const validateCode = (value) => {
    if (!value || !value.trim()) {
      return 'Verification code is required'
    }
    const trimmed = value.trim()
    if (!/^\d{4}$/.test(trimmed)) {
      return 'Code must be a 4-digit number'
    }
    return null
  }

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }))
    }
    
    // Clear submit error when user starts typing
    if (submitError) {
      setSubmitError('')
    }
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}

    // Validate basic fields
    const firstNameError = validateFirstName(formData.first_name)
    if (firstNameError) newErrors.first_name = firstNameError

    const lastNameError = validateLastName(formData.last_name)
    if (lastNameError) newErrors.last_name = lastNameError

    const usernameError = validateUsername(formData.username)
    if (usernameError) newErrors.username = usernameError

    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError

    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError

    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    )
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.first_name.trim() &&
      formData.last_name.trim() &&
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword &&
      !validateFirstName(formData.first_name) &&
      !validateLastName(formData.last_name) &&
      !validateUsername(formData.username) &&
      !validateEmail(formData.email) &&
      !validatePassword(formData.password) &&
      !validateConfirmPassword(formData.confirmPassword, formData.password)
    )
  }

  const handleCodeChange = (e) => {
    const value = e.target.value
    setCode(value)

    if (errors.code) {
      setErrors((prev) => ({
        ...prev,
        code: null,
      }))
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  // Step 1: request signup code
  const handleRequestCode = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setErrors({})

    try {
      const signupData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }

      const result = await requestSignupCode(signupData)

      if (result.success) {
        setStep(2)
        setInfoMessage(
          `We have sent a 4-digit verification code to ${signupData.email}. Please enter it below to complete your signup.`
        )
      } else {
        const newErrors = {}
        if (result.fieldErrors) {
          Object.keys(result.fieldErrors).forEach((field) => {
            newErrors[field] = result.fieldErrors[field]
          })
        }
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
        }
        if (result.error) {
          setSubmitError(result.error)
        }
      }
    } catch (error) {
      console.error('Signup request code error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Step 2: verify code and complete signup
  const handleVerifyCode = async () => {
    const codeError = validateCode(code)
    if (codeError) {
      setErrors((prev) => ({ ...prev, code: codeError }))
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setErrors({})

    try {
      const visitorId = getOrCreateVisitorId()

      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        visitor_id: visitorId,
        code: code.trim(),
      }

      const result = await verifySignupCode(payload)

      if (result.success) {
        try {
          await authLogin(result.data.user, {
            access: result.data.access,
            refresh: result.data.refresh,
          })
          navigate('/profile', { replace: true })
        } catch (loginError) {
          console.error('Error during auto-login after signup:', loginError)
          setSubmitError('Account created successfully, but automatic login failed. Please log in manually.')
          navigate('/login', { replace: true })
        }
      } else {
        if (result.error) {
          setSubmitError(result.error)
        }
      }
    } catch (error) {
      console.error('Signup verify code error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (step === 1) {
      await handleRequestCode()
    } else {
      await handleVerifyCode()
    }
  }

  // Password strength indicator color
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return 'bg-error-500'
    if (passwordStrength.score === 3) return 'bg-warning-500'
    if (passwordStrength.score >= 4) return 'bg-success-500'
    return 'bg-neutral-300'
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
          Create Account
        </h1>
        <p className="text-neutral-600 text-lg">
          Sign up to get started with your account
        </p>
      </div>

      {/* Signup Form */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First Name Field */}
          <Input
            type="text"
            name="first_name"
            label="First Name"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            required
            disabled={isSubmitting}
            placeholder="Enter your first name"
          />

          {/* Last Name Field */}
          <Input
            type="text"
            name="last_name"
            label="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
            required
            disabled={isSubmitting}
            placeholder="Enter your last name"
          />

          {/* Username Field */}
          <Input
            type="text"
            name="username"
            label="Username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
            disabled={isSubmitting}
            placeholder="Choose a username (min 3 characters)"
            helperText="Letters, numbers, and underscores only"
          />

          {/* Email Field */}
          <Input
            type="email"
            name="email"
            label="Email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
            disabled={isSubmitting}
            placeholder="Enter your email address"
          />

          {/* Password Field */}
          <div>
            <Input
              type="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              disabled={isSubmitting}
              placeholder="Enter a strong password"
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{
                        width: `${(passwordStrength.score / 5) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-neutral-600">
                    {passwordStrength.score}/5
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="mt-1 text-xs text-neutral-600 list-disc list-inside">
                    {passwordStrength.feedback.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <Input
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
            disabled={isSubmitting}
            placeholder="Confirm your password"
          />

          {/* OTP Step 2: Verification Code */}
          {step === 2 && (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Verify Your Email
              </h3>
              <p className="text-sm text-neutral-600 mb-2">
                Enter the 4-digit verification code we sent to your email address.
              </p>
              {infoMessage && (
                <p className="text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-md px-3 py-2">
                  {infoMessage}
                </p>
              )}
              <Input
                type="text"
                name="code"
                label="Verification Code"
                value={code}
                onChange={handleCodeChange}
                error={errors.code}
                required
                disabled={isSubmitting}
                placeholder="Enter 4-digit code"
                maxLength={4}
              />
            </div>
          )}

          {/* Submit Error Message */}
          {submitError && <ErrorMessage message={submitError} />}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting || (step === 1 && !isFormValid())}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {step === 1 ? 'Sending Code...' : 'Creating Account...'}
                </span>
              ) : (
                step === 1 ? 'Send Verification Code' : 'Create Account'
              )}
            </Button>
          </div>

          {/* Link to Login */}
          <div className="text-center pt-4">
            <p className="text-neutral-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup
