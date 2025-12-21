import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import { signup } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'
import { getOrCreateVisitorId } from '../utils/visitor'

// Predefined Security Questions
const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your mother's maiden name?",
  "What was the name of your elementary school?",
  "What was your childhood nickname?",
  "What is your favorite movie?",
  "What was the make of your first car?",
  "What is your favorite food?",
  "What was the name of your best friend in childhood?",
  "What is your favorite book?",
]

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
    security_questions: [
      { question_text: '', answer: '', question_order: 1 },
      { question_text: '', answer: '', question_order: 2 },
      { question_text: '', answer: '', question_order: 3 },
    ],
  })

  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const validateSecurityQuestion = (index) => {
    const question = formData.security_questions[index]
    if (!question.question_text || !question.question_text.trim()) {
      return `Security Question ${index + 1}: Please select a question`
    }
    if (!question.answer || !question.answer.trim()) {
      return `Security Question ${index + 1}: Answer is required`
    }
    if (question.answer.trim().length > 100) {
      return `Security Question ${index + 1}: Answer must be at most 100 characters long`
    }
    return null
  }

  const validateUniqueQuestions = () => {
    const questions = formData.security_questions
      .map((q) => q.question_text.trim())
      .filter((q) => q)

    if (questions.length !== 3) {
      return 'Please select all 3 security questions'
    }

    const uniqueQuestions = new Set(questions)
    if (uniqueQuestions.size !== 3) {
      return 'All security questions must be unique'
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

  // Handle security question change
  const handleSecurityQuestionChange = (questionIndex, field, value) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.security_questions]
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        [field]: value,
      }
      return {
        ...prev,
        security_questions: updatedQuestions,
      }
    })

    // Clear error for this security question
    const errorKey = `security_question_${questionIndex}`
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: null,
      }))
    }

    // Clear unique questions error
    if (errors.security_questions) {
      setErrors((prev) => ({
        ...prev,
        security_questions: null,
      }))
    }
  }

  // Get available questions for a dropdown (exclude already selected ones)
  const getAvailableQuestions = (currentIndex) => {
    const selectedQuestions = formData.security_questions
      .map((q, idx) => (idx !== currentIndex ? q.question_text : null))
      .filter((q) => q && q.trim())
    
    return SECURITY_QUESTIONS.map((question) => ({
      value: question,
      label: question,
      disabled: selectedQuestions.includes(question),
    }))
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

    // Validate security questions
    formData.security_questions.forEach((question, index) => {
      const questionError = validateSecurityQuestion(index)
      if (questionError) {
        newErrors[`security_question_${index}`] = questionError
      }
    })

    // Validate unique questions
    const uniqueError = validateUniqueQuestions()
    if (uniqueError) {
      newErrors.security_questions = uniqueError
    }

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
      formData.security_questions.every(
        (q) => q.question_text.trim() && q.answer.trim()
      ) &&
      !validateFirstName(formData.first_name) &&
      !validateLastName(formData.last_name) &&
      !validateUsername(formData.username) &&
      !validateEmail(formData.email) &&
      !validatePassword(formData.password) &&
      !validateConfirmPassword(formData.confirmPassword, formData.password) &&
      !validateUniqueQuestions()
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
    // Clear previous field errors
    setErrors({})

    try {
      // Get visitor_id from localStorage
      const visitorId = getOrCreateVisitorId()

      // Prepare signup data
      const signupData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        visitor_id: visitorId,
        security_questions: formData.security_questions.map((q) => ({
          question_text: q.question_text.trim(),
          answer: q.answer.trim(),
          question_order: q.question_order,
        })),
      }

      // Call signup API
      const result = await signup(signupData)

      if (result.success) {
        try {
          // Login user automatically
          await authLogin(result.data.user, {
            access: result.data.access,
            refresh: result.data.refresh,
          })

          // Redirect to profile page
          navigate('/profile', { replace: true })
        } catch (loginError) {
          console.error('Error during auto-login after signup:', loginError)
          // Even if login fails, redirect to login page
          setSubmitError('Account created successfully, but automatic login failed. Please log in manually.')
          navigate('/login', { replace: true })
        }
      } else {
        // Handle field-specific errors from API
        if (result.fieldErrors) {
          const newErrors = {}
          
          // Map API field errors to form field errors
          Object.keys(result.fieldErrors).forEach((field) => {
            // Map API field names to form field names
            const formField = field === 'security_questions' ? 'security_questions' : field
            newErrors[formField] = result.fieldErrors[field]
            
            // Handle security questions errors if they come as a nested structure
            if (field.startsWith('security_questions')) {
              // Extract question index if present (e.g., security_questions.0.question_text)
              const match = field.match(/security_questions\[(\d+)\]\.(\w+)/)
              if (match) {
                const index = parseInt(match[1])
                const subField = match[2]
                const errorKey = `security_question_${index}`
                if (!newErrors[errorKey]) {
                  newErrors[errorKey] = result.fieldErrors[field]
                } else {
                  newErrors[errorKey] += ` ${result.fieldErrors[field]}`
                }
              } else {
                newErrors['security_questions'] = result.fieldErrors[field]
              }
            }
          })
          
          setErrors(newErrors)
          
          // Also show a general error message if provided
          if (result.error) {
            setSubmitError(result.error)
          }
        } else {
          // General error message (no field-specific errors)
          setSubmitError(result.error || 'Signup failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
      })
      setSubmitError(
        error.response?.data?.detail || 
        error.message || 
        'An unexpected error occurred. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
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

          {/* Security Questions */}
          <div className="space-y-4 pt-4 border-t border-neutral-200">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Security Questions
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Please select and answer 3 security questions. These will be used to recover your password if you forget it.
            </p>

            {errors.security_questions && (
              <ErrorMessage message={errors.security_questions} />
            )}

            {formData.security_questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <Select
                  label={`Security Question ${index + 1}`}
                  options={getAvailableQuestions(index)}
                  value={question.question_text}
                  onChange={(value) =>
                    handleSecurityQuestionChange(index, 'question_text', value)
                  }
                  error={errors[`security_question_${index}`]}
                  required
                  disabled={isSubmitting}
                  placeholder="Select a security question"
                />
                <Input
                  type="text"
                  label={`Answer for Question ${index + 1}`}
                  value={question.answer}
                  onChange={(e) =>
                    handleSecurityQuestionChange(index, 'answer', e.target.value)
                  }
                  error={
                    errors[`security_question_${index}`]?.includes('Answer')
                      ? errors[`security_question_${index}`]
                      : null
                  }
                  required
                  disabled={isSubmitting}
                  placeholder="Enter your answer"
                  helperText="Max 100 characters"
                />
              </div>
            ))}
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
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
