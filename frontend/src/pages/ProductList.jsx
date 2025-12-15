import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProduct } from '../contexts/ProductContext'
import { useCategory } from '../contexts/CategoryContext'
import { useFilter } from '../contexts/FilterContext'
import { useSearch } from '../contexts/SearchContext'
import {
  Card,
  Button,
  Input,
  SearchBar,
  Pagination,
  LoadingSpinner,
  ErrorMessage,
  ScrollableContainer,
  FilterDropdown,
} from '../components/common'

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
    subCategories,
    loading: categoriesLoading,
    fetchCategories,
    fetchSubCategoriesByCategory,
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
  const [showFilters, setShowFilters] = useState(false)
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(null)
  const [localFilters, setLocalFilters] = useState({
    title: '',
    sku: '',
    minPrice: '',
    maxPrice: '',
    created_at_after: '',
    created_at_before: '',
    ordering: '-created_at',
  })
  
  // Fetch categories on mount
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])
  
  // Fetch products when filters/search change
  useEffect(() => {
    const applyFilters = () => {
      const productFilters = {
        search: searchTerm || localFilters.title || undefined,
        sku: localFilters.sku || undefined,
        min_price: localFilters.minPrice || undefined,
        max_price: localFilters.maxPrice || undefined,
        created_at_after: localFilters.created_at_after || undefined,
        created_at_before: localFilters.created_at_before || undefined,
        ordering: localFilters.ordering || '-created_at',
        subcategories: filters.subcategories.length > 0 ? filters.subcategories.join(',') : undefined,
      }
      
      // Clean undefined values
      Object.keys(productFilters).forEach((key) => {
        if (productFilters[key] === undefined || productFilters[key] === '') {
          delete productFilters[key]
        }
      })
      
      updateProductFilters(productFilters)
      fetchProducts(1, productFilters)
    }
    
    applyFilters()
  }, [
    searchTerm,
    localFilters,
    filters.subcategories,
    fetchProducts,
    updateProductFilters,
  ])
  
  // Handle search with debounce
  const handleSearch = useCallback((term) => {
    updateSearchTerm(term)
    debouncedSearch(term, (debouncedTerm) => {
      setLocalFilters((prev) => ({ ...prev, title: debouncedTerm }))
    })
  }, [updateSearchTerm, debouncedSearch])
  
  // Handle category selection
  const handleCategoryClick = (categoryId) => {
    selectCategory(categoryId)
    setShowSubcategoryDropdown(categoryId)
  }
  
  // Handle subcategory toggle
  const handleSubcategoryToggle = (subcategoryId) => {
    toggleSubcategory(subcategoryId)
  }
  
  // Apply filters
  const handleApplyFilters = () => {
    setShowFilters(false)
    fetchProducts(1)
  }
  
  // Reset all filters
  const handleResetFilters = () => {
    resetFilters()
    clearSubcategories()
    setLocalFilters({
      title: '',
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
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-600 mt-1">
            {pagination.count > 0 ? `${pagination.count} products found` : 'No products found'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {getActiveFiltersCount() > 0 && (
              <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Reset
            </Button>
          )}
        </div>
      </div>
      
      {/* Categories Header - Horizontal Scrollable */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-sm font-semibold text-neutral-700 mb-3">Categories</h2>
        {categoriesLoading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <ScrollableContainer showScrollButtons={true}>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  selectCategory(null)
                  setShowSubcategoryDropdown(null)
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
                <div key={category.id} className="relative">
                  <button
                    onClick={() => handleCategoryClick(category.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {category.name}
                  </button>
                  
                  {/* Subcategory Dropdown */}
                  {showSubcategoryDropdown === category.id && subCategories.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2 px-2">
                          <span className="text-sm font-semibold text-neutral-700">Subcategories</span>
                          <button
                            onClick={() => setShowSubcategoryDropdown(null)}
                            className="text-neutral-400 hover:text-neutral-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {subCategories.map((subcategory) => {
                          const isSelected = filters.subcategories.includes(subcategory.id)
                          return (
                            <button
                              key={subcategory.id}
                              onClick={() => handleSubcategoryToggle(subcategory.id)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 ${
                                isSelected
                                  ? 'bg-primary-50 text-primary-700'
                                  : 'text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              <span className={`w-4 h-4 border rounded flex items-center justify-center ${
                                isSelected
                                  ? 'bg-primary-600 border-primary-600'
                                  : 'border-neutral-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </span>
                              {subcategory.name}
                            </button>
                          )
                        })}
                        {filters.subcategories.length > 0 && (
                          <button
                            onClick={clearSubcategories}
                            className="w-full mt-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md"
                          >
                            Clear selection
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollableContainer>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <SearchBar
          placeholder="Search products by title..."
          onSearch={handleSearch}
          debounceMs={300}
          showClearButton={true}
        />
      </div>
      
      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title Filter */}
            <Input
              type="text"
              label="Title"
              value={localFilters.title}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Filter by title"
            />
            
            {/* SKU Filter */}
            <Input
              type="text"
              label="SKU"
              value={localFilters.sku}
              onChange={(e) => setLocalFilters((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder="Filter by SKU"
            />
            
            {/* Price Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Price Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={localFilters.minPrice}
                  onChange={(e) => setLocalFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                  placeholder="Min"
                  fullWidth={false}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={localFilters.maxPrice}
                  onChange={(e) => setLocalFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                  placeholder="Max"
                  fullWidth={false}
                  className="flex-1"
                />
              </div>
            </div>
            
            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Created After</label>
              <Input
                type="date"
                value={localFilters.created_at_after}
                onChange={(e) => setLocalFilters((prev) => ({ ...prev, created_at_after: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Created Before</label>
              <Input
                type="date"
                value={localFilters.created_at_before}
                onChange={(e) => setLocalFilters((prev) => ({ ...prev, created_at_before: e.target.value }))}
              />
            </div>
            
            {/* Sort By */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-700">Sort By</label>
              <select
                value={localFilters.ordering}
                onChange={(e) => setLocalFilters((prev) => ({ ...prev, ordering: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="title">Title: A to Z</option>
                <option value="-title">Title: Z to A</option>
                <option value="-updated_at">Recently Updated</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <ErrorMessage message={error} onDismiss={() => {}} />
      )}
      
      {/* Products Grid */}
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="w-full h-48 bg-neutral-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
                <div className="h-4 bg-neutral-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
