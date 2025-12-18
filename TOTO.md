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
- [X] Create `backend/.gitignore` (exclude migrations, __pycache__, .env, etc.)
- [X] Create `backend/manage.py` (standard Django)
- [X] Create `backend/requirements.txt` with pinned versions
- [X] Create `backend/settings/` directory structure (if using split settings)
- [X] Configure logging settings

---

## Phase 3: Frontend Development (React)

### 3.1 React Project Initialization
- [X] Create React application in `frontend/` directory (using Create React App or Vite)
- [X] Install necessary dependencies (React Router, Axios, UI library like Material-UI or Tailwind CSS)
- [X] Create `package.json` with all dependencies
- [X] Set up project structure (components, pages, services, utils, styles)
- [X] Configure environment variables for API base URL
- [X] Set up proxy configuration for API calls (if needed)

### 3.2 Theme & Styling Setup
- [X] Choose and configure UI library (Material-UI, Tailwind CSS, or custom)
- [X] Create theme configuration file
- [X] Define color palette, typography, spacing
- [X] Create global styles file
- [X] Set up responsive breakpoints
- [X] Create theme provider wrapper

### 3.3 Reusable Components
- [X] Create `components/common/` directory structure
- [X] Create `Button` component (reusable, theme-based)
- [X] Create `Input` component (text, email, phone, textarea)
- [X] Create `Card` component (for product cards)
- [X] Create `LoadingSpinner` component
- [X] Create `ErrorMessage` component
- [X] Create `Pagination` component
- [X] Create `ImageCarousel` component (for product images with dots)
- [X] Create `ScrollableContainer` component (for categories)
- [X] Create `FilterDropdown` component
- [X] Create `SearchBar` component
- [X] Create `Select` component (for multi-select)
- [X] Create `Modal` component (if needed)

### 3.4 Layout Components
- [X] Create `Header` component
  - Add example text/logo
  - Make it responsive
  - Add navigation links (if needed)
  
- [X] Create `Footer` component
  - Add example text/information
  - Add "Contact Us" link
  - Make it responsive
  - Style consistently with theme

- [X] Create `Layout` component (wraps Header, Footer, and page content)

### 3.5 API Service Layer
- [X] Create `services/api.js` or `services/api.ts` for API configuration
- [X] Create `services/categoryService.js` (getCategories)
- [X] Create `services/subCategoryService.js` (getSubCategories, getSubCategoriesByCategory)
- [X] Create `services/productService.js` (getProducts, getProductById, with filters, search, pagination)
- [X] Create `services/contactService.js` (submitContactForm)
- [X] Add error handling for all API calls
- [X] Add loading states management

### 3.6 State Management
- [X] Set up state management (Context API, Redux, or Zustand)
- [X] Create product state management (list, filters, pagination)
- [X] Create category state management
- [X] Create filter state management
- [X] Create search state management

### 3.7 Pages Development

#### 3.7.1 Product List Page (Homepage)
- [X] Create `pages/ProductList.js` component
- [X] Implement product listing display (card grid layout)
- [X] Implement category header (horizontal scrollable)
  - Fetch categories from backend
  - Make it scrollable (drag and click buttons)
  - Responsive design (hide overflow, show scroll buttons on mobile/desktop)
  - Active category highlighting
  
- [X] Implement sub-category dropdown
  - Show on category click
  - Multi-select functionality
  - Display selected sub-categories
  - Close dropdown on outside click
  
- [X] Implement filters
  - Title filter input
  - SKU filter input
  - Price range filter (min/max inputs)
  - Date range filter (from/to date pickers)
  - Sort by price (ascending/descending dropdown)
  
- [X] Implement search functionality
  - Search input field
  - Search by title
  - Debounce search input
  - Clear search functionality
  
- [X] Implement pagination
  - Page number display
  - Previous/Next buttons
  - Page size selector (optional)
  - Display current page and total pages
  
- [X] Implement product cards
  - Display main product image
  - Display product title
  - Display product price
  - Make cards clickable (navigate to detail page)
  - Responsive grid layout (adjust columns based on screen size)
  - Loading skeleton while fetching
  
- [X] Implement filter combination logic
  - Apply all filters together
  - Reset filters functionality
  - Update URL query parameters (optional, for shareable links)

#### 3.7.2 Product Detail Page
- [X] Create `pages/ProductDetail.js` component
- [X] Fetch product by ID from backend
- [X] Display all product information
  - Title
  - SKU
  - Price
  - Description
  - Sub-categories (tags or list)
  
- [X] Implement image gallery
  - Display all product images
  - Show main image prominently
  - Display dots indicator for each image
  - Click on dot to change image
  - Implement drag/swipe functionality to change images
  - Smooth transitions between images
  - Responsive image sizing
  
- [X] Add loading state
- [X] Add error handling (product not found)
- [X] Add back button or breadcrumb navigation

#### 3.7.3 Contact Us Page
- [X] Create `pages/ContactUs.js` component
- [X] Create contact form with fields:
  - Name (required, text input)
  - Phone (required, phone input with validation)
  - Email (required, email input with validation)
  - Message (required, textarea)
  
- [X] Implement form validation
  - Client-side validation
  - Display error messages
  - Disable submit button when form is invalid
  
- [X] Implement form submission
  - Submit to backend API
  - Show loading state during submission
  - Show success message on successful submission
  - Show error message on failure
  - Reset form after successful submission
  
- [X] Style form consistently with theme
- [X] Make form responsive

### 3.8 Routing
- [X] Set up React Router
- [X] Configure routes:
  - `/` - Product List Page (homepage)
  - `/product/:id` - Product Detail Page
  - `/contact` - Contact Us Page
- [X] Add 404 Not Found page
- [X] Add navigation between pages

### 3.9 Responsive Design
- [X] Test and adjust layout for mobile screens (< 768px)
- [X] Test and adjust layout for tablet screens (768px - 1024px)
- [X] Test and adjust layout for desktop screens (> 1024px)
- [X] Ensure all components are responsive
- [X] Test touch interactions on mobile devices
- [X] Optimize images for different screen sizes

### 3.10 Frontend Testing
- [X] Write unit tests for reusable components
- [X] Write unit tests for API service functions
- [X] Write integration tests for product list page
- [X] Write integration tests for product detail page
- [X] Write integration tests for contact form
- [X] Test filter combinations
- [X] Test pagination functionality
- [X] Test responsive behavior

### 3.11 Frontend Documentation
- [X] Create `frontend/README.md` with:
  - Installation instructions
  - Environment setup
  - Running development server
  - Building for production
  - Project structure explanation
  - Component documentation
  - API integration details
  - Testing instructions

---
