# HomeDar - Full Stack Application TODO

## Project Overview
Full-stack e-commerce application with Django REST Framework backend and React frontend, featuring product catalog with categories, sub-categories, and contact functionality.

---

## Phase 1: Project Setup & Configuration

### 1.1 Repository Structure Setup
- [X] Create `backend/` directory for Django project
- [X] Create `frontend/` directory for React project
- [X] Create `.gitignore` file in root directory (exclude node_modules, venv, __pycache__, .env files, etc.)
- [X] Create `.env.example` file in root with template for environment variables
- [X] Create `.env.example` file in backend directory for Django settings
- [X] Create `.env.example` file in frontend directory for React environment variables
- [X] Set up virtual environment directory structure (document in README)

### 1.2 Git Configuration
- [X] Create `.gitattributes` file for consistent line endings
- [X] Create `.editorconfig` file for consistent coding styles
- [X] Initialize git repository (if not already done)
- [X] Create initial commit structure

### 1.3 Main README.md
- [X] Write project overview and description
- [X] Add architecture diagram or description
- [X] Document project structure (backend/ and frontend/ directories)
- [X] Add prerequisites (Python version, Node.js version, etc.)
- [X] Add installation instructions for both backend and frontend
- [X] Add environment setup instructions
- [X] Add database configuration instructions (SQLite default, PostgreSQL optional)
- [X] Add development workflow instructions

---

## Phase 2: Backend Development (Django REST Framework)

### 2.1 Django Project Initialization
- [X] Create Django project in `backend/` directory
- [X] Install Django and Django REST Framework
- [X] Create `requirements.txt` with all dependencies
- [X] Set up Django settings for development and production
- [X] Configure database settings (SQLite default, PostgreSQL if credentials provided)
- [X] Set up environment-based configuration using `python-decouple` or `django-environ`
- [X] Configure CORS settings for frontend communication
- [X] Set up static files and media files configuration
- [X] Create `.env` file handling for database credentials

### 2.2 Database Models
- [X] Create `Category` model
  - Fields: id (UUID4, Primary Key), name, created_at, updated_at
  - Add string representation
  - Add Meta class with ordering
  
- [X] Create `SubCategory` model
  - Fields: id (UUID4, Primary Key), name, category (ForeignKey to Category), created_at, updated_at
  - Add string representation
  - Add Meta class with ordering
  - Ensure one sub-category belongs to one category
  
- [X] Create `Product` model
  - Fields: id (UUID4, Primary Key), title, sku (unique), price, description, created_at, updated_at
  - Add ManyToMany relationship with SubCategory
  - Add string representation
  - Add Meta class with ordering
  - Add validation for price (must be positive)
  
- [X] Create `ProductImage` model
  - Fields: id (UUID4, Primary Key), product (ForeignKey to Product), image (ImageField), is_main (BooleanField, default=False), created_at
  - Add validation to ensure at least one main image per product
  - Add string representation
  - Add Meta class with ordering
  
- [X] Create `ContactUs` model
  - Fields: id (UUID4, Primary Key), name, phone, email, message, created_at
  - Add email validation
  - Add string representation
  - Add Meta class with ordering

### 2.3 Database Migrations
- [X] Create initial migrations for all models
- [X] Run migrations to create database tables
- [X] Create migration files for any model changes
- [X] Test migrations on fresh database

### 2.4 Serializers
- [X] Create `CategorySerializer` (basic fields)
- [X] Create `SubCategorySerializer` (include category name/id)
- [X] Create `ProductImageSerializer` (image URL, is_main flag)
- [X] Create `ProductSerializer` (all fields, nested sub-categories, nested images)
- [X] Create `ProductListSerializer` (optimized for list view - title, price, main image, sku)
- [X] Create `ProductDetailSerializer` (full product details with all images)
- [X] Create `ContactUsSerializer` (all fields with validation)

### 2.5 API Views & Viewsets
- [X] Create `CategoryViewSet` (list, retrieve)
  - Endpoint: `/api/categories/`
  - Support filtering and ordering
  
- [X] Create `SubCategoryViewSet` (list, retrieve)
  - Endpoint: `/api/subcategories/`
  - Support filtering by category
  - Support filtering and ordering
  
- [X] Create `ProductViewSet` (list, retrieve)
  - Endpoint: `/api/products/`
  - Support filtering by:
    - Title (search)
    - SKU (exact match)
    - Price range (min_price, max_price)
    - Date range (created_at, updated_at)
    - Sub-categories (multiple selection)
  - Support search by title (using Django REST Framework search)
  - Support ordering by price (ascending/descending)
  - Implement pagination (page size configurable)
  
- [X] Create `ProductImageViewSet` (list, retrieve, update)
  - Endpoint: `/api/product-images/`
  - Support updating is_main flag
  - Ensure only one main image per product
  
- [X] Create `ContactUsViewSet` (create only)
  - Endpoint: `/api/contact-us/`
  - Only allow POST requests
  - Validate all fields
  - Send confirmation email (optional, future enhancement)

### 2.6 URL Configuration
- [X] Set up main `urls.py` in project root
- [X] Configure API routes using Django REST Framework router
- [X] Set up media files serving in development
- [X] Add API documentation endpoint (using drf-yasg or similar)
- [X] Configure URL patterns for all viewsets

### 2.7 Admin Interface
- [X] Register all models in Django admin
- [X] Create admin classes for better admin interface
- [X] Add inline editing for ProductImages in Product admin
- [X] Add inline editing for SubCategories in Category admin
- [X] Add search and filter options in admin
- [X] Create superuser account

### 2.8 Backend Testing
- [X] Write unit tests for all models
- [X] Write unit tests for all serializers
- [X] Write API endpoint tests for CategoryViewSet
- [X] Write API endpoint tests for SubCategoryViewSet
- [X] Write API endpoint tests for ProductViewSet (all filters, search, pagination)
- [X] Write API endpoint tests for ContactUsViewSet
- [X] Write tests for database constraints (unique SKU, one main image per product)
- [X] Test environment-based database configuration

### 2.9 Backend Documentation
- [X] Create `backend/README.md` with:
  - Installation instructions
  - Environment setup
  - Database configuration (SQLite and PostgreSQL)
  - Running migrations
  - Running development server
  - API endpoints documentation
  - Testing instructions
  - Project structure explanation

### 2.10 Backend Configuration Files
- [ ] Create `backend/.gitignore` (exclude migrations, __pycache__, .env, etc.)
- [ ] Create `backend/manage.py` (standard Django)
- [ ] Create `backend/requirements.txt` with pinned versions
- [ ] Create `backend/settings/` directory structure (if using split settings)
- [ ] Configure logging settings

---

## Phase 3: Frontend Development (React)

### 3.1 React Project Initialization
- [ ] Create React application in `frontend/` directory (using Create React App or Vite)
- [ ] Install necessary dependencies (React Router, Axios, UI library like Material-UI or Tailwind CSS)
- [ ] Create `package.json` with all dependencies
- [ ] Set up project structure (components, pages, services, utils, styles)
- [ ] Configure environment variables for API base URL
- [ ] Set up proxy configuration for API calls (if needed)

### 3.2 Theme & Styling Setup
- [ ] Choose and configure UI library (Material-UI, Tailwind CSS, or custom)
- [ ] Create theme configuration file
- [ ] Define color palette, typography, spacing
- [ ] Create global styles file
- [ ] Set up responsive breakpoints
- [ ] Create theme provider wrapper

### 3.3 Reusable Components
- [ ] Create `components/common/` directory structure
- [ ] Create `Button` component (reusable, theme-based)
- [ ] Create `Input` component (text, email, phone, textarea)
- [ ] Create `Card` component (for product cards)
- [ ] Create `LoadingSpinner` component
- [ ] Create `ErrorMessage` component
- [ ] Create `Pagination` component
- [ ] Create `ImageCarousel` component (for product images with dots)
- [ ] Create `ScrollableContainer` component (for categories)
- [ ] Create `FilterDropdown` component
- [ ] Create `SearchBar` component
- [ ] Create `Select` component (for multi-select)
- [ ] Create `Modal` component (if needed)

### 3.4 Layout Components
- [ ] Create `Header` component
  - Add example text/logo
  - Make it responsive
  - Add navigation links (if needed)
  
- [ ] Create `Footer` component
  - Add example text/information
  - Add "Contact Us" link
  - Make it responsive
  - Style consistently with theme

- [ ] Create `Layout` component (wraps Header, Footer, and page content)

### 3.5 API Service Layer
- [ ] Create `services/api.js` or `services/api.ts` for API configuration
- [ ] Create `services/categoryService.js` (getCategories)
- [ ] Create `services/subCategoryService.js` (getSubCategories, getSubCategoriesByCategory)
- [ ] Create `services/productService.js` (getProducts, getProductById, with filters, search, pagination)
- [ ] Create `services/contactService.js` (submitContactForm)
- [ ] Add error handling for all API calls
- [ ] Add loading states management

### 3.6 State Management
- [ ] Set up state management (Context API, Redux, or Zustand)
- [ ] Create product state management (list, filters, pagination)
- [ ] Create category state management
- [ ] Create filter state management
- [ ] Create search state management

### 3.7 Pages Development

#### 3.7.1 Product List Page (Homepage)
- [ ] Create `pages/ProductList.js` component
- [ ] Implement product listing display (card grid layout)
- [ ] Implement category header (horizontal scrollable)
  - Fetch categories from backend
  - Make it scrollable (drag and click buttons)
  - Responsive design (hide overflow, show scroll buttons on mobile/desktop)
  - Active category highlighting
  
- [ ] Implement sub-category dropdown
  - Show on category click
  - Multi-select functionality
  - Display selected sub-categories
  - Close dropdown on outside click
  
- [ ] Implement filters
  - Title filter input
  - SKU filter input
  - Price range filter (min/max inputs)
  - Date range filter (from/to date pickers)
  - Sort by price (ascending/descending dropdown)
  
- [ ] Implement search functionality
  - Search input field
  - Search by title
  - Debounce search input
  - Clear search functionality
  
- [ ] Implement pagination
  - Page number display
  - Previous/Next buttons
  - Page size selector (optional)
  - Display current page and total pages
  
- [ ] Implement product cards
  - Display main product image
  - Display product title
  - Display product price
  - Make cards clickable (navigate to detail page)
  - Responsive grid layout (adjust columns based on screen size)
  - Loading skeleton while fetching
  
- [ ] Implement filter combination logic
  - Apply all filters together
  - Reset filters functionality
  - Update URL query parameters (optional, for shareable links)

#### 3.7.2 Product Detail Page
- [ ] Create `pages/ProductDetail.js` component
- [ ] Fetch product by ID from backend
- [ ] Display all product information
  - Title
  - SKU
  - Price
  - Description
  - Sub-categories (tags or list)
  
- [ ] Implement image gallery
  - Display all product images
  - Show main image prominently
  - Display dots indicator for each image
  - Click on dot to change image
  - Implement drag/swipe functionality to change images
  - Smooth transitions between images
  - Responsive image sizing
  
- [ ] Add loading state
- [ ] Add error handling (product not found)
- [ ] Add back button or breadcrumb navigation

#### 3.7.3 Contact Us Page
- [ ] Create `pages/ContactUs.js` component
- [ ] Create contact form with fields:
  - Name (required, text input)
  - Phone (required, phone input with validation)
  - Email (required, email input with validation)
  - Message (required, textarea)
  
- [ ] Implement form validation
  - Client-side validation
  - Display error messages
  - Disable submit button when form is invalid
  
- [ ] Implement form submission
  - Submit to backend API
  - Show loading state during submission
  - Show success message on successful submission
  - Show error message on failure
  - Reset form after successful submission
  
- [ ] Style form consistently with theme
- [ ] Make form responsive

### 3.8 Routing
- [ ] Set up React Router
- [ ] Configure routes:
  - `/` - Product List Page (homepage)
  - `/product/:id` - Product Detail Page
  - `/contact` - Contact Us Page
- [ ] Add 404 Not Found page
- [ ] Add navigation between pages

### 3.9 Responsive Design
- [ ] Test and adjust layout for mobile screens (< 768px)
- [ ] Test and adjust layout for tablet screens (768px - 1024px)
- [ ] Test and adjust layout for desktop screens (> 1024px)
- [ ] Ensure all components are responsive
- [ ] Test touch interactions on mobile devices
- [ ] Optimize images for different screen sizes

### 3.10 Frontend Testing
- [ ] Write unit tests for reusable components
- [ ] Write unit tests for API service functions
- [ ] Write integration tests for product list page
- [ ] Write integration tests for product detail page
- [ ] Write integration tests for contact form
- [ ] Test filter combinations
- [ ] Test pagination functionality
- [ ] Test responsive behavior

### 3.11 Frontend Documentation
- [ ] Create `frontend/README.md` with:
  - Installation instructions
  - Environment setup
  - Running development server
  - Building for production
  - Project structure explanation
  - Component documentation
  - API integration details
  - Testing instructions

### 3.12 Frontend Configuration Files
- [ ] Create `frontend/.gitignore` (exclude node_modules, build, .env, etc.)
- [ ] Configure ESLint (if not included)
- [ ] Configure Prettier (optional, for code formatting)
- [ ] Set up build configuration
- [ ] Configure environment variables handling

---

## Phase 4: Integration & Testing

### 4.1 Backend-Frontend Integration
- [ ] Test all API endpoints from frontend
- [ ] Verify CORS configuration
- [ ] Test file upload (product images)
- [ ] Verify media files are accessible from frontend
- [ ] Test API error handling in frontend
- [ ] Verify pagination works correctly
- [ ] Test all filters and search functionality
- [ ] Test multi-select sub-category filtering

### 4.2 End-to-End Testing
- [ ] Test complete user flow: Browse products → Filter → View details
- [ ] Test complete user flow: Browse → Filter by category → Select sub-categories → View filtered products
- [ ] Test complete user flow: Search product → View details
- [ ] Test complete user flow: Navigate to contact page → Submit form → Verify submission
- [ ] Test responsive behavior on actual devices
- [ ] Test image carousel functionality
- [ ] Test category scrolling functionality

### 4.3 Performance Optimization
- [ ] Optimize API queries (use select_related, prefetch_related)
- [ ] Implement image optimization (compression, thumbnails)
- [ ] Implement lazy loading for product images
- [ ] Optimize React component re-renders
- [ ] Add pagination limits to prevent large data loads
- [ ] Implement caching where appropriate

### 4.4 Error Handling
- [ ] Add comprehensive error handling in backend
- [ ] Add comprehensive error handling in frontend
- [ ] Create user-friendly error messages
- [ ] Add error logging (backend)
- [ ] Handle network errors gracefully
- [ ] Handle validation errors in forms

### 4.5 Security
- [ ] Review and secure API endpoints
- [ ] Implement rate limiting (optional)
- [ ] Validate all user inputs (backend)
- [ ] Sanitize user inputs
- [ ] Secure file uploads (validate file types, sizes)
- [ ] Review CORS settings for production

---

## Phase 5: Documentation & Deployment Preparation

### 5.1 API Documentation
- [ ] Document all API endpoints
- [ ] Document request/response formats
- [ ] Document error codes and messages
- [ ] Create Postman collection (optional)
- [ ] Add API versioning (if needed)

### 5.2 Deployment Configuration
- [ ] Create production settings for backend
- [ ] Create production build configuration for frontend
- [ ] Set up environment variables for production
- [ ] Configure static files serving for production
- [ ] Configure media files serving for production
- [ ] Create Docker files (optional)
- [ ] Create deployment scripts (optional)

### 5.3 Final Documentation Updates
- [ ] Update main README.md with deployment instructions
- [ ] Update backend README.md with production setup
- [ ] Update frontend README.md with production build
- [ ] Document environment variables
- [ ] Create architecture diagram
- [ ] Document database schema

---

## Phase 6: Polish & Final Touches

### 6.1 UI/UX Improvements
- [ ] Review and improve loading states
- [ ] Add smooth transitions and animations
- [ ] Improve error message display
- [ ] Add empty states (no products found, etc.)
- [ ] Improve accessibility (ARIA labels, ke# HomeDar - Full Stack Application TODO

## Project Overview
Full-stack e-commerce application with Django REST Framework backend and React frontend, featuring product catalog with categories, sub-categories, and contact functionality.

---

## Phase 1: Project Setup & Configuration

### 1.1 Repository Structure Setup
- [ ] Create `backend/` directory for Django project
- [ ] Create `frontend/` directory for React project
- [ ] Create `.gitignore` file in root directory (exclude node_modules, venv, __pycache__, .env files, etc.)
- [ ] Create `.env.example` file in root with template for environment variables
- [ ] Create `.env.example` file in backend directory for Django settings
- [ ] Create `.env.example` file in frontend directory for React environment variables
- [ ] Set up virtual environment directory structure (document in README)

### 1.2 Git Configuration
- [ ] Create `.gitattributes` file for consistent line endings
- [ ] Create `.editorconfig` file for consistent coding styles
- [ ] Initialize git repository (if not already done)
- [ ] Create initial commit structure

### 1.3 Main README.md
- [ ] Write project overview and description
- [ ] Add architecture diagram or description
- [ ] Document project structure (backend/ and frontend/ directories)
- [ ] Add prerequisites (Python version, Node.js version, etc.)
- [ ] Add installation instructions for both backend and frontend
- [ ] Add environment setup instructions
- [ ] Add database configuration instructions (SQLite default, PostgreSQL optional)
- [ ] Add development workflow instructions
- [ ] Add contribution guidelines
- [ ] Add license information (if applicable)

---

## Phase 2: Backend Development (Django REST Framework)

### 2.1 Django Project Initialization
- [ ] Create Django project in `backend/` directory
- [ ] Install Django and Django REST Framework
- [ ] Create `requirements.txt` with all dependencies
- [ ] Set up Django settings for development and production
- [ ] Configure database settings (SQLite default, PostgreSQL if credentials provided)
- [ ] Set up environment-based configuration using `python-decouple` or `django-environ`
- [ ] Configure CORS settings for frontend communication
- [ ] Set up static files and media files configuration
- [ ] Create `.env` file handling for database credentials

### 2.2 Database Models
- [ ] Create `Category` model
  - Fields: id (UUID4, Primary Key), name, created_at, updated_at
  - Add string representation
  - Add Meta class with ordering
  
- [ ] Create `SubCategory` model
  - Fields: id (UUID4, Primary Key), name, category (ForeignKey to Category), created_at, updated_at
  - Add string representation
  - Add Meta class with ordering
  - Ensure one sub-category belongs to one category
  
- [ ] Create `Product` model
  - Fields: id (UUID4, Primary Key), title, sku (unique), price, description, created_at, updated_at
  - Add ManyToMany relationship with SubCategory
  - Add string representation
  - Add Meta class with ordering
  - Add validation for price (must be positive)
  
- [ ] Create `ProductImage` model
  - Fields: id (UUID4, Primary Key), product (ForeignKey to Product), image (ImageField), is_main (BooleanField, default=False), created_at
  - Add validation to ensure at least one main image per product
  - Add string representation
  - Add Meta class with ordering
  
- [ ] Create `ContactUs` model
  - Fields: id (UUID4, Primary Key), name, phone, email, message, created_at
  - Add email validation
  - Add string representation
  - Add Meta class with ordering

### 2.3 Database Migrations
- [ ] Create initial migrations for all models
- [ ] Run migrations to create database tables
- [ ] Create migration files for any model changes
- [ ] Test migrations on fresh database

### 2.4 Serializers
- [ ] Create `CategorySerializer` (basic fields)
- [ ] Create `SubCategorySerializer` (include category name/id)
- [ ] Create `ProductImageSerializer` (image URL, is_main flag)
- [ ] Create `ProductSerializer` (all fields, nested sub-categories, nested images)
- [ ] Create `ProductListSerializer` (optimized for list view - title, price, main image, sku)
- [ ] Create `ProductDetailSerializer` (full product details with all images)
- [ ] Create `ContactUsSerializer` (all fields with validation)

### 2.5 API Views & Viewsets
- [ ] Create `CategoryViewSet` (list, retrieve)
  - Endpoint: `/api/categories/`
  - Support filtering and ordering
  
- [ ] Create `SubCategoryViewSet` (list, retrieve)
  - Endpoint: `/api/subcategories/`
  - Support filtering by category
  - Support filtering and ordering
  
- [ ] Create `ProductViewSet` (list, retrieve)
  - Endpoint: `/api/products/`
  - Support filtering by:
    - Title (search)
    - SKU (exact match)
    - Price range (min_price, max_price)
    - Date range (created_at, updated_at)
    - Sub-categories (multiple selection)
  - Support search by title (using Django REST Framework search)
  - Support ordering by price (ascending/descending)
  - Implement pagination (page size configurable)
  
- [ ] Create `ProductImageViewSet` (list, retrieve, update)
  - Endpoint: `/api/product-images/`
  - Support updating is_main flag
  - Ensure only one main image per product
  
- [ ] Create `ContactUsViewSet` (create only)
  - Endpoint: `/api/contact-us/`
  - Only allow POST requests
  - Validate all fields
  - Send confirmation email (optional, future enhancement)

### 2.6 URL Configuration
- [ ] Set up main `urls.py` in project root
- [ ] Configure API routes using Django REST Framework router
- [ ] Set up media files serving in development
- [ ] Add API documentation endpoint (using drf-yasg or similar)
- [ ] Configure URL patterns for all viewsets

### 2.7 Admin Interface
- [ ] Register all models in Django admin
- [ ] Create admin classes for better admin interface
- [ ] Add inline editing for ProductImages in Product admin
- [ ] Add inline editing for SubCategories in Category admin
- [ ] Add search and filter options in admin
- [ ] Create superuser account

### 2.8 Backend Testing
- [ ] Write unit tests for all models
- [ ] Write unit tests for all serializers
- [ ] Write API endpoint tests for CategoryViewSet
- [ ] Write API endpoint tests for SubCategoryViewSet
- [ ] Write API endpoint tests for ProductViewSet (all filters, search, pagination)
- [ ] Write API endpoint tests for ContactUsViewSet
- [ ] Write tests for database constraints (unique SKU, one main image per product)
- [ ] Test environment-based database configuration

### 2.9 Backend Documentation
- [ ] Create `backend/README.md` with:
  - Installation instructions
  - Environment setup
  - Database configuration (SQLite and PostgreSQL)
  - Running migrations
  - Running development server
  - API endpoints documentation
  - Testing instructions
  - Project structure explanation

### 2.10 Backend Configuration Files
- [ ] Create `backend/.gitignore` (exclude migrations, __pycache__, .env, etc.)
- [ ] Create `backend/manage.py` (standard Django)
- [ ] Create `backend/requirements.txt` with pinned versions
- [ ] Create `backend/settings/` directory structure (if using split settings)
- [ ] Configure logging settings

---

## Phase 3: Frontend Development (React)

### 3.1 React Project Initialization
- [ ] Create React application in `frontend/` directory (using Create React App or Vite)
- [ ] Install necessary dependencies (React Router, Axios, UI library like Material-UI or Tailwind CSS)
- [ ] Create `package.json` with all dependencies
- [ ] Set up project structure (components, pages, services, utils, styles)
- [ ] Configure environment variables for API base URL
- [ ] Set up proxy configuration for API calls (if needed)

### 3.2 Theme & Styling Setup
- [ ] Choose and configure UI library (Material-UI, Tailwind CSS, or custom)
- [ ] Create theme configuration file
- [ ] Define color palette, typography, spacing
- [ ] Create global styles file
- [ ] Set up responsive breakpoints
- [ ] Create theme provider wrapper

### 3.3 Reusable Components
- [ ] Create `components/common/` directory structure
- [ ] Create `Button` component (reusable, theme-based)
- [ ] Create `Input` component (text, email, phone, textarea)
- [ ] Create `Card` component (for product cards)
- [ ] Create `LoadingSpinner` component
- [ ] Create `ErrorMessage` component
- [ ] Create `Pagination` component
- [ ] Create `ImageCarousel` component (for product images with dots)
- [ ] Create `ScrollableContainer` component (for categories)
- [ ] Create `FilterDropdown` component
- [ ] Create `SearchBar` component
- [ ] Create `Select` component (for multi-select)
- [ ] Create `Modal` component (if needed)

### 3.4 Layout Components
- [ ] Create `Header` component
  - Add example text/logo
  - Make it responsive
  - Add navigation links (if needed)
  
- [ ] Create `Footer` component
  - Add example text/information
  - Add "Contact Us" link
  - Make it responsive
  - Style consistently with theme

- [ ] Create `Layout` component (wraps Header, Footer, and page content)

### 3.5 API Service Layer
- [ ] Create `services/api.js` or `services/api.ts` for API configuration
- [ ] Create `services/categoryService.js` (getCategories)
- [ ] Create `services/subCategoryService.js` (getSubCategories, getSubCategoriesByCategory)
- [ ] Create `services/productService.js` (getProducts, getProductById, with filters, search, pagination)
- [ ] Create `services/contactService.js` (submitContactForm)
- [ ] Add error handling for all API calls
- [ ] Add loading states management

### 3.6 State Management
- [ ] Set up state management (Context API, Redux, or Zustand)
- [ ] Create product state management (list, filters, pagination)
- [ ] Create category state management
- [ ] Create filter state management
- [ ] Create search state management

### 3.7 Pages Development

#### 3.7.1 Product List Page (Homepage)
- [ ] Create `pages/ProductList.js` component
- [ ] Implement product listing display (card grid layout)
- [ ] Implement category header (horizontal scrollable)
  - Fetch categories from backend
  - Make it scrollable (drag and click buttons)
  - Responsive design (hide overflow, show scroll buttons on mobile/desktop)
  - Active category highlighting
  
- [ ] Implement sub-category dropdown
  - Show on category click
  - Multi-select functionality
  - Display selected sub-categories
  - Close dropdown on outside click
  
- [ ] Implement filters
  - Title filter input
  - SKU filter input
  - Price range filter (min/max inputs)
  - Date range filter (from/to date pickers)
  - Sort by price (ascending/descending dropdown)
  
- [ ] Implement search functionality
  - Search input field
  - Search by title
  - Debounce search input
  - Clear search functionality
  
- [ ] Implement pagination
  - Page number display
  - Previous/Next buttons
  - Page size selector (optional)
  - Display current page and total pages
  
- [ ] Implement product cards
  - Display main product image
  - Display product title
  - Display product price
  - Make cards clickable (navigate to detail page)
  - Responsive grid layout (adjust columns based on screen size)
  - Loading skeleton while fetching
  
- [ ] Implement filter combination logic
  - Apply all filters together
  - Reset filters functionality
  - Update URL query parameters (optional, for shareable links)

#### 3.7.2 Product Detail Page
- [ ] Create `pages/ProductDetail.js` component
- [ ] Fetch product by ID from backend
- [ ] Display all product information
  - Title
  - SKU
  - Price
  - Description
  - Sub-categories (tags or list)
  
- [ ] Implement image gallery
  - Display all product images
  - Show main image prominently
  - Display dots indicator for each image
  - Click on dot to change image
  - Implement drag/swipe functionality to change images
  - Smooth transitions between images
  - Responsive image sizing
  
- [ ] Add loading state
- [ ] Add error handling (product not found)
- [ ] Add back button or breadcrumb navigation

#### 3.7.3 Contact Us Page
- [ ] Create `pages/ContactUs.js` component
- [ ] Create contact form with fields:
  - Name (required, text input)
  - Phone (required, phone input with validation)
  - Email (required, email input with validation)
  - Message (required, textarea)
  
- [ ] Implement form validation
  - Client-side validation
  - Display error messages
  - Disable submit button when form is invalid
  
- [ ] Implement form submission
  - Submit to backend API
  - Show loading state during submission
  - Show success message on successful submission
  - Show error message on failure
  - Reset form after successful submission
  
- [ ] Style form consistently with theme
- [ ] Make form responsive

### 3.8 Routing
- [ ] Set up React Router
- [ ] Configure routes:
  - `/` - Product List Page (homepage)
  - `/product/:id` - Product Detail Page
  - `/contact` - Contact Us Page
- [ ] Add 404 Not Found page
- [ ] Add navigation between pages

### 3.9 Responsive Design
- [ ] Test and adjust layout for mobile screens (< 768px)
- [ ] Test and adjust layout for tablet screens (768px - 1024px)
- [ ] Test and adjust layout for desktop screens (> 1024px)
- [ ] Ensure all components are responsive
- [ ] Test touch interactions on mobile devices
- [ ] Optimize images for different screen sizes

### 3.10 Frontend Testing
- [ ] Write unit tests for reusable components
- [ ] Write unit tests for API service functions
- [ ] Write integration tests for product list page
- [ ] Write integration tests for product detail page
- [ ] Write integration tests for contact form
- [ ] Test filter combinations
- [ ] Test pagination functionality
- [ ] Test responsive behavior

### 3.11 Frontend Documentation
- [ ] Create `frontend/README.md` with:
  - Installation instructions
  - Environment setup
  - Running development server
  - Building for production
  - Project structure explanation
  - Component documentation
  - API integration details
  - Testing instructions

### 3.12 Frontend Configuration Files
- [ ] Create `frontend/.gitignore` (exclude node_modules, build, .env, etc.)
- [ ] Configure ESLint (if not included)
- [ ] Configure Prettier (optional, for code formatting)
- [ ] Set up build configuration
- [ ] Configure environment variables handling

---

## Phase 4: Integration & Testing

### 4.1 Backend-Frontend Integration
- [ ] Test all API endpoints from frontend
- [ ] Verify CORS configuration
- [ ] Test file upload (product images)
- [ ] Verify media files are accessible from frontend
- [ ] Test API error handling in frontend
- [ ] Verify pagination works correctly
- [ ] Test all filters and search functionality
- [ ] Test multi-select sub-category filtering

### 4.2 End-to-End Testing
- [ ] Test complete user flow: Browse products → Filter → View details
- [ ] Test complete user flow: Browse → Filter by category → Select sub-categories → View filtered products
- [ ] Test complete user flow: Search product → View details
- [ ] Test complete user flow: Navigate to contact page → Submit form → Verify submission
- [ ] Test responsive behavior on actual devices
- [ ] Test image carousel functionality
- [ ] Test category scrolling functionality

### 4.3 Performance Optimization
- [ ] Optimize API queries (use select_related, prefetch_related)
- [ ] Implement image optimization (compression, thumbnails)
- [ ] Implement lazy loading for product images
- [ ] Optimize React component re-renders
- [ ] Add pagination limits to prevent large data loads
- [ ] Implement caching where appropriate

### 4.4 Error Handling
- [ ] Add comprehensive error handling in backend
- [ ] Add comprehensive error handling in frontend
- [ ] Create user-friendly error messages
- [ ] Add error logging (backend)
- [ ] Handle network errors gracefully
- [ ] Handle validation errors in forms

### 4.5 Security
- [ ] Review and secure API endpoints
- [ ] Implement rate limiting (optional)
- [ ] Validate all user inputs (backend)
- [ ] Sanitize user inputs
- [ ] Secure file uploads (validate file types, sizes)
- [ ] Review CORS settings for production

---

## Phase 5: Documentation & Deployment Preparation

### 5.1 API Documentation
- [ ] Document all API endpoints
- [ ] Document request/response formats
- [ ] Document error codes and messages
- [ ] Create Postman collection (optional)
- [ ] Add API versioning (if needed)

### 5.2 Deployment Configuration
- [ ] Create production settings for backend
- [ ] Create production build configuration for frontend
- [ ] Set up environment variables for production
- [ ] Configure static files serving for production
- [ ] Configure media files serving for production
- [ ] Create Docker files (optional)
- [ ] Create deployment scripts (optional)

### 5.3 Final Documentation Updates
- [ ] Update main README.md with deployment instructions
- [ ] Update backend README.md with production setup
- [ ] Update frontend README.md with production build
- [ ] Document environment variables
- [ ] Create architecture diagram
- [ ] Document database schema

---
