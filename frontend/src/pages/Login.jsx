import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import { login } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: authLogin } = useAuth()

  // Get intended route from location state (if redirected from ProtectedRoute)
  const from = location.state?.from?.pathname || '/profile'

  // Form state
  const [formData, setFormData] = useState({
    username_or_email: '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  // Validation functions
  const validateUsernameOrEmail = (value) => {
    if (!value || !value.trim()) {
      return 'Username or email is required'
    }
    return null
  }

  const validatePassword = (value) => {
    if (!value || !value.trim()) {
      return 'Password is required'
    }
    return null
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}

    const usernameError = validateUsernameOrEmail(formData.username_or_email)
    if (usernameError) newErrors.username_or_email = usernameError

    const passwordError = validatePassword(formData.password)
    if (passwordError) newErrors.password = passwordError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.username_or_email.trim() &&
      formData.password &&
      !validateUsernameOrEmail(formData.username_or_email) &&
      !validatePassword(formData.password)
    )
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      // Prepare login credentials
      const credentials = {
        username_or_email: formData.username_or_email.trim(),
        password: formData.password,
      }

      // Call login API
      const result = await login(credentials)

      if (result.success) {
        // Login user in context (tokens already stored by login service)
        await authLogin(result.data.user, {
          access: result.data.access,
          refresh: result.data.refresh,
        })

        // Handle remember me (optional - could extend token lifetime)
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }

        // Redirect to intended route or profile
        navigate(from, { replace: true })
      } else {
        // Display error message
        setSubmitError(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
          Welcome Back
        </h1>
        <p className="text-neutral-600 text-lg">
          Sign in to your account to continue
        </p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username or Email Field */}
          <Input
            type="text"
            name="username_or_email"
            label="Username or Email"
            value={formData.username_or_email}
            onChange={handleChange}
            error={errors.username_or_email}
            required
            disabled={isSubmitting}
            placeholder="Username or Email"
            autoComplete="username"
          />

          {/* Password Field */}
          <Input
            type="password"
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
            disabled={isSubmitting}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-neutral-700">
                Remember me
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Error Message */}
          {submitError && <ErrorMessage message={submitError} />}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!isFormValid() || isSubmitting}
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
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </div>

          {/* Link to Signup */}
          <div className="text-center pt-4">
            <p className="text-neutral-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login

