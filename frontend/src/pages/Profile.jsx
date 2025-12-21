import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import ErrorMessage from '../components/common/ErrorMessage'
import SuccessMessage from '../components/common/SuccessMessage'
import LoadingSpinner from '../components/common/LoadingSpinner'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { getProfile, updateProfile } from '../services/authService'
import { useAuth } from '../contexts/AuthContext'

function Profile() {
  const navigate = useNavigate()
  const { user: contextUser, updateUser, logout: authLogout } = useAuth()

  // State management
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    visitor_id: null,
    created_at: '',
    updated_at: '',
  })
  const [originalData, setOriginalData] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsFetching(true)
      try {
        // Use user from context if available, otherwise fetch
        if (contextUser) {
          setFormData({
            username: contextUser.username || '',
            email: contextUser.email || '',
            first_name: contextUser.first_name || '',
            last_name: contextUser.last_name || '',
            visitor_id: contextUser.visitor_id || null,
            created_at: contextUser.created_at || '',
            updated_at: contextUser.updated_at || '',
          })
          setOriginalData({
            username: contextUser.username || '',
            email: contextUser.email || '',
            first_name: contextUser.first_name || '',
            last_name: contextUser.last_name || '',
            visitor_id: contextUser.visitor_id || null,
            created_at: contextUser.created_at || '',
            updated_at: contextUser.updated_at || '',
          })
        } else {
          // Fetch profile if not in context
          const result = await getProfile()
          if (result.success) {
            const userData = result.data.user
            setFormData({
              username: userData.username || '',
              email: userData.email || '',
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              visitor_id: userData.visitor_id || null,
              created_at: userData.created_at || '',
              updated_at: userData.updated_at || '',
            })
            setOriginalData({
              username: userData.username || '',
              email: userData.email || '',
              first_name: userData.first_name || '',
              last_name: userData.last_name || '',
              visitor_id: userData.visitor_id || null,
              created_at: userData.created_at || '',
              updated_at: userData.updated_at || '',
            })
          } else {
            setSubmitError(result.error || 'Failed to load profile')
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
        setSubmitError('An unexpected error occurred while loading your profile')
      } finally {
        setIsFetching(false)
      }
    }

    fetchProfile()
  }, [contextUser])

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Validation functions
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

  const validateForm = () => {
    const newErrors = {}

    // Email is read-only, no validation needed

    const firstNameError = validateFirstName(formData.first_name)
    if (firstNameError) newErrors.first_name = firstNameError

    const lastNameError = validateLastName(formData.last_name)
    if (lastNameError) newErrors.last_name = lastNameError

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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

  // Handle edit click
  const handleEditClick = () => {
    // Store current data as original
    setOriginalData({ ...formData })
    setIsEditMode(true)
    setErrors({})
    setSubmitError('')
    setSuccessMessage('')
  }

  // Handle cancel
  const handleCancel = () => {
    // Restore original data
    if (originalData) {
      setFormData({ ...originalData })
    }
    setIsEditMode(false)
    setErrors({})
    setSubmitError('')
    setSuccessMessage('')
  }

  // Handle save
  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setSubmitError('')
    setSuccessMessage('')

    try {
      // Prepare update data (only changed fields)
      // Note: Email is read-only and cannot be updated
      const updateData = {}
      if (formData.first_name !== originalData.first_name) {
        updateData.first_name = formData.first_name.trim()
      }
      if (formData.last_name !== originalData.last_name) {
        updateData.last_name = formData.last_name.trim()
      }

      // If no changes, just exit edit mode
      if (Object.keys(updateData).length === 0) {
        setIsEditMode(false)
        setIsLoading(false)
        return
      }

      // Call update profile API
      const result = await updateProfile(updateData)

      if (result.success) {
        // Update context with new user data
        const updatedUser = result.data.user
        updateUser(updatedUser)

        // Update formData and originalData with response data
        setFormData({
          username: updatedUser.username || formData.username,
          email: updatedUser.email || formData.email,
          first_name: updatedUser.first_name || formData.first_name,
          last_name: updatedUser.last_name || formData.last_name,
          visitor_id: updatedUser.visitor_id || formData.visitor_id,
          created_at: updatedUser.created_at || formData.created_at,
          updated_at: updatedUser.updated_at || formData.updated_at,
        })
        setOriginalData({
          username: updatedUser.username || formData.username,
          email: updatedUser.email || formData.email,
          first_name: updatedUser.first_name || formData.first_name,
          last_name: updatedUser.last_name || formData.last_name,
          visitor_id: updatedUser.visitor_id || formData.visitor_id,
          created_at: updatedUser.created_at || formData.created_at,
          updated_at: updatedUser.updated_at || formData.updated_at,
        })

        // Show success message
        setSuccessMessage('Profile updated successfully!')

        // Exit edit mode
        setIsEditMode(false)
      } else {
        // Display error message
        setSubmitError(result.error || 'Failed to update profile. Please try again.')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setSubmitError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    authLogout()
    navigate('/login', { replace: true })
  }

  // Show loading spinner during initial fetch
  if (isFetching) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <LoadingSpinner fullScreen size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-2">
            My Profile
          </h1>
          <p className="text-neutral-600 text-lg">
            Manage your account information
          </p>
        </div>
        <Button
          type="button"
          variant="danger"
          onClick={handleLogout}
          disabled={isLoading}
        >
          Logout
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage('')}
          className="mb-6"
        />
      )}

      {/* Error Message */}
      {submitError && <ErrorMessage message={submitError} />}

      {/* Profile Information Card */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 space-y-6">
        {/* Visitor ID - Highlighted Section */}
        {formData.visitor_id && (
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-6">
            <label className="block text-sm font-semibold text-primary-900 mb-1">
              Visitor ID
            </label>
            <p className="text-lg font-mono text-primary-700 break-all">
              {formData.visitor_id}
            </p>
            <p className="text-xs text-primary-600 mt-2">
              This ID links your account to your browsing activity across devices
            </p>
          </div>
        )}

        {/* Username - Read-only */}
        <div>
          <Input
            type="text"
            name="username"
            label="Username"
            value={formData.username}
            disabled={true}
            helperText="Username cannot be changed"
          />
        </div>

        {/* Email - Read-only */}
        <div>
          <Input
            type="email"
            name="email"
            label="Email"
            value={formData.email}
            disabled={true}
            helperText="Email cannot be changed"
          />
        </div>

        {/* First Name - Editable in edit mode */}
        <div>
          <Input
            type="text"
            name="first_name"
            label="First Name"
            value={formData.first_name}
            onChange={handleChange}
            error={errors.first_name}
            required
            disabled={!isEditMode || isLoading}
            placeholder="Enter your first name"
          />
        </div>

        {/* Last Name - Editable in edit mode */}
        <div>
          <Input
            type="text"
            name="last_name"
            label="Last Name"
            value={formData.last_name}
            onChange={handleChange}
            error={errors.last_name}
            required
            disabled={!isEditMode || isLoading}
            placeholder="Enter your last name"
          />
        </div>

        {/* Account Created Date - Read-only */}
        <div>
          <Input
            type="text"
            name="created_at"
            label="Account Created"
            value={formatDate(formData.created_at)}
            disabled={true}
          />
        </div>

        {/* Last Updated Date - Read-only */}
        <div>
          <Input
            type="text"
            name="updated_at"
            label="Last Updated"
            value={formatDate(formData.updated_at)}
            disabled={true}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-neutral-200">
          {!isEditMode ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleEditClick}
              disabled={isLoading}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
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
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrap Profile in ProtectedRoute
function ProfilePage() {
  return (
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  )
}

export default ProfilePage
