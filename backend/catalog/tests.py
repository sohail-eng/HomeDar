"""
Comprehensive test suite for HomeDar catalog application.
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from decimal import Decimal
import uuid
from .models import Category, SubCategory, Product, ProductImage, ContactUs
from .serializers import (
    CategorySerializer,
    SubCategorySerializer,
    ProductSerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ContactUsSerializer,
)


# ==================== Model Tests ====================

class CategoryModelTest(TestCase):
    """Test cases for Category model."""
    
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
    
    def test_category_creation(self):
        """Test creating a category."""
        self.assertIsNotNone(self.category.id)
        self.assertEqual(self.category.name, "Electronics")
        self.assertIsNotNone(self.category.created_at)
        self.assertIsNotNone(self.category.updated_at)
    
    def test_category_str(self):
        """Test category string representation."""
        self.assertEqual(str(self.category), "Electronics")
    
    def test_category_unique_name(self):
        """Test that category names must be unique."""
        with self.assertRaises(Exception):
            Category.objects.create(name="Electronics")
    
    def test_category_ordering(self):
        """Test category ordering by name."""
        Category.objects.create(name="Books")
        Category.objects.create(name="Clothing")
        categories = list(Category.objects.all())
        self.assertEqual(categories[0].name, "Books")
        self.assertEqual(categories[1].name, "Clothing")
        self.assertEqual(categories[2].name, "Electronics")


class SubCategoryModelTest(TestCase):
    """Test cases for SubCategory model."""
    
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.subcategory = SubCategory.objects.create(
            name="Laptops",
            category=self.category
        )
    
    def test_subcategory_creation(self):
        """Test creating a subcategory."""
        self.assertIsNotNone(self.subcategory.id)
        self.assertEqual(self.subcategory.name, "Laptops")
        self.assertEqual(self.subcategory.category, self.category)
        self.assertIsNotNone(self.subcategory.created_at)
        self.assertIsNotNone(self.subcategory.updated_at)
    
    def test_subcategory_str(self):
        """Test subcategory string representation."""
        self.assertEqual(str(self.subcategory), "Electronics - Laptops")
    
    def test_subcategory_unique_within_category(self):
        """Test that subcategory names must be unique within a category."""
        with self.assertRaises(Exception):
            SubCategory.objects.create(name="Laptops", category=self.category)
    
    def test_subcategory_same_name_different_category(self):
        """Test that same name can exist in different categories."""
        category2 = Category.objects.create(name="Books")
        SubCategory.objects.create(name="Laptops", category=category2)
        self.assertEqual(SubCategory.objects.filter(name="Laptops").count(), 2)
    
    def test_subcategory_cascade_delete(self):
        """Test that subcategories are deleted when category is deleted."""
        category_id = self.category.id
        SubCategory.objects.create(name="Phones", category=self.category)
        self.category.delete()
        self.assertEqual(SubCategory.objects.filter(category_id=category_id).count(), 0)


class ProductModelTest(TestCase):
    """Test cases for Product model."""
    
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.subcategory = SubCategory.objects.create(
            name="Laptops",
            category=self.category
        )
        self.product = Product.objects.create(
            title="MacBook Pro",
            sku="MBP-001",
            price=Decimal("1999.99"),
            description="High-end laptop"
        )
        self.product.subcategories.add(self.subcategory)
    
    def test_product_creation(self):
        """Test creating a product."""
        self.assertIsNotNone(self.product.id)
        self.assertEqual(self.product.title, "MacBook Pro")
        self.assertEqual(self.product.sku, "MBP-001")
        self.assertEqual(self.product.price, Decimal("1999.99"))
        self.assertEqual(self.product.description, "High-end laptop")
        self.assertIsNotNone(self.product.created_at)
        self.assertIsNotNone(self.product.updated_at)
    
    def test_product_str(self):
        """Test product string representation."""
        self.assertEqual(str(self.product), "MacBook Pro (MBP-001)")
    
    def test_product_unique_sku(self):
        """Test that product SKU must be unique."""
        with self.assertRaises(Exception):
            Product.objects.create(
                title="Another MacBook",
                sku="MBP-001",
                price=Decimal("1999.99")
            )
    
    def test_product_price_validation(self):
        """Test that product price must be positive."""
        product = Product(
            title="Test Product",
            sku="TEST-001",
            price=Decimal("-10.00")
        )
        with self.assertRaises(ValidationError):
            product.full_clean()
    
    def test_product_price_minimum(self):
        """Test that product price must be at least 0.01."""
        product = Product(
            title="Test Product",
            sku="TEST-001",
            price=Decimal("0.00")
        )
        with self.assertRaises(ValidationError):
            product.full_clean()
    
    def test_product_subcategories_relationship(self):
        """Test product-subcategory relationship."""
        subcategory2 = SubCategory.objects.create(
            name="Phones",
            category=self.category
        )
        self.product.subcategories.add(subcategory2)
        self.assertEqual(self.product.subcategories.count(), 2)


class ProductImageModelTest(TestCase):
    """Test cases for ProductImage model."""
    
    def setUp(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            title="Test Product",
            sku="TEST-001",
            price=Decimal("99.99")
        )
        # Create a simple test image
        self.test_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01',
            content_type='image/jpeg'
        )
    
    def test_product_image_creation(self):
        """Test creating a product image."""
        image = ProductImage.objects.create(
            product=self.product,
            image=self.test_image,
            is_main=True
        )
        self.assertIsNotNone(image.id)
        self.assertEqual(image.product, self.product)
        self.assertTrue(image.is_main)
        self.assertIsNotNone(image.created_at)
    
    def test_product_image_str(self):
        """Test product image string representation."""
        image = ProductImage.objects.create(
            product=self.product,
            image=self.test_image,
            is_main=True
        )
        self.assertIn("Main", str(image))
    
    def test_one_main_image_per_product(self):
        """Test that only one image can be main per product."""
        image1 = ProductImage.objects.create(
            product=self.product,
            image=self.test_image,
            is_main=True
        )
        image2 = ProductImage.objects.create(
            product=self.product,
            image=self.test_image,
            is_main=False
        )
        # Set image2 as main - should unset image1 (handled by signal)
        image2.is_main = True
        image2.save()
        
        image1.refresh_from_db()
        self.assertFalse(image1.is_main)
        self.assertTrue(image2.is_main)
    
    def test_at_least_one_main_image(self):
        """Test that at least one image must be main (validation prevents unsetting)."""
        image1 = ProductImage.objects.create(
            product=self.product,
            image=self.test_image,
            is_main=True
        )
        image2 = ProductImage.objects.create(
            product=self.product,
            image=self.test_image,
            is_main=False
        )
        # Try to unset the only main image - validation should prevent this
        image1.is_main = False
        with self.assertRaises(ValidationError):
            image1.full_clean()
        
        # Verify image1 is still main
        image1.refresh_from_db()
        self.assertTrue(image1.is_main)


class ContactUsModelTest(TestCase):
    """Test cases for ContactUs model."""
    
    def setUp(self):
        self.contact = ContactUs.objects.create(
            name="John Doe",
            phone="1234567890",
            email="john@example.com",
            message="Test message"
        )
    
    def test_contact_creation(self):
        """Test creating a contact form submission."""
        self.assertIsNotNone(self.contact.id)
        self.assertEqual(self.contact.name, "John Doe")
        self.assertEqual(self.contact.phone, "1234567890")
        self.assertEqual(self.contact.email, "john@example.com")
        self.assertEqual(self.contact.message, "Test message")
        self.assertIsNotNone(self.contact.created_at)
    
    def test_contact_str(self):
        """Test contact string representation."""
        self.assertIn("John Doe", str(self.contact))
        self.assertIn("john@example.com", str(self.contact))
    
    def test_contact_email_validation(self):
        """Test email validation."""
        contact = ContactUs(
            name="Test",
            phone="1234567890",
            email="invalid-email",
            message="Test"
        )
        with self.assertRaises(ValidationError):
            contact.full_clean()


# ==================== Serializer Tests ====================

class CategorySerializerTest(TestCase):
    """Test cases for CategorySerializer."""
    
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
    
    def test_category_serializer(self):
        """Test CategorySerializer serialization."""
        serializer = CategorySerializer(self.category)
        data = serializer.data
        self.assertEqual(data['name'], "Electronics")
        self.assertIn('id', data)
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)
    
    def test_category_serializer_deserialization(self):
        """Test CategorySerializer deserialization."""
        data = {'name': 'Books'}
        serializer = CategorySerializer(data=data)
        self.assertTrue(serializer.is_valid())
        category = serializer.save()
        self.assertEqual(category.name, "Books")


class SubCategorySerializerTest(TestCase):
    """Test cases for SubCategorySerializer."""
    
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.subcategory = SubCategory.objects.create(
            name="Laptops",
            category=self.category
        )
    
    def test_subcategory_serializer(self):
        """Test SubCategorySerializer serialization."""
        serializer = SubCategorySerializer(self.subcategory)
        data = serializer.data
        self.assertEqual(data['name'], "Laptops")
        self.assertEqual(data['category_name'], "Electronics")
        self.assertIn('category_id', data)
        self.assertIn('id', data)


class ProductSerializerTest(TestCase):
    """Test cases for Product serializers."""
    
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.subcategory = SubCategory.objects.create(
            name="Laptops",
            category=self.category
        )
        self.product = Product.objects.create(
            title="MacBook Pro",
            sku="MBP-001",
            price=Decimal("1999.99"),
            description="High-end laptop"
        )
        self.product.subcategories.add(self.subcategory)
    
    def test_product_list_serializer(self):
        """Test ProductListSerializer."""
        serializer = ProductListSerializer(self.product)
        data = serializer.data
        self.assertEqual(data['title'], "MacBook Pro")
        self.assertEqual(data['sku'], "MBP-001")
        self.assertEqual(float(data['price']), 1999.99)
        self.assertIn('id', data)
    
    def test_product_detail_serializer(self):
        """Test ProductDetailSerializer."""
        serializer = ProductDetailSerializer(self.product)
        data = serializer.data
        self.assertEqual(data['title'], "MacBook Pro")
        self.assertEqual(len(data['subcategories']), 1)
        self.assertIn('images', data)


class ContactUsSerializerTest(TestCase):
    """Test cases for ContactUsSerializer."""
    
    def test_contact_serializer_validation(self):
        """Test ContactUsSerializer validation."""
        # Valid data
        data = {
            'name': 'John Doe',
            'phone': '1234567890',
            'email': 'john@example.com',
            'message': 'Test message'
        }
        serializer = ContactUsSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        # Invalid email
        data['email'] = 'invalid-email'
        serializer = ContactUsSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        
        # Empty name
        data['email'] = 'john@example.com'
        data['name'] = ''
        serializer = ContactUsSerializer(data=data)
        self.assertFalse(serializer.is_valid())


# ==================== API Endpoint Tests ====================

class CategoryViewSetTest(APITestCase):
    """Test cases for CategoryViewSet."""
    
    def setUp(self):
        self.client = APIClient()
        Category.objects.create(name="Electronics")
        Category.objects.create(name="Books")
        Category.objects.create(name="Clothing")
    
    def test_list_categories(self):
        """Test listing all categories."""
        response = self.client.get('/api/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_retrieve_category(self):
        """Test retrieving a single category."""
        category = Category.objects.first()
        response = self.client.get(f'/api/categories/{category.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], category.name)
    
    def test_filter_categories_by_name(self):
        """Test filtering categories by name."""
        response = self.client.get('/api/categories/?name=Electronics')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], "Electronics")
    
    def test_order_categories(self):
        """Test ordering categories."""
        response = self.client.get('/api/categories/?ordering=name')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [cat['name'] for cat in response.data['results']]
        self.assertEqual(names, sorted(names))


class SubCategoryViewSetTest(APITestCase):
    """Test cases for SubCategoryViewSet."""
    
    def setUp(self):
        self.client = APIClient()
        self.category1 = Category.objects.create(name="Electronics")
        self.category2 = Category.objects.create(name="Books")
        self.subcat1 = SubCategory.objects.create(name="Laptops", category=self.category1)
        self.subcat2 = SubCategory.objects.create(name="Phones", category=self.category1)
        self.subcat3 = SubCategory.objects.create(name="Fiction", category=self.category2)
    
    def test_list_subcategories(self):
        """Test listing all subcategories."""
        response = self.client.get('/api/subcategories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_filter_subcategories_by_category(self):
        """Test filtering subcategories by category."""
        response = self.client.get(f'/api/subcategories/?category={self.category1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_subcategory(self):
        """Test retrieving a single subcategory."""
        response = self.client.get(f'/api/subcategories/{self.subcat1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Laptops")
        self.assertEqual(response.data['category_name'], "Electronics")


class ProductViewSetTest(APITestCase):
    """Test cases for ProductViewSet."""
    
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Electronics")
        self.subcat1 = SubCategory.objects.create(name="Laptops", category=self.category)
        self.subcat2 = SubCategory.objects.create(name="Phones", category=self.category)
        
        self.product1 = Product.objects.create(
            title="MacBook Pro",
            sku="MBP-001",
            price=Decimal("1999.99"),
            description="High-end laptop"
        )
        self.product1.subcategories.add(self.subcat1)
        
        self.product2 = Product.objects.create(
            title="iPhone 15",
            sku="IPH-001",
            price=Decimal("999.99"),
            description="Latest iPhone"
        )
        self.product2.subcategories.add(self.subcat2)
        
        self.product3 = Product.objects.create(
            title="Dell Laptop",
            sku="DEL-001",
            price=Decimal("799.99"),
            description="Budget laptop"
        )
        self.product3.subcategories.add(self.subcat1)
    
    def test_list_products(self):
        """Test listing all products."""
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_retrieve_product(self):
        """Test retrieving a single product."""
        response = self.client.get(f'/api/products/{self.product1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], "MacBook Pro")
        self.assertEqual(len(response.data['subcategories']), 1)
    
    def test_filter_by_sku(self):
        """Test filtering products by SKU."""
        response = self.client.get('/api/products/?sku=MBP-001')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['sku'], "MBP-001")
    
    def test_filter_by_price_range(self):
        """Test filtering products by price range."""
        response = self.client.get('/api/products/?min_price=800&max_price=1500')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return products with price between 800 and 1500
        prices = [float(p['price']) for p in response.data['results']]
        self.assertTrue(all(800 <= p <= 1500 for p in prices))
    
    def test_search_by_title(self):
        """Test searching products by title."""
        response = self.client.get('/api/products/?search=MacBook')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertIn("MacBook", response.data['results'][0]['title'])
    
    def test_filter_by_subcategories(self):
        """Test filtering products by subcategories."""
        response = self.client.get(f'/api/products/?subcategories={self.subcat1.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should return products with subcat1
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_order_by_price_ascending(self):
        """Test ordering products by price ascending."""
        response = self.client.get('/api/products/?ordering=price')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [float(p['price']) for p in response.data['results']]
        self.assertEqual(prices, sorted(prices))
    
    def test_order_by_price_descending(self):
        """Test ordering products by price descending."""
        response = self.client.get('/api/products/?ordering=-price')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prices = [float(p['price']) for p in response.data['results']]
        self.assertEqual(prices, sorted(prices, reverse=True))
    
    def test_pagination(self):
        """Test product pagination."""
        # Create more products to test pagination
        for i in range(25):
            Product.objects.create(
                title=f"Product {i}",
                sku=f"PROD-{i:03d}",
                price=Decimal("99.99")
            )
        
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)
        self.assertEqual(len(response.data['results']), 20)  # Default page size


class ContactUsViewSetTest(APITestCase):
    """Test cases for ContactUsViewSet."""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_create_contact(self):
        """Test creating a contact form submission."""
        data = {
            'name': 'John Doe',
            'phone': '1234567890',
            'email': 'john@example.com',
            'message': 'Test message'
        }
        response = self.client.post('/api/contact-us/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
        self.assertEqual(ContactUs.objects.count(), 1)
    
    def test_create_contact_invalid_email(self):
        """Test creating contact with invalid email."""
        data = {
            'name': 'John Doe',
            'phone': '1234567890',
            'email': 'invalid-email',
            'message': 'Test message'
        }
        response = self.client.post('/api/contact-us/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_contact_empty_fields(self):
        """Test creating contact with empty required fields."""
        data = {
            'name': '',
            'phone': '1234567890',
            'email': 'john@example.com',
            'message': 'Test message'
        }
        response = self.client.post('/api/contact-us/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_contact_only_post_allowed(self):
        """Test that only POST is allowed for contact endpoint."""
        response = self.client.get('/api/contact-us/')
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)


# ==================== Database Constraint Tests ====================

class DatabaseConstraintTest(TestCase):
    """Test cases for database constraints."""
    
    def test_unique_sku_constraint(self):
        """Test that SKU must be unique."""
        Product.objects.create(
            title="Product 1",
            sku="UNIQUE-SKU",
            price=Decimal("99.99")
        )
        with self.assertRaises(Exception):
            Product.objects.create(
                title="Product 2",
                sku="UNIQUE-SKU",
                price=Decimal("99.99")
            )
    
    def test_one_main_image_per_product(self):
        """Test that only one main image exists per product."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        product = Product.objects.create(
            title="Test Product",
            sku="TEST-001",
            price=Decimal("99.99")
        )
        
        test_image = SimpleUploadedFile(
            name='test_image.jpg',
            content=b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01',
            content_type='image/jpeg'
        )
        
        # Create first main image
        image1 = ProductImage.objects.create(
            product=product,
            image=test_image,
            is_main=True
        )
        
        # Create second image and set as main
        image2 = ProductImage.objects.create(
            product=product,
            image=test_image,
            is_main=False
        )
        image2.is_main = True
        image2.save()
        
        # Refresh and verify only one is main
        image1.refresh_from_db()
        image2.refresh_from_db()
        main_images = ProductImage.objects.filter(product=product, is_main=True)
        self.assertEqual(main_images.count(), 1)
        self.assertTrue(image2.is_main)
        self.assertFalse(image1.is_main)


# ==================== Environment Configuration Tests ====================

class EnvironmentConfigurationTest(TestCase):
    """Test cases for environment-based configuration."""
    
    def test_sqlite_database_default(self):
        """Test that SQLite is used by default."""
        from django.conf import settings
        self.assertEqual(settings.DATABASES['default']['ENGINE'], 'django.db.backends.sqlite3')
    
    def test_debug_setting(self):
        """Test that DEBUG setting is accessible."""
        from django.conf import settings
        self.assertIsInstance(settings.DEBUG, bool)
    
    def test_media_url_setting(self):
        """Test that MEDIA_URL is configured."""
        from django.conf import settings
        self.assertEqual(settings.MEDIA_URL, '/media/')
    
    def test_static_url_setting(self):
        """Test that STATIC_URL is configured."""
        from django.conf import settings
        self.assertEqual(settings.STATIC_URL, '/static/')
