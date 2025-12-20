import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProduct } from '../contexts/ProductContext'
import { useCategory } from '../contexts/CategoryContext'
import { useFilter } from '../contexts/FilterContext'
import { useSearch } from '../contexts/SearchContext'
import {
  Card,
  Button,
  Input,
  Pagination,
  LoadingSpinner,
  ErrorMessage,
  ScrollableContainer,
  FilterDropdown,
} from '../components/common'
import RecentlyViewed from '../components/tracking/RecentlyViewed'
import PopularInYourArea from '../components/tracking/PopularInYourArea'

/**
 * Product List Page (Homepage)
 * Displays products with filters, search, categories, and pagination
 */
function ProductList() {
  const navigate = useNavigate()
  
  // Contexts
  const {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    updateFilters: updateProductFilters,
    resetFilters: resetProductFilters,
    goToPage,
  } = useProduct()
  
  const {
    categories,
    loading: categoriesLoading,
    fetchCategories,
    selectCategory,
    selectedCategoryId,
  } = useCategory()
  
  const {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    toggleSubcategory,
    clearSubcategories,
    getActiveFiltersCount,
  } = useFilter()
  
  const {
    searchTerm,
    updateSearchTerm,
    clearSearch,
    debouncedSearch,
  } = useSearch()
  
  // Local state
  const [showSearch, setShowSearch] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const categoryButtonRefs = useRef({})
  
  const [localFilters, setLocalFilters] = useState({
    sku: '',
    minPrice: '',
    maxPrice: '',
    created_at_after: '',
    created_at_before: '',
    ordering: '-created_at',
  })
  
  // Refs to prevent infinite loops
  const hasInitialFetch = useRef(false)
  const timeoutRef = useRef(null)
  const lastFiltersRef = useRef('')
  const categoryRefs = useRef({})
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any category dropdown
      const clickedOutsideCategory = Object.values(categoryRefs.current).every((ref) => {
        if (!ref) return true
        return !ref.contains(event.target)
      })
      
      // Check if click is outside search container
      const clickedOutsideSearch = searchContainerRef.current && 
                                    !searchContainerRef.current.contains(event.target)
      
      if (clickedOutsideCategory && expandedCategories.size > 0) {
        setExpandedCategories(new Set())
      }
      
      if (clickedOutsideSearch && showSearch) {
        setShowSearch(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [expandedCategories, showSearch])
  
  // Focus search input when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])
  
  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Initial fetch on mount - reset filters and fetch without any filters
  useEffect(() => {
    if (!hasInitialFetch.current) {
      hasInitialFetch.current = true
      console.log('Initial fetch triggered - resetting filters')
      // Reset all filters to ensure clean state
      resetFilters()
      clearSearch()
      setLocalFilters({
        sku: '',
        minPrice: '',
        maxPrice: '',
        created_at_after: '',
        created_at_before: '',
        ordering: '-created_at',
      })
      // Fetch with empty filters object
      fetchProducts(1, {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // Fetch products when filters/search change (debounced)
  useEffect(() => {
    // Skip initial render
    if (!hasInitialFetch.current) return
    
    // Build filter string to detect actual changes
    const filterString = JSON.stringify({
      search: searchTerm || '', // Use searchTerm directly
      sku: localFilters.sku || '',
      minPrice: localFilters.minPrice || '',
      maxPrice: localFilters.maxPrice || '',
      created_at_after: localFilters.created_at_after || '',
      created_at_before: localFilters.created_at_before || '',
      ordering: localFilters.ordering || '-created_at',
      subcategories: filters.subcategories.join(','),
    })
    
    // Only proceed if filters actually changed
    if (filterString === lastFiltersRef.current) {
      return
    }
    
    lastFiltersRef.current = filterString
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Debounce the API call - reasonable delay for smooth UX
    timeoutRef.current = setTimeout(() => {
      const productFilters = {
        search: searchTerm?.trim() || undefined, // Use searchTerm directly from context
        sku: localFilters.sku?.trim() || undefined,
        min_price: localFilters.minPrice?.trim() || undefined,
        max_price: localFilters.maxPrice?.trim() || undefined,
        created_at_after: localFilters.created_at_after?.trim() || undefined,
        created_at_before: localFilters.created_at_before?.trim() || undefined,
        ordering: localFilters.ordering || '-created_at',
        subcategories: filters.subcategories.length > 0 ? filters.subcategories.join(',') : undefined,
      }
      
      // Clean undefined, null, and empty string values
      Object.keys(productFilters).forEach((key) => {
        const value = productFilters[key]
        if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
          delete productFilters[key]
        }
      })
      
      // Update filters in context and fetch
      updateProductFilters(productFilters)
      fetchProducts(1, productFilters)
    }, 300) // 300ms debounce - smooth and responsive
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [
    searchTerm, // Search term from context
    localFilters.sku,
    localFilters.minPrice,
    localFilters.maxPrice,
    localFilters.created_at_after,
    localFilters.created_at_before,
    localFilters.ordering,
    filters.subcategories,
    // Removed fetchProducts and updateProductFilters from dependencies
    // to prevent infinite loops
  ])
  
  // Handle search - update search term directly, filtering will be debounced automatically
  const handleSearch = useCallback((term) => {
    updateSearchTerm(term)
  }, [updateSearchTerm])
  
  // Handle category selection
  const handleCategoryClick = (categoryId) => {
    selectCategory(categoryId)
  }
  
  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
        // Calculate position for the dropdown using fixed positioning
        const button = categoryButtonRefs.current[categoryId]
        if (button) {
          const rect = button.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + 8, // Fixed positioning is relative to viewport
            left: rect.left,
          })
        }
      }
      return newSet
    })
  }
  
  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (expandedCategories.size === 0) return
    
    const updatePosition = () => {
      const categoryId = Array.from(expandedCategories)[0]
      const button = categoryButtonRefs.current[categoryId]
      if (button) {
        const rect = button.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
        })
      }
    }
    
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [expandedCategories])
  
  // Handle subcategory toggle
  const handleSubcategoryToggle = (subcategoryId, e) => {
    e.stopPropagation()
    toggleSubcategory(subcategoryId)
  }
  
  // Reset all filters
  const handleResetFilters = () => {
    resetFilters()
    clearSubcategories()
    setExpandedCategories(new Set())
    setLocalFilters({
      sku: '',
      minPrice: '',
      maxPrice: '',
      created_at_after: '',
      created_at_before: '',
      ordering: '-created_at',
    })
    clearSearch()
    fetchProducts(1)
  }
  
  // Handle product card click
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`)
  }
  
  // Handle pagination
  const handlePageChange = (page) => {
    goToPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  // Get main image URL
  const getMainImageUrl = (product) => {
    if (product.main_image_url) {
      return product.main_image_url
    }
    if (product.images && product.images.length > 0) {
      const mainImage = product.images.find((img) => img.is_main) || product.images[0]
      return mainImage.image_url || mainImage.image
    }
    return null
  }
  
  // Get the expanded category for dropdown rendering
  const expandedCategoryId = expandedCategories.size > 0 ? Array.from(expandedCategories)[0] : null
  const expandedCategory = expandedCategoryId ? categories.find(c => c.id === expandedCategoryId) : null
  
  return (
    <div className="space-y-3">
      {/* Categories Header - Horizontal Scrollable */}
      <div className="bg-white rounded-lg shadow-sm p-3" style={{ position: 'relative', overflow: 'visible' }}>
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-neutral-700 whitespace-nowrap">Categories</h2>
          {categoriesLoading ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="flex-1 min-w-0" style={{ position: 'relative', overflow: 'visible' }}>
              <ScrollableContainer showScrollButtons={true}>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      selectCategory(null)
                      clearSubcategories()
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      !selectedCategoryId
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <div 
                      key={category.id} 
                      className="relative inline-block"
                      ref={(el) => {
                        categoryRefs.current[category.id] = el
                      }}
                    >
                      <button
                        ref={(el) => {
                          categoryButtonRefs.current[category.id] = el
                        }}
                        onClick={() => {
                          handleCategoryClick(category.id)
                          if (category.subcategories && category.subcategories.length > 0) {
                            toggleCategoryExpansion(category.id)
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                          selectedCategoryId === category.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        {category.name}
                        {category.subcategories && category.subcategories.length > 0 && (
                          <svg
                            className={`w-4 h-4 transition-transform ${
                              expandedCategories.has(category.id) ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollableContainer>
            </div>
          )}
        </div>
      </div>
      
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        {/* Title and Search Row - Mobile/Tablet: inline, Desktop: separate */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          {/* Title Section */}
          <div className="w-full lg:w-auto">
            <h1 className="text-3xl font-bold text-neutral-900 flex-shrink-0">Products</h1>
            {/* Mobile/Tablet: Product count and search on same line */}
            <div className="flex items-center gap-2 lg:block">
              <p className="text-neutral-600 mt-1 lg:mt-1">
                {pagination.count > 0 ? `${pagination.count} products found` : 'No products found'}
              </p>
              {/* Search on Mobile/Tablet - Always visible next to product count */}
              <div ref={searchContainerRef} className="flex-1 lg:hidden min-w-0">
                <div className="flex items-center gap-2 bg-white border border-neutral-300 rounded-lg px-2 lg:px-3 py-2 shadow-sm">
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search..."
                    className="outline-none border-none focus:ring-0 text-sm flex-1 min-w-0"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => clearSearch()}
                      className="text-neutral-400 hover:text-neutral-600 flex-shrink-0 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Desktop: Filters row with search */}
          <div className="hidden lg:flex gap-2 items-center">
            {/* Price Range */}
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={localFilters.minPrice}
                onChange={(e) => {
                  const value = e.target.value
                  setLocalFilters((prev) => ({ ...prev, minPrice: value === '0' ? '' : value }))
                }}
                placeholder="Min Price"
                fullWidth={false}
                className="w-24"
              />
              <Input
                type="number"
                value={localFilters.maxPrice}
                onChange={(e) => {
                  const value = e.target.value
                  setLocalFilters((prev) => ({ ...prev, maxPrice: value === '0' ? '' : value }))
                }}
                placeholder="Max Price"
                fullWidth={false}
                className="w-24"
              />
            </div>
            
            {/* Sort By Dropdown */}
            <div className="relative flex items-center">
              <select
                value={localFilters.ordering}
                onChange={(e) => setLocalFilters((prev) => ({ ...prev, ordering: e.target.value }))}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white cursor-pointer touch-manipulation min-w-[44px] min-h-[44px]"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="title">Title: A to Z</option>
                <option value="-title">Title: Z to A</option>
                <option value="-updated_at">Recently Updated</option>
                <option value="-likes_count">Most Liked</option>
              </select>
            </div>
            
            {/* Search on Desktop - Toggle button */}
            <div ref={searchContainerRef} className="relative flex items-center">
              {showSearch ? (
                <div className="flex items-center gap-1.5 bg-white border border-neutral-300 rounded-lg px-2 py-2 shadow-sm">
                  <svg className="w-4 h-4 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search..."
                    className="outline-none border-none focus:ring-0 text-sm w-48"
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false)
                      clearSearch()
                    }}
                    className="text-neutral-400 hover:text-neutral-600 flex-shrink-0 touch-manipulation w-4 h-4 flex items-center justify-center p-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}
            </div>
            
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="touch-manipulation min-w-[44px] min-h-[44px]">
                Reset
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile/Tablet: Min, Max, Sort on same line */}
        <div className="flex lg:hidden gap-2 items-center w-full">
          {/* Price Range */}
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={localFilters.minPrice}
              onChange={(e) => {
                const value = e.target.value
                setLocalFilters((prev) => ({ ...prev, minPrice: value === '0' ? '' : value }))
              }}
              placeholder="Min Price"
              fullWidth={false}
              className="w-24"
            />
            <Input
              type="number"
              value={localFilters.maxPrice}
              onChange={(e) => {
                const value = e.target.value
                setLocalFilters((prev) => ({ ...prev, maxPrice: value === '0' ? '' : value }))
              }}
              placeholder="Max Price"
              fullWidth={false}
              className="w-24"
            />
          </div>
          
          {/* Sort By Dropdown */}
          <div className="relative flex items-center">
            <select
                value={localFilters.ordering}
                onChange={(e) => setLocalFilters((prev) => ({ ...prev, ordering: e.target.value }))}
                className="px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white cursor-pointer touch-manipulation min-w-[44px] min-h-[44px]"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="title">Title: A to Z</option>
                <option value="-title">Title: Z to A</option>
                <option value="-updated_at">Recently Updated</option>
                <option value="-likes_count">Most Liked</option>
              </select>
          </div>
          
          {getActiveFiltersCount() > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="flex-shrink-0 whitespace-nowrap"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
      
      {/* Subcategories Dropdown - Rendered outside scrollable container using fixed positioning */}
      {expandedCategory && expandedCategory.subcategories && expandedCategory.subcategories.length > 0 && (
        <div 
          key={expandedCategory.id}
          className="fixed w-64 bg-white border-2 border-primary-200 rounded-lg shadow-xl max-h-96 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 99999,
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-neutral-700">Select Subcategories</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleCategoryExpansion(expandedCategory.id)
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              <div className="space-y-1">
                {expandedCategory.subcategories.map((subcategory) => {
                  const isSelected = filters.subcategories.includes(subcategory.id)
                  return (
                    <label
                      key={subcategory.id}
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSubcategory(subcategory.id)
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 cursor-pointer"
                      />
                      <span 
                        className={`text-sm flex-1 ${isSelected ? 'text-primary-700 font-medium' : 'text-neutral-700'}`}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          // Trigger checkbox change programmatically
                          const checkbox = e.currentTarget.previousElementSibling
                          if (checkbox) {
                            checkbox.click()
                          }
                        }}
                      >
                        {subcategory.name}
                      </span>
                    </label>
                  )
                })}
              </div>
            {filters.subcategories.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearSubcategories()
                }}
                className="w-full mt-2 px-3 py-1.5 text-xs text-primary-600 hover:bg-primary-50 rounded-md"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => {}} />
      )}
      
      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-40 bg-neutral-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                title={product.title}
                subtitle={`SKU: ${product.sku}`}
                image={getMainImageUrl(product)}
                imageAlt={product.title}
                onClick={() => handleProductClick(product.id)}
                hover={true}
                className="h-full"
              >
                <div className="mt-2">
                  <p className="text-xl font-bold text-primary-600">
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                  {product.description && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                pageSize={pagination.pageSize}
                totalItems={pagination.count}
                showPageSize={false}
              />
            </div>
          )}

          {/* Tracking-based sections below main listing */}
          <div className="mt-10 pt-10">
            {/* Decorative separator */}
            <div className="relative mb-10">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-1 w-48 rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 shadow-sm" />
              </div>
            </div>

            <div className="space-y-10">
              <RecentlyViewed onProductClick={handleProductClick} />

              {/* Decorative separator between Recently Viewed and Popular sections */}
              <div className="relative">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-1 w-48 rounded-full bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 shadow-sm" />
                </div>
              </div>

              <PopularInYourArea onProductClick={handleProductClick} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900">No products found</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Try adjusting your filters or search terms.
          </p>
          {getActiveFiltersCount() > 0 && (
            <div className="mt-6">
              <Button onClick={handleResetFilters}>Reset Filters</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProductList
