# HomeDar Backend API

Django REST Framework backend for the HomeDar e-commerce application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Configuration](#database-configuration)
- [Running Migrations](#running-migrations)
- [Running Development Server](#running-development-server)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Additional Resources](#additional-resources)
 - [Visitor Tracking & Location](#visitor-tracking--location)

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- PostgreSQL (optional, for production)
- Virtual environment (recommended)

## Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python3 -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   # On Linux/Mac:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Environment Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your configuration:**
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   
   # Database Configuration (optional - SQLite used by default)
   # DATABASE_URL=postgresql://user:password@localhost:5432/homedar
   # OR
   # DB_NAME=homedar
   # DB_USER=postgres
   # DB_PASSWORD=your-password
   # DB_HOST=localhost
   # DB_PORT=5432
   ```

3. **Generate a secret key (optional):**
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

## Database Configuration

### SQLite (Default - Development)

SQLite is used by default for development. No additional configuration is required. The database file (`db.sqlite3`) will be created automatically when you run migrations.

### PostgreSQL (Production)

To use PostgreSQL, set the following environment variables in your `.env` file:

**Option 1: Using DATABASE_URL (Recommended)**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/homedar
```

**Option 2: Using individual settings**
```env
DB_NAME=homedar
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432
```

**Install PostgreSQL adapter (if not using DATABASE_URL):**
```bash
pip install psycopg2-binary
```

## Running Migrations

1. **Create migrations:**
   ```bash
   python manage.py makemigrations
   ```

2. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

3. **Create a superuser (for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

## Running Development Server

1. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

2. **Access the API:**
   - API Base URL: `http://localhost:8000/api/`
   - Admin Panel: `http://localhost:8000/admin/`
   - API Documentation (Swagger): `http://localhost:8000/swagger/`
   - API Documentation (ReDoc): `http://localhost:8000/redoc/`

3. **Run on a specific port:**
   ```bash
   python manage.py runserver 8080
   ```

## API Endpoints

### Base URL
All API endpoints are prefixed with `/api/`

### Authentication
Currently, all endpoints use `AllowAny` permissions. Authentication can be configured in production.

### Endpoints

#### Categories

- **List Categories**
  - `GET /api/categories/`
  - Query Parameters:
    - `name`: Filter by category name
    - `ordering`: Order by field (e.g., `name`, `created_at`, `updated_at`)
  - Response: Paginated list of categories

- **Retrieve Category**
  - `GET /api/categories/{id}/`
  - Response: Single category object

#### SubCategories

- **List SubCategories**
  - `GET /api/subcategories/`
  - Query Parameters:
    - `category`: Filter by category ID
    - `name`: Filter by subcategory name
    - `ordering`: Order by field
  - Response: Paginated list of subcategories

- **Retrieve SubCategory**
  - `GET /api/subcategories/{id}/`
  - Response: Single subcategory object with category information

#### Products

- **List Products**
  - `GET /api/products/`
  - Query Parameters:
    - `search`: Search in title and description
    - `sku`: Filter by exact SKU match
    - `min_price`: Minimum price filter
    - `max_price`: Maximum price filter
    - `created_at_after`: Filter by creation date (after)
    - `created_at_before`: Filter by creation date (before)
    - `updated_at_after`: Filter by update date (after)
    - `updated_at_before`: Filter by update date (before)
    - `subcategories`: Filter by subcategory IDs (comma-separated)
    - `ordering`: Order by field (`price`, `created_at`, `updated_at`, `title`)
    - `page`: Page number for pagination
    - `page_size`: Number of items per page (default: 20)
  - Response: Paginated list of products (optimized serializer)

- **Retrieve Product**
  - `GET /api/products/{id}/`
  - Response: Full product details with all images and subcategories

**Example Requests:**
```bash
# Search products
GET /api/products/?search=laptop

# Filter by price range
GET /api/products/?min_price=100&max_price=500

# Filter by subcategories
GET /api/products/?subcategories=uuid1,uuid2

# Order by price (ascending)
GET /api/products/?ordering=price

# Order by price (descending)
GET /api/products/?ordering=-price

# Combine filters
GET /api/products/?search=laptop&min_price=100&max_price=500&ordering=-price
```

#### Product Images

- **List Product Images**
  - `GET /api/product-images/`
  - Query Parameters:
    - `product`: Filter by product ID
    - `is_main`: Filter by main image flag
    - `ordering`: Order by field
  - Response: List of product images

- **Retrieve Product Image**
  - `GET /api/product-images/{id}/`
  - Response: Single product image

- **Update Product Image**
  - `PUT /api/product-images/{id}/` or `PATCH /api/product-images/{id}/`
  - Body: `{"is_main": true}`
  - Note: Setting an image as main automatically unsets other main images for the same product

#### Contact Us

- **Submit Contact Form**
  - `POST /api/contact-us/`
  - Body:
    ```json
    {
      "name": "John Doe",
      "phone": "1234567890",
      "email": "john@example.com",
      "message": "Your message here"
    }
    ```
  - Response: Success message with submitted data
  - Note: Only POST method is allowed

#### Tracking & Analytics

- **Track Product View**
  - `POST /api/tracking/product-views/`
  - Uses an anonymous `visitor_id` cookie (created automatically if missing).
  - Body:
    ```json
    {
      "product_id": "uuid-of-product",
      "latitude": 31.5204,
      "longitude": 74.3587
    }
    ```
  - Behavior:
    - Links the view to a `VisitorProfile` (created/updated based on cookie).
    - Enriches with approximate location from IP (country, city) via external IP geo API.
    - Applies simple throttling: ignores duplicate views of the same product by the same visitor within ~60 seconds.

- **Recently Viewed Products**
  - `GET /api/tracking/recent-products/`
  - Uses `visitor_id` from cookie to return last N unique products for that visitor.
  - Query params:
    - `limit` (optional, default `10`, max `50`)
  - Response:
    ```json
    {
      "results": [
        {
          "id": "product-uuid",
          "title": "Product title",
          "price": "123.45",
          "sku": "SKU-123",
          "main_image_url": "https://.../image.jpg",
          "subcategories": []
        }
      ]
    }
    ```

- **Popular Products (by location & period)**
  - `GET /api/tracking/popular-products/`
  - Query params:
    - `country` (optional): Country name (e.g. `Pakistan`). If omitted, backend tries to infer from visitor profile.
    - `period` (optional): one of `24h`, `7d` (default), `30d`.
    - `limit` (optional, default `10`, max `50`)
  - Response:
    ```json
    {
      "results": [
        {
          "id": "product-uuid",
          "title": "Product title",
          "price": "123.45",
          "sku": "SKU-123",
          "main_image_url": "https://.../image.jpg",
          "subcategories": []
        }
      ],
      "country": "PK",
      "period": "7d"
    }
    ```

### Response Format

All API responses follow REST conventions:

**Success Response (200 OK):**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [...]
}
```

**Error Response (400 Bad Request):**
```json
{
  "field_name": ["Error message"]
}
```

## Testing

### Run All Tests

```bash
python manage.py test
```

### Run Specific Test Suite

```bash
# Run model tests
python manage.py test catalog.tests.CategoryModelTest

# Run API tests
python manage.py test catalog.tests.CategoryViewSetTest

# Run with verbosity
python manage.py test --verbosity=2
```

### Test Coverage

The test suite includes:
- **Model Tests**: 15 tests covering model creation, validation, and relationships
- **Serializer Tests**: 5 tests covering serialization and validation
- **API Endpoint Tests**: 25 tests covering all CRUD operations, filtering, search, and pagination
- **Database Constraint Tests**: 2 tests for unique constraints and business rules
- **Environment Configuration Tests**: 4 tests for settings validation

**Total: 54 tests**

### Writing New Tests

Tests are located in `catalog/tests.py`. Follow the existing test structure:

```python
from django.test import TestCase
from rest_framework.test import APITestCase

class MyModelTest(TestCase):
    def setUp(self):
        # Setup test data
        
    def test_something(self):
        # Write your test
        pass
```

## Project Structure

```
backend/
├── catalog/                    # Main application
│   ├── __init__.py
│   ├── admin.py               # Django admin configuration
│   ├── apps.py                # App configuration
│   ├── models.py              # Database models (includes VisitorProfile & ProductView)
│   ├── serializers.py         # DRF serializers
│   ├── tests.py               # Test suite
│   ├── urls.py                # URL routing
│   ├── views.py               # API viewsets (includes tracking endpoints)
│   ├── utils/
│   │   └── geo.py             # IP geolocation helpers for tracking
│   ├── management/
│   │   └── commands/
│   │       └── cleanup_tracking_data.py  # Management command to purge old tracking data
│   └── migrations/            # Database migrations
│       └── 0001_initial.py
├── HomeDar/                   # Project settings
│   ├── __init__.py
│   ├── settings/              # Split settings
│   │   ├── __init__.py
│   │   ├── base.py            # Base settings
│   │   ├── development.py     # Development settings
│   │   └── production.py      # Production settings
│   ├── settings.py            # Backward compatibility
│   ├── urls.py                # Main URL configuration
│   ├── wsgi.py                # WSGI configuration
│   └── asgi.py                # ASGI configuration
├── media/                     # User uploaded files
│   └── products/              # Product images
├── staticfiles/               # Collected static files
├── db.sqlite3                 # SQLite database (development)
├── manage.py                  # Django management script
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not in git)
├── .env.example               # Environment variables template
└── README.md                  # This file
```

### Key Components

#### Models (`catalog/models.py`)
- `Category`: Product categories
- `SubCategory`: Subcategories belonging to categories
- `Product`: Products with title, SKU, price, description
- `ProductImage`: Product images with main image flag
- `ContactUs`: Contact form submissions

#### Serializers (`catalog/serializers.py`)
- `CategorySerializer`: Basic category serialization
- `SubCategorySerializer`: Subcategory with category info
- `ProductListSerializer`: Optimized for list views
- `ProductDetailSerializer`: Full product details
- `ProductImageSerializer`: Image with URL
- `ContactUsSerializer`: Contact form with validation

#### Views (`catalog/views.py`)
- `CategoryViewSet`: List and retrieve categories
- `SubCategoryViewSet`: List and retrieve subcategories
- `ProductViewSet`: List and retrieve products with filtering
- `ProductImageViewSet`: List, retrieve, and update images
- `ContactUsViewSet`: Create contact submissions

## Additional Resources

### API Documentation

- **Swagger UI**: `http://localhost:8000/swagger/`
- **ReDoc**: `http://localhost:8000/redoc/`
- **OpenAPI JSON**: `http://localhost:8000/swagger.json`
- **OpenAPI YAML**: `http://localhost:8000/swagger.yaml`

### Django Admin

Access the admin panel at `http://localhost:8000/admin/` after creating a superuser.

### Useful Commands

```bash
# Create migrations for model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Collect static files (for production)
python manage.py collectstatic

# Open Django shell
python manage.py shell

# Check for issues
python manage.py check

# Show all URLs
python manage.py show_urls  # (requires django-extensions)
```

### Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | Required |
| `DEBUG` | Debug mode | `True` (dev) |
| `DATABASE_URL` | Database connection string | SQLite |
| `DB_NAME` | Database name | SQLite |
| `DB_USER` | Database user | SQLite |
| `DB_PASSWORD` | Database password | SQLite |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `ALLOWED_HOSTS` | Allowed hosts (comma-separated) | `localhost` |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins | Development defaults |

### Troubleshooting

**Issue: Database connection errors**
- Check your `.env` file has correct database credentials
- Ensure PostgreSQL is running (if using PostgreSQL)
- Verify database exists

**Issue: Migration errors**
- Run `python manage.py makemigrations` first
- Check for conflicting migrations
- Consider resetting database in development: delete `db.sqlite3` and re-run migrations

**Issue: Static files not loading**
- Run `python manage.py collectstatic`
- Check `STATIC_ROOT` and `STATIC_URL` settings
- Ensure `DEBUG=True` for development

**Issue: CORS errors**
- Check `CORS_ALLOWED_ORIGINS` in settings
- Verify frontend URL is in allowed origins
- Check `CORS_ALLOW_CREDENTIALS` if using cookies

### Production Deployment

For production deployment:

1. Set `DEBUG=False` in production settings
2. Configure proper `ALLOWED_HOSTS`
3. Use PostgreSQL database
4. Set up proper static file serving (e.g., WhiteNoise, Nginx)
5. Configure media file serving
6. Set up SSL/HTTPS
7. Configure proper CORS origins
8. Set up environment variables securely
9. Use a production WSGI server (e.g., Gunicorn)
10. Set up proper logging

### Support

For issues or questions, please refer to:
- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Project Issues: [GitHub Issues]

---

**Last Updated**: December 2025

