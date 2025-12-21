"""
Database models for HomeDar catalog application.
"""

import uuid
from decimal import Decimal

from django.contrib.auth.hashers import make_password, check_password
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator, MinValueValidator
from django.db import models
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver


class TimeStampedModel(models.Model):
    """Abstract base model with created_at and updated_at timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(TimeStampedModel):
    """Category model for product categorization."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class SubCategory(TimeStampedModel):
    """SubCategory model - belongs to a Category."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='subcategories'
    )

    class Meta:
        verbose_name = 'SubCategory'
        verbose_name_plural = 'SubCategories'
        ordering = ['category', 'name']
        unique_together = [['name', 'category']]  # Ensure unique name within a category

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Product(TimeStampedModel):
    """Product model with basic information and relationships."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]  # Price must be positive
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],  # Discount price must be positive
        help_text="Wholesale/discount price for logged-in users. If set, this will be shown to authenticated users."
    )
    description = models.TextField(blank=True)
    subcategories = models.ManyToManyField(
        SubCategory,
        related_name='products',
        blank=True
    )

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']  # Newest first by default
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.sku})"

    def clean(self):
        """Validate that price is positive and discount_price is less than price if set."""
        if self.price and self.price <= 0:
            raise ValidationError({'price': 'Price must be greater than zero.'})
        if self.discount_price and self.discount_price <= 0:
            raise ValidationError({'discount_price': 'Discount price must be greater than zero.'})
        if self.discount_price and self.price and self.discount_price >= self.price:
            raise ValidationError({'discount_price': 'Discount price must be less than regular price.'})

    def save(self, *args, **kwargs):
        """Override save to call clean validation."""
        self.full_clean()
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    """ProductImage model for storing product images."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(upload_to='products/')
    is_main = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['-is_main', 'created_at']  # Main images first

    def __str__(self):
        main_status = "Main" if self.is_main else "Secondary"
        return f"{self.product.title} - {main_status} Image"

    def clean(self):
        """Validate that at least one main image exists per product."""
        # Only validate if the product has been saved (has a primary key)
        if not self.is_main and self.pk and self.product.pk:
            # If setting this to False, check if it's the only main image
            main_images = ProductImage.objects.filter(
                product_id=self.product.pk,
                is_main=True
            ).exclude(pk=self.pk)
            if not main_images.exists():
                # This is the only main image, don't allow setting to False
                raise ValidationError(
                    {'is_main': 'At least one image must be marked as main for each product.'}
                )

    def save(self, *args, **kwargs):
        """Override save to call clean validation."""
        self.full_clean()
        super().save(*args, **kwargs)


class ContactUs(models.Model):
    """ContactUs model for storing contact form submissions."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20)
    email = models.EmailField(validators=[EmailValidator()])
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Contact Us'
        verbose_name_plural = 'Contact Us'
        ordering = ['-created_at']  # Newest first

    def __str__(self):
        return f"Contact from {self.name} ({self.email})"

    def clean(self):
        """Validate email format."""
        if self.email:
            EmailValidator()(self.email)

    def save(self, *args, **kwargs):
        """Override save to call clean validation."""
        self.full_clean()
        super().save(*args, **kwargs)


class VisitorProfile(models.Model):
    """
    Anonymous visitor profile for tracking product views and approximate location.

    This model is intentionally minimal and does not store any PII – only:
    - an anonymous visitor_id (UUID as string)
    - high-level location information derived from IP / browser geolocation
    """

    visitor_id = models.CharField(
        max_length=64,
        primary_key=True,
        help_text="Anonymous visitor identifier (UUID stored as string).",
    )
    first_seen = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when this visitor was first seen.",
    )
    last_seen = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when this visitor was last seen.",
    )
    last_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Last IP address observed for this visitor (for geolocation).",
    )
    country = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="Country name (e.g. 'Pakistan', 'United States').",
    )
    city = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="City or region name derived from geolocation.",
    )
    latitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Approximate latitude (rounded, optional).",
    )
    longitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Approximate longitude (rounded, optional).",
    )

    class Meta:
        verbose_name = "Visitor Profile"
        verbose_name_plural = "Visitor Profiles"
        ordering = ["-last_seen"]

    def __str__(self) -> str:
        return f"Visitor {self.visitor_id}"


class ProductView(models.Model):
    """
    A single view of a product by an anonymous visitor.

    This is the core tracking event we will aggregate for:
    - recently viewed products per visitor
    - popular products by location / timeframe
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    visitor = models.ForeignKey(
        VisitorProfile,
        on_delete=models.CASCADE,
        related_name="product_views",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="views",
    )
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the product was viewed.",
    )
    country = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="Country name at time of view (copied from visitor, if available).",
    )
    city = models.CharField(
        max_length=128,
        null=True,
        blank=True,
        help_text="City/region at time of view (copied from visitor, if available).",
    )
    latitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Latitude at time of view (optional, rounded).",
    )
    longitude = models.FloatField(
        null=True,
        blank=True,
        help_text="Longitude at time of view (optional, rounded).",
    )
    user_agent = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text="Optional truncated user agent string for device-level insights.",
    )

    class Meta:
        verbose_name = "Product View"
        verbose_name_plural = "Product Views"
        ordering = ["-viewed_at"]
        indexes = [
            models.Index(fields=["visitor", "viewed_at"]),
            models.Index(fields=["product", "viewed_at"]),
            models.Index(fields=["country", "viewed_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.visitor_id_display} viewed {self.product} at {self.viewed_at}"

    @property
    def visitor_id_display(self) -> str:
        """
        Shortened visitor id for readability (first 8 chars if UUID-like).
        """
        if not self.visitor or not self.visitor.visitor_id:
            return "unknown"
        return str(self.visitor.visitor_id)[:8]


class ProductLike(models.Model):
    """
    A like on a product by an anonymous visitor.
    
    Each visitor can like a product only once (enforced by unique_together).
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    visitor = models.ForeignKey(
        VisitorProfile,
        on_delete=models.CASCADE,
        related_name="product_likes",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="likes",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the product was liked.",
    )

    class Meta:
        verbose_name = "Product Like"
        verbose_name_plural = "Product Likes"
        ordering = ["-created_at"]
        unique_together = [["visitor", "product"]]
        indexes = [
            models.Index(fields=["visitor", "created_at"]),
            models.Index(fields=["product", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.visitor_id_display} liked {self.product}"

    @property
    def visitor_id_display(self) -> str:
        """
        Shortened visitor id for readability (first 8 chars if UUID-like).
        """
        if not self.visitor or not self.visitor.visitor_id:
            return "unknown"
        return str(self.visitor.visitor_id)[:8]


class ProductReview(models.Model):
    """
    A review for a product by an anonymous visitor.
    
    - name is optional (can be anonymous)
    - review_text is required
    - Each visitor can leave multiple reviews for different products
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    visitor = models.ForeignKey(
        VisitorProfile,
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    name = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Optional reviewer name (can be anonymous).",
    )
    review_text = models.TextField(
        help_text="Review content (required).",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the review was created.",
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the review was last updated.",
    )

    class Meta:
        verbose_name = "Product Review"
        verbose_name_plural = "Product Reviews"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["product", "created_at"]),
            models.Index(fields=["visitor", "created_at"]),
        ]

    def __str__(self) -> str:
        reviewer_name = self.name or "Anonymous"
        return f"{reviewer_name} reviewed {self.product}"

    @property
    def reviewer_name(self) -> str:
        """Return reviewer name or 'Anonymous' if not provided."""
        return self.name or "Anonymous"


class User(TimeStampedModel):
    """
    User model for authentication and user accounts.
    
    Links to VisitorProfile to enable cross-device synchronization
    of tracking data (product views, likes, etc.).
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    first_name = models.CharField(
        max_length=100,
        help_text="User's first name.",
    )
    last_name = models.CharField(
        max_length=100,
        help_text="User's last name.",
    )
    username = models.CharField(
        max_length=150,
        unique=True,
        db_index=True,
        help_text="Unique username for login.",
    )
    email = models.EmailField(
        unique=True,
        db_index=True,
        validators=[EmailValidator()],
        help_text="User's email address (must be unique).",
    )
    password = models.CharField(
        max_length=128,
        help_text="Hashed password (never store plain text).",
    )
    visitor = models.ForeignKey(
        VisitorProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user',
        help_text="Linked visitor profile for cross-device tracking synchronization.",
    )
    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['visitor']),
        ]
    
    def __str__(self) -> str:
        return self.username or self.email
    
    def get_full_name(self) -> str:
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
    
    def set_password(self, raw_password: str) -> None:
        """Hash and set the user's password."""
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password: str) -> bool:
        """Check if the provided password matches the user's password."""
        return check_password(raw_password, self.password)
    
    @property
    def is_authenticated(self) -> bool:
        """
        Always return True for authenticated users.
        This is required for Django REST Framework permissions.
        """
        return True
    
    @property
    def is_anonymous(self) -> bool:
        """
        Always return False for authenticated users.
        This is required for Django REST Framework permissions.
        """
        return False
    
    def save(self, *args, **kwargs):
        """Override save to ensure password is hashed if it's not already."""
        # If password is provided and not already hashed, hash it
        if self.password and not self.password.startswith('pbkdf2_') and not self.password.startswith('bcrypt'):
            self.set_password(self.password)
        super().save(*args, **kwargs)


class SecurityQuestion(TimeStampedModel):
    """
    Security questions for password recovery.
    
    Each user must have exactly 3 security questions (enforced by unique_together).
    Answers are stored as hashes for security.
    """
    
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='security_questions',
        help_text="User who owns this security question.",
    )
    question_text = models.CharField(
        max_length=255,
        help_text="The security question text.",
    )
    answer_hash = models.CharField(
        max_length=255,
        help_text="Hashed answer to the security question (never store plain text).",
    )
    question_order = models.IntegerField(
        choices=[(1, 'Question 1'), (2, 'Question 2'), (3, 'Question 3')],
        help_text="Order of this question (1, 2, or 3). Each user must have exactly 3 questions.",
    )
    
    class Meta:
        verbose_name = "Security Question"
        verbose_name_plural = "Security Questions"
        unique_together = [['user', 'question_order']]
        indexes = [
            models.Index(fields=['user', 'question_order']),
        ]
    
    def __str__(self) -> str:
        return f"{self.user.username} - Question {self.question_order}"
    
    def set_answer(self, raw_answer: str) -> None:
        """Hash and set the security question answer."""
        # Normalize answer (trim whitespace, lowercase) for consistency
        normalized_answer = raw_answer.strip().lower()
        self.answer_hash = make_password(normalized_answer)
    
    def check_answer(self, raw_answer: str) -> bool:
        """Check if the provided answer matches the stored hash."""
        # Normalize answer for comparison
        normalized_answer = raw_answer.strip().lower()
        return check_password(normalized_answer, self.answer_hash)
    
    def save(self, *args, **kwargs):
        """Override save to ensure answer is hashed if it's not already."""
        # If answer_hash looks like plain text, hash it
        # Note: This assumes answer_hash is set via set_answer() method
        # If answer_hash is provided directly and not hashed, we can't detect it
        # So it's better to always use set_answer() method
        super().save(*args, **kwargs)


@receiver(post_save, sender=ProductImage)
def ensure_main_image_after_save(sender, instance, created, **kwargs):
    """Ensure at least one main image exists per product after saving."""
    if instance.product.pk:
        # If this image is set as main, unset all other main images
        if instance.is_main:
            ProductImage.objects.filter(
                product_id=instance.product.pk,
                is_main=True
            ).exclude(pk=instance.pk).update(is_main=False)
        
        # If no main image exists for this product, set the first image as main
        main_images = ProductImage.objects.filter(
            product_id=instance.product.pk,
            is_main=True
        )
        if not main_images.exists():
            first_image = ProductImage.objects.filter(
                product_id=instance.product.pk
            ).first()
            if first_image:
                first_image.is_main = True
                first_image.save(update_fields=['is_main'])


@receiver(pre_delete, sender=ProductImage)
def ensure_main_image_on_delete(sender, instance, **kwargs):
    """Ensure at least one main image remains when deleting a main image."""
    if instance.is_main and instance.product.pk:
        # Check if there are other images for this product
        other_images = ProductImage.objects.filter(
            product_id=instance.product.pk
        ).exclude(pk=instance.pk)
        
        if other_images.exists():
            # Set the first other image as main
            first_image = other_images.first()
            first_image.is_main = True
            first_image.save(update_fields=['is_main'])
