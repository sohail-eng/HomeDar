import { useState } from 'react'
import { Button, Input, ErrorMessage } from '../components/common'

/**
 * Contact Us Page
 * Displays a contact form with validation and submission
 */
function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  })
  
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null
  const [submitMessage, setSubmitMessage] = useState('')

  // Validation functions
  const validateName = (name) => {
    if (!name || !name.trim()) {
      return 'Name is required'
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters'
    }
    return null
  }

  const validatePhone = (phone) => {
    if (!phone || !phone.trim()) {
      return 'Phone number is required'
    }
    // Basic phone validation - allows digits, spaces, dashes, parentheses, and +
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(phone)) {
      return 'Please enter a valid phone number'
    }
    // Remove non-digit characters for length check
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return 'Phone number must contain at least 10 digits'
    }
    return null
  }

  const validateEmail = (email) => {
    if (!email || !email.trim()) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const validateMessage = (message) => {
    if (!message || !message.trim()) {
      return 'Message is required'
    }
    if (message.trim().length < 10) {
      return 'Message must be at least 10 characters'
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
    
    // Clear submit status when user starts typing
    if (submitStatus) {
      setSubmitStatus(null)
      setSubmitMessage('')
    }
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    
    const nameError = validateName(formData.name)
    if (nameError) newErrors.name = nameError
    
    const phoneError = validatePhone(formData.phone)
    if (phoneError) newErrors.phone = phoneError
    
    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError
    
    const messageError = validateMessage(formData.message)
    if (messageError) newErrors.message = messageError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)
    setSubmitMessage('')

    try {
      // Import the service dynamically to avoid circular dependencies
      const { submitContactForm } = await import('../services/contactService')
      
      const result = await submitContactForm({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      })

      if (result.success) {
        setSubmitStatus('success')
        setSubmitMessage(result.message || 'Thank you for contacting us! We will get back to you soon.')
        
        // Reset form after successful submission
        setFormData({
          name: '',
          phone: '',
          email: '',
          message: '',
        })
        setErrors({})
      } else {
        setSubmitStatus('error')
        setSubmitMessage(
          result.error || 
          result.message || 
          'Failed to submit your message. Please try again later.'
        )
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('An unexpected error occurred. Please try again later.')
      console.error('Contact form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.phone.trim() &&
      formData.email.trim() &&
      formData.message.trim() &&
      !validateName(formData.name) &&
      !validatePhone(formData.phone) &&
      !validateEmail(formData.email) &&
      !validateMessage(formData.message)
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
          Contact Us
        </h1>
        <p className="text-neutral-600 text-lg">
          We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <Input
            type="text"
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
            disabled={isSubmitting}
            placeholder="Enter your full name"
          />

          {/* Phone Field */}
          <Input
            type="tel"
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            required
            disabled={isSubmitting}
            placeholder="Enter your phone number"
            helperText="Include country code if applicable"
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

          {/* Message Field */}
          <Input
            type="textarea"
            name="message"
            label="Message"
            value={formData.message}
            onChange={handleChange}
            error={errors.message}
            required
            disabled={isSubmitting}
            placeholder="Enter your message (minimum 10 characters)"
            rows={6}
          />

          {/* Submit Status Messages */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-success-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-success-700 font-medium">{submitMessage}</p>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <ErrorMessage message={submitMessage} />
          )}

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
                  Submitting...
                </span>
              ) : (
                'Send Message'
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Additional Contact Information */}
      <div className="mt-8 text-center text-neutral-600">
        <p className="text-sm">
          For urgent matters, please call us directly or visit our office during business hours.
        </p>
      </div>
    </div>
  )
}

export default ContactUs
