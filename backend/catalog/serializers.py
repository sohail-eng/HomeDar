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
    ProductReview,
    User,
    SecurityQuestion,
    VisitorProfile,
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
    discount_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'title', 'sku', 'price', 'discount_price', 'main_image', 'main_image_url']
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
    
    def get_discount_price(self, obj):
        """Get discount price only for authenticated users."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return str(obj.discount_price) if obj.discount_price else None
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full product details serializer with nested relationships."""
    subcategories = SubCategorySerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    discount_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'sku', 'price', 'discount_price', 'description',
            'subcategories', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_discount_price(self, obj):
        """Get discount price only for authenticated users."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return str(obj.discount_price) if obj.discount_price else None
        return None


class ProductSerializer(serializers.ModelSerializer):
    """Product serializer with all fields and nested sub-categories and images."""
    subcategories = SubCategorySerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    discount_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'sku', 'price', 'discount_price', 'description',
            'subcategories', 'images', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_discount_price(self, obj):
        """Get discount price only for authenticated users."""
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return str(obj.discount_price) if obj.discount_price else None
        return None


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


class ProductReviewSerializer(serializers.ModelSerializer):
    """
    Serializer for ProductReview model.
    Used for listing reviews (read-only fields).
    """
    reviewer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = ['id', 'reviewer_name', 'review_text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_reviewer_name(self, obj):
        """Return reviewer name or 'Anonymous' if not provided."""
        return obj.reviewer_name


class ProductReviewCreateSerializer(serializers.Serializer):
    """
    Serializer for creating ProductReview.
    
    Accepts:
    - name (optional, string)
    - review_text (required, string)
    """
    
    name = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    review_text = serializers.CharField(
        required=True,
        allow_blank=False,
    )
    
    def validate_review_text(self, value):
        """Ensure review text is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Review text cannot be empty.")
        return value.strip()
    
    def validate_name(self, value):
        """Clean name if provided."""
        if value:
            return value.strip()
        return None


# ============================================================================
# Authentication Serializers
# ============================================================================

class SecurityQuestionSerializer(serializers.Serializer):
    """
    Serializer for security question data during signup.
    
    Accepts:
    - question_text (required, string, max 255 chars)
    - answer (required, string, max 100 chars) - will be hashed
    - question_order (required, integer: 1, 2, or 3)
    """
    
    question_text = serializers.CharField(max_length=255, required=True)
    answer = serializers.CharField(required=True, write_only=True, max_length=100)
    question_order = serializers.IntegerField(required=True)
    
    def validate_question_order(self, value):
        """Ensure question_order is 1, 2, or 3."""
        if value not in [1, 2, 3]:
            raise serializers.ValidationError("Question order must be 1, 2, or 3.")
        return value
    
    def validate_question_text(self, value):
        """Validate and sanitize question text."""
        if not value or not value.strip():
            raise serializers.ValidationError("Question text cannot be empty.")
        value = value.strip()
        if len(value) > 255:
            raise serializers.ValidationError("Question text must be at most 255 characters long.")
        return value
    
    def validate_answer(self, value):
        """Validate and sanitize answer."""
        if not value or not value.strip():
            raise serializers.ValidationError("Answer cannot be empty.")
        value = value.strip()
        if len(value) > 100:
            raise serializers.ValidationError("Answer must be at most 100 characters long.")
        return value


class UserSignupSerializer(serializers.Serializer):
    """
    Serializer for user signup.
    
    Accepts:
    - first_name (required)
    - last_name (required)
    - username (required, unique)
    - email (required, unique, valid format)
    - password (required, will be validated for strength)
    - visitor_id (optional, UUID string)
    - security_questions (required, array of 3 SecurityQuestionSerializer objects)
    """
    
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    
    def validate_first_name(self, value):
        """Sanitize first name."""
        if not value or not value.strip():
            raise serializers.ValidationError("First name cannot be empty.")
        return value.strip()
    
    def validate_last_name(self, value):
        """Sanitize last name."""
        if not value or not value.strip():
            raise serializers.ValidationError("Last name cannot be empty.")
        return value.strip()
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    visitor_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    security_questions = SecurityQuestionSerializer(many=True, required=True)
    
    def validate_username(self, value):
        """Validate username format, uniqueness, and sanitize."""
        if not value or not value.strip():
            raise serializers.ValidationError("Username cannot be empty.")
        
        # Sanitize: trim whitespace
        value = value.strip()
        
        # Validate format: alphanumeric + underscore, min 3 chars, max 150
        import re
        if len(value) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        if len(value) > 150:
            raise serializers.ValidationError("Username must be at most 150 characters long.")
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores.")
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate_email(self, value):
        """Validate email format, uniqueness, and sanitize."""
        if not value or not value.strip():
            raise serializers.ValidationError("Email cannot be empty.")
        
        # Sanitize: trim whitespace and lowercase
        value = value.strip().lower()
        
        # Validate email format using Django's EmailValidator
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_email(value)
        except DjangoValidationError:
            raise serializers.ValidationError("Enter a valid email address.")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_password(self, value):
        """Validate password strength according to requirements."""
        if not value:
            raise serializers.ValidationError("Password cannot be empty.")
        
        # Minimum 8 characters
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # At least one uppercase letter
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        
        # At least one lowercase letter
        if not any(c.islower() for c in value):
            raise serializers.ValidationError("Password must contain at least one lowercase letter.")
        
        # At least one number
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        
        # Optional: at least one special character (recommended)
        import string
        special_chars = set(string.punctuation)
        if not any(c in special_chars for c in value):
            # This is optional, so we'll just log a warning but not fail
            pass
        
        return value
    
    def validate_security_questions(self, value):
        """Validate that exactly 3 security questions are provided with unique question_order."""
        if len(value) != 3:
            raise serializers.ValidationError("Exactly 3 security questions are required.")
        
        question_orders = [q.get('question_order') for q in value]
        if len(set(question_orders)) != 3:
            raise serializers.ValidationError("Each security question must have a unique order (1, 2, or 3).")
        
        if set(question_orders) != {1, 2, 3}:
            raise serializers.ValidationError("Security questions must have orders 1, 2, and 3.")
        
        # Validate each question text and answer
        for sq_data in value:
            question_text = sq_data.get('question_text', '').strip()
            answer = sq_data.get('answer', '').strip()
            
            # Validate question text length (max 255 chars)
            if not question_text:
                raise serializers.ValidationError("Security question text cannot be empty.")
            if len(question_text) > 255:
                raise serializers.ValidationError("Security question text must be at most 255 characters long.")
            
            # Validate answer length (max 100 chars)
            if not answer:
                raise serializers.ValidationError("Security question answer cannot be empty.")
            if len(answer) > 100:
                raise serializers.ValidationError("Security question answer must be at most 100 characters long.")
            
            # Sanitize: update the values in place
            sq_data['question_text'] = question_text
            sq_data['answer'] = answer
        
        return value
    
    def validate_visitor_id(self, value):
        """Validate visitor_id exists in VisitorProfile if provided."""
        if value:
            try:
                visitor = VisitorProfile.objects.get(visitor_id=value)
                self.context['visitor'] = visitor
            except VisitorProfile.DoesNotExist:
                raise serializers.ValidationError("Invalid visitor_id. Visitor profile not found.")
        return value


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    
    Accepts:
    - username_or_email (required) - can be either username or email
    - password (required)
    """
    
    username_or_email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        """Validate user exists and password is correct."""
        username_or_email = attrs.get('username_or_email', '').strip()
        password = attrs.get('password')
        
        if not username_or_email:
            raise serializers.ValidationError({"username_or_email": "Username or email is required."})
        
        # Try to find user by username or email
        try:
            user = User.objects.get(username=username_or_email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username_or_email.lower())
            except User.DoesNotExist:
                raise serializers.ValidationError({"username_or_email": "Invalid username or email."})
        
        # Verify password
        if not user.check_password(password):
            raise serializers.ValidationError({"password": "Invalid password."})
        
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile (read-only fields for id, username, visitor_id, timestamps).
    """
    visitor_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'visitor_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'username', 'visitor_id', 'created_at', 'updated_at']
    
    def get_visitor_id(self, obj):
        """Return visitor_id if visitor is linked."""
        if obj.visitor:
            return obj.visitor.visitor_id
        return None


class ForgotPasswordStep1Serializer(serializers.Serializer):
    """
    Serializer for forgot password step 1 (username or email validation).
    
    Accepts:
    - username_or_email (required) - can be either username or email
    """
    
    username_or_email = serializers.CharField(required=True)
    
    def validate_username_or_email(self, value):
        """Validate username or email exists in database."""
        value = value.strip()
        
        # Try to find user by username or email
        try:
            user = User.objects.get(username=value)
            self.context['user'] = user
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=value.lower())
                self.context['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError("No user found with this username or email address.")
        
        return value


class ForgotPasswordStep2Serializer(serializers.Serializer):
    """
    Serializer for forgot password step 2 (answer verification and password reset).
    
    Accepts:
    - email or username (required) - can be either username or email
    - question_order (required, integer: 1, 2, or 3)
    - answer (required, string)
    - password (required, string) - new password to set
    """
    
    username_or_email = serializers.CharField(required=True)
    question_order = serializers.IntegerField(required=True)
    answer = serializers.CharField(required=True)
    password = serializers.CharField(required=True, min_length=8, write_only=True)
    
    def validate_question_order(self, value):
        """Ensure question_order is 1, 2, or 3."""
        if value not in [1, 2, 3]:
            raise serializers.ValidationError("Question order must be 1, 2, or 3.")
        return value
    
    def validate_password(self, value):
        """Validate password strength."""
        if not value or len(value.strip()) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        
        # Check for at least one letter and one number
        import re
        if not re.search(r'[a-zA-Z]', value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Password must contain at least one number.")
        
        return value
    
    def validate(self, attrs):
        """Validate username_or_email exists and get security question."""
        username_or_email = attrs.get('username_or_email', '').strip()
        question_order = attrs.get('question_order')
        
        # Try to find user by username or email
        try:
            user = User.objects.get(username=username_or_email)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=username_or_email.lower())
            except User.DoesNotExist:
                raise serializers.ValidationError({"username_or_email": "No user found with this username or email address."})
        
        try:
            security_question = SecurityQuestion.objects.get(user=user, question_order=question_order)
            attrs['user'] = user
            attrs['security_question'] = security_question
        except SecurityQuestion.DoesNotExist:
            raise serializers.ValidationError({"question_order": "Security question not found for this user."})
        
        return attrs


