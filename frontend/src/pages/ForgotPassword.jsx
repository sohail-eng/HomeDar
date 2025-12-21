import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PasswordFields from '../components/common/PasswordFields'
import { forgotPasswordStep1, forgotPasswordStep2 } from '../services/authService'

function ForgotPassword() {
  const navigate = useNavigate()

  // State management
  const [currentStep, setCurrentStep] = useState(1) // 1, 2, or 3
  const [usernameOrEmail, setUsernameOrEmail] = useState('')
  const [questions, setQuestions] = useState([]) // Array of 3 questions from step 1
  const [selectedQuestionOrder, setSelectedQuestionOrder] = useState(null) // 1, 2, or 3
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false) // Password reset success flag
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Validate username or email
  const validateUsernameOrEmail = (value) => {
    if (!value || !value.trim()) {
      return 'Username or email is required'
    }
    return null
  }

  // Validate answer
  const validateAnswer = (value) => {
    if (!value || !value.trim()) {
      return 'Answer is required'
    }
    if (value.trim().length > 100) {
      return 'Answer must be at most 100 characters long'
    }
    return null
  }

  // Validate password
  const validatePassword = (value) => {
    if (!value || !value.trim()) {
      return 'Password is required'
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(value)
    const hasNumber = /[0-9]/.test(value)
    if (!hasLetter) {
      return 'Password must contain at least one letter'
    }
    if (!hasNumber) {
      return 'Password must contain at least one number'
    }
    return null
  }

  // Validate confirm password
  const validateConfirmPassword = (value, password) => {
    if (!value || !value.trim()) {
      return 'Please confirm your password'
    }
    if (value !== password) {
      return 'Passwords do not match'
    }
    return null
  }

  // Handle username or email input change
  const handleUsernameOrEmailChange = (e) => {
    const value = e.target.value
    setUsernameOrEmail(value)
    
    // Clear errors when user starts typing
    if (errors.usernameOrEmail) {
      setErrors((prev) => ({ ...prev, usernameOrEmail: null }))
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  // Handle password input change
  const handlePasswordChange = (e) => {
    const value = e.target.value
    setNewPassword(value)
    
    // Clear errors when user starts typing
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }))
    }
    if (errors.confirmPassword && confirmPassword) {
      // Re-validate confirm password if it's already filled
      const confirmError = validateConfirmPassword(confirmPassword, value)
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  // Handle confirm password input change
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)
    
    // Clear errors when user starts typing
    if (errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: null }))
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  // Handle answer input change
  const handleAnswerChange = (e) => {
    const value = e.target.value
    setAnswer(value)
    
    // Clear errors when user starts typing
    if (errors.answer) {
      setErrors((prev) => ({ ...prev, answer: null }))
    }
    if (submitError) {
      setSubmitError('')
    }
  }

  // Handle question selection
  const handleQuestionSelect = (questionOrder) => {
    setSelectedQuestionOrder(questionOrder)
    
    // Clear errors when user selects a question
    if (errors.selectedQuestion) {
      setErrors((prev) => ({ ...prev, selectedQuestion: null }))
    }
  }

  // Step 1: Submit username or email to get security questions
  const handleStep1Submit = async (e) => {
    e.preventDefault()

    // Validate username or email
    const usernameOrEmailError = validateUsernameOrEmail(usernameOrEmail)
    if (usernameOrEmailError) {
      setErrors({ usernameOrEmail: usernameOrEmailError })
      return
    }

    setIsLoading(true)
    setSubmitError('')
    setErrors({})

    try {
      const input = usernameOrEmail.trim()
      const result = await forgotPasswordStep1(input)

      if (result.success) {
        // Store questions and move to step 2
        setQuestions(result.data.questions || [])
        setCurrentStep(2)
      } else {
        // Display error message
        setSubmitError(result.error || 'Username or email not found. Please check and try again.')
      }
    } catch (error) {
      console.error('Forgot password step 1 error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Submit answer and new password to reset password
  const handleStep2Submit = async (e) => {
    e.preventDefault()

    // Validate selected question
    if (!selectedQuestionOrder) {
      setErrors({ selectedQuestion: 'Please select a security question' })
      return
    }

    // Validate answer
    const answerError = validateAnswer(answer)
    if (answerError) {
      setErrors({ answer: answerError })
      return
    }

    // Validate password
    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setErrors({ password: passwordError })
      return
    }

    // Validate confirm password
    const confirmPasswordError = validateConfirmPassword(confirmPassword, newPassword)
    if (confirmPasswordError) {
      setErrors({ confirmPassword: confirmPasswordError })
      return
    }

    setIsLoading(true)
    setSubmitError('')
    setErrors({})

    try {
      const input = usernameOrEmail.trim()
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
      const emailOrUsername = isEmail ? input.toLowerCase() : input
      
      const result = await forgotPasswordStep2({
        username_or_email: emailOrUsername,
        question_order: selectedQuestionOrder,
        answer: answer.trim(),
        password: newPassword,
      })

      if (result.success) {
        // Password reset successful, move to step 3
        setResetSuccess(true)
        setCurrentStep(3)
      } else {
        // Display error message
        setSubmitError(result.error || 'Incorrect answer. Please try again.')
      }
    } catch (error) {
      console.error('Forgot password step 2 error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle back button
  const handleBack = () => {
    if (currentStep === 2) {
      // Go back to step 1, preserve usernameOrEmail
      setCurrentStep(1)
      setSelectedQuestionOrder(null)
      setAnswer('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      setSubmitError('')
    }
  }

  // Progress indicator component
  const ProgressIndicator = () => {
    const steps = [
      { number: 1, label: 'Enter Username/Email' },
      { number: 2, label: 'Reset Password' },
      { number: 3, label: 'Success' },
    ]

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep === step.number
                      ? 'bg-primary-600 text-white'
                      : currentStep > step.number
                      ? 'bg-primary-200 text-primary-700'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`mt-2 text-xs text-center ${
                    currentStep === step.number
                      ? 'text-primary-600 font-medium'
                      : 'text-neutral-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.number ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render step 1: Username or Email input
  const renderStep1 = () => (
    <form onSubmit={handleStep1Submit} className="space-y-6">
      <div>
        <Input
          type="text"
          name="usernameOrEmail"
          label="Username or Email Address"
          value={usernameOrEmail}
          onChange={handleUsernameOrEmailChange}
          error={errors.usernameOrEmail}
          required
          disabled={isLoading}
          placeholder="Enter your username or email address"
          autoComplete="username"
        />
      </div>

      {submitError && <ErrorMessage message={submitError} />}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/login')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!usernameOrEmail.trim() || isLoading || !!validateUsernameOrEmail(usernameOrEmail)}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Loading...
            </span>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </form>
  )

  // Render step 2: Security question selection + answer
  const renderStep2 = () => (
    <form onSubmit={handleStep2Submit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">
          Select a security question:
          <span className="text-error-500 ml-1">*</span>
        </label>
        <div className="space-y-3">
          {questions.map((question) => (
            <label
              key={question.question_order}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedQuestionOrder === question.question_order
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-neutral-300 hover:border-primary-300'
              }`}
            >
              <input
                type="radio"
                name="security_question"
                value={question.question_order}
                checked={selectedQuestionOrder === question.question_order}
                onChange={() => handleQuestionSelect(question.question_order)}
                disabled={isLoading}
                className="mt-1 mr-3 w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-neutral-700">
                  Question {question.question_order}:
                </span>
                <p className="text-sm text-neutral-600 mt-1">
                  {question.question_text}
                </p>
              </div>
            </label>
          ))}
        </div>
        {errors.selectedQuestion && (
          <p className="mt-2 text-sm text-error-600">{errors.selectedQuestion}</p>
        )}
      </div>

      <div>
        <Input
          type="text"
          name="answer"
          label="Your Answer"
          value={answer}
          onChange={handleAnswerChange}
          error={errors.answer}
          required
          disabled={isLoading}
          placeholder="Enter your answer"
          helperText="Max 100 characters"
        />
      </div>

      {/* Password Fields Component */}
      <PasswordFields
        password={newPassword}
        confirmPassword={confirmPassword}
        onPasswordChange={handlePasswordChange}
        onConfirmPasswordChange={handleConfirmPasswordChange}
        passwordError={errors.password}
        confirmPasswordError={errors.confirmPassword}
        disabled={isLoading}
        showStrengthIndicator={true}
        passwordLabel="New Password"
        confirmPasswordLabel="Confirm New Password"
        passwordPlaceholder="Enter your new password"
        confirmPasswordPlaceholder="Confirm your new password"
        required={true}
      />

      {submitError && <ErrorMessage message={submitError} />}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isLoading}
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={
            !selectedQuestionOrder ||
            !answer.trim() ||
            !newPassword.trim() ||
            !confirmPassword.trim() ||
            isLoading ||
            !!validateAnswer(answer) ||
            !!validatePassword(newPassword) ||
            !!validateConfirmPassword(confirmPassword, newPassword)
          }
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Verifying...
            </span>
          ) : (
            'Verify Answer'
          )}
        </Button>
      </div>
    </form>
  )

  // Render step 3: Success message
  const renderStep3 = () => {
    return (
      <div className="space-y-6">
        <div className="bg-success-50 border-2 border-success-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-success-600"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.857a.75.75 0 00-1.214-.886l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4.003-5.5z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-success-900 mb-2">
                Password Reset Successful
              </h3>
              <p className="text-sm text-success-700 mb-4">
                Your password has been reset successfully. You can now login with your new password.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  // Main render
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
          Forgot Password
        </h1>
        <p className="text-neutral-600 text-lg">
          Follow the steps below to recover your password
        </p>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        {/* Step 1: Email Input */}
        {currentStep === 1 && renderStep1()}

        {/* Step 2: Security Question + Answer */}
        {currentStep === 2 && renderStep2()}

        {/* Step 3: Password Display */}
        {currentStep === 3 && renderStep3()}

        {/* Link to Login (available on all steps) */}
        <div className="mt-6 text-center pt-4 border-t border-neutral-200">
          <p className="text-neutral-600">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword