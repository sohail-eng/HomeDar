"""
Serializers for HomeDar catalog application.
"""

from rest_framework import serializers

from .models import (
    Category,
    SubCategory,
    Product,
    ProductImage,
    ContactUs,
    ProductView,
    ProductLike,
)


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model with basic fields and subcategories."""
    subcategories = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'subcategories', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_subcategories(self, obj):
        """
        Get list of subcategories for this category.
        Only returns subcategories that have at least one product.
        """
        # Filter subcategories to only include those with products
        subcategories = obj.subcategories.filter(products__isnull=False).distinct()
        return [
            {
                'id': str(sub.id),
                'name': sub.name,
            }
            for sub in subcategories
        ]


class SubCategorySerializer(serializers.ModelSerializer):
    """Serializer for SubCategory model with category information."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.UUIDField(source='category.id', read_only=True)
    
    class Meta:
        model = SubCategory
        fields = ['id', 'name', 'category', 'category_id', 'category_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model with image URL."""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'is_main', 'created_at']
        read_only_fields = ['id', 'image_url', 'created_at']
    
    def get_image_url(self, obj):
        """Get the full URL for the image."""
        request = self.context.get('request')
        if obj.image and hasattr(obj.image, 'url'):
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ProductListSerializer(serializers.ModelSerializer):
    """Optimized serializer for product list view."""
    main_image = serializers.SerializerMethodField()
    main_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'title', 'sku', 'price', 'main_image', 'main_image_url']
        read_only_fields = ['id']
    
    def get_main_image(self, obj):
        """Get the main image object."""
        main_image = obj.images.filter(is_main=True).first()
        if main_image:
            return ProductImageSerializer(main_image, context=self.context).data
        # If no main image, return the first image
        first_image = obj.images.first()
        if first_image:
            return ProductImageSerializer(first_image, context=self.context).data
        return None
    
    def get_main_image_url(self, obj):
        """Get the main image URL directly."""
        main_image = obj.images.filter(is_main=True).first()
        if main_image and main_image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(main_image.image.url)
            return main_image.image.url
        # If no main image, return the first image URL
        first_image = obj.images.first()
        if first_image and first_image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product details serializer with nested relationships."""
    subcategories = SubCategorySerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'sku', 'price', 'description',
            'subcategories', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer with all fields and nested sub-categories and images."""
    subcategories = SubCategorySerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'sku', 'price', 'description',
            'subcategories', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ContactUsSerializer(serializers.ModelSerializer):
    """Serializer for ContactUs model with validation."""
    
    class Meta:
        model = ContactUs
        fields = ['id', 'name', 'phone', 'email', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate_email(self, value):
        """Validate email format."""
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError as DjangoValidationError
        
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Enter a valid email address.")
        return value
    
    def validate_name(self, value):
        """Validate name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()
    
    def validate_message(self, value):
        """Validate message is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()
    
    def validate_phone(self, value):
        """Validate phone is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Phone cannot be empty.")
        return value.strip()


class ProductViewCreateSerializer(serializers.Serializer):
    """
    Serializer for creating ProductView tracking events.

    Accepts:
    - product_id (required, UUID as string)
    - latitude / longitude (optional, from browser geolocation)
    """

    product_id = serializers.UUIDField()
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)

    def validate_product_id(self, value):
        """Ensure the referenced product exists."""
        from .models import Product  # Local import to avoid circular refs

        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")
        # Attach product instance for use in the view
        self.context["product"] = product
        return value


class RecentProductSerializer(ProductListSerializer):
    """
    Serializer for products returned from recent/popular tracking endpoints.

    Inherits from ProductListSerializer so the shape matches the product list page.
    """

    class Meta(ProductListSerializer.Meta):
        model = Product


class ProductLikeToggleSerializer(serializers.Serializer):
    """
    Serializer for toggling product like/unlike.
    
    Accepts:
    - product_id (required, UUID as string)
    """
    
    product_id = serializers.UUIDField()
    
    def validate_product_id(self, value):
        """Ensure the referenced product exists."""
        from .models import Product  # Local import to avoid circular refs
        
        try:
            product = Product.objects.get(id=value)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found.")
        # Attach product instance for use in the view
        self.context["product"] = product
        return value


