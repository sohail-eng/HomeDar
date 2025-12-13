"""
Database models for HomeDar catalog application.
"""

import uuid
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.core.validators import MinValueValidator, EmailValidator
from django.core.exceptions import ValidationError


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
        validators=[MinValueValidator(0.01)]  # Price must be positive
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
        """Validate that price is positive."""
        if self.price and self.price <= 0:
            raise ValidationError({'price': 'Price must be greater than zero.'})

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
        if not self.is_main and self.pk:
            # If setting this to False, check if it's the only main image
            main_images = ProductImage.objects.filter(
                product=self.product,
                is_main=True
            ).exclude(pk=self.pk)
            if not main_images.exists():
                # This is the only main image, don't allow setting to False
                raise ValidationError(
                    {'is_main': 'At least one image must be marked as main for each product.'}
                )

    def save(self, *args, **kwargs):
        """Override save to ensure at least one main image per product."""
        # If this is a new image and no main image exists for this product, make this one main
        if not self.pk and not self.is_main:
            existing_main = ProductImage.objects.filter(
                product=self.product,
                is_main=True
            ).exists()
            if not existing_main:
                self.is_main = True
        
        self.full_clean()
        
        # Before saving, if this is being set as main, unset all other main images
        if self.is_main and self.pk:
            ProductImage.objects.filter(
                product=self.product,
                is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        
        super().save(*args, **kwargs)
        
        # After saving, if this is main, ensure no other images are main (handles new instances)
        if self.is_main:
            ProductImage.objects.filter(
                product=self.product,
                is_main=True
            ).exclude(pk=self.pk).update(is_main=False)


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


@receiver(pre_delete, sender=ProductImage)
def ensure_main_image_on_delete(sender, instance, **kwargs):
    """Ensure at least one main image remains when deleting a main image."""
    if instance.is_main:
        # Check if there are other images for this product
        other_images = ProductImage.objects.filter(
            product=instance.product
        ).exclude(pk=instance.pk)
        
        if other_images.exists():
            # Set the first other image as main
            first_image = other_images.first()
            first_image.is_main = True
            first_image.save(update_fields=['is_main'])
