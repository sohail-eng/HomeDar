"""
Django admin configuration for HomeDar catalog application.
"""

from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category,
    SubCategory,
    Product,
    ProductImage,
    ContactUs,
    VisitorProfile,
    ProductView,
    ProductLike,
    ProductReview,
)


class SubCategoryInline(admin.TabularInline):
    """Inline admin for SubCategory in Category admin."""
    model = SubCategory
    extra = 1
    fields = ['name', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin interface for Category model."""
    list_display = ['name', 'subcategory_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [SubCategoryInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def subcategory_count(self, obj):
        """Display count of subcategories."""
        count = obj.subcategories.count()
        return count
    subcategory_count.short_description = 'SubCategories'


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    """Admin interface for SubCategory model."""
    list_display = ['name', 'category', 'created_at', 'updated_at']
    list_filter = ['category', 'created_at', 'updated_at']
    search_fields = ['name', 'category__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    list_select_related = ['category']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'category')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ProductImageInline(admin.TabularInline):
    """Inline admin for ProductImage in Product admin."""
    model = ProductImage
    extra = 1
    fields = ['image', 'is_main', 'image_preview', 'created_at']
    readonly_fields = ['image_preview', 'created_at']
    
    def image_preview(self, obj):
        """Display image preview in admin."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 100px; max-width: 100px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = 'Preview'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin interface for Product model."""
    list_display = ['title', 'sku', 'price', 'subcategory_list', 'image_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at', 'subcategories']
    search_fields = ['title', 'sku', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']
    filter_horizontal = ['subcategories']
    inlines = [ProductImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'title', 'sku', 'price', 'description')
        }),
        ('Relationships', {
            'fields': ('subcategories',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def subcategory_list(self, obj):
        """Display list of subcategories."""
        subcategories = obj.subcategories.all()[:3]
        names = [sub.name for sub in subcategories]
        if obj.subcategories.count() > 3:
            names.append(f"... and {obj.subcategories.count() - 3} more")
        return ", ".join(names) if names else "None"
    subcategory_list.short_description = 'SubCategories'
    
    def image_count(self, obj):
        """Display count of images."""
        count = obj.images.count()
        main_count = obj.images.filter(is_main=True).count()
        return f"{count} ({main_count} main)"
    image_count.short_description = 'Images'


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    """Admin interface for ProductImage model."""
    list_display = ['product', 'image_preview', 'is_main', 'created_at']
    list_filter = ['is_main', 'created_at', 'product']
    search_fields = ['product__title', 'product__sku']
    readonly_fields = ['id', 'image_preview', 'created_at']
    list_select_related = ['product']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'product', 'image', 'is_main')
        }),
        ('Preview', {
            'fields': ('image_preview',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        """Display image preview in admin."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 200px;" />',
                obj.image.url
            )
        return "No image"
    image_preview.short_description = 'Preview'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related."""
        qs = super().get_queryset(request)
        return qs.select_related('product')


@admin.register(ContactUs)
class ContactUsAdmin(admin.ModelAdmin):
    """Admin interface for ContactUs model."""
    list_display = ['name', 'email', 'phone', 'message_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'email', 'phone', 'message']
    readonly_fields = ['id', 'created_at']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('id', 'name', 'email', 'phone')
        }),
        ('Message', {
            'fields': ('message',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def message_preview(self, obj):
        """Display message preview (first 50 characters)."""
        if obj.message:
            preview = obj.message[:50]
            if len(obj.message) > 50:
                preview += "..."
            return preview
        return "No message"
    message_preview.short_description = 'Message Preview'
    
    def has_add_permission(self, request):
        """Disable adding ContactUs from admin (only via API)."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing ContactUs from admin (read-only)."""
        return False


@admin.register(VisitorProfile)
class VisitorProfileAdmin(admin.ModelAdmin):
    """Admin interface for VisitorProfile model."""

    list_display = ['short_id', 'country', 'city', 'last_ip', 'latitude', 'longitude', 'first_seen', 'last_seen']
    list_filter = ['country', 'city', 'first_seen', 'last_seen']
    search_fields = ['visitor_id', 'last_ip', 'country', 'city']
    readonly_fields = ['visitor_id', 'first_seen', 'last_seen']
    date_hierarchy = 'last_seen'

    fieldsets = (
        ('Visitor', {
            'fields': ('visitor_id',),
        }),
        ('Location', {
            'fields': ('country', 'city', 'latitude', 'longitude'),
        }),
        ('Network', {
            'fields': ('last_ip',),
        }),
        ('Timestamps', {
            'fields': ('first_seen', 'last_seen'),
            'classes': ('collapse',),
        }),
    )

    def short_id(self, obj):
        return str(obj.visitor_id)[:8]

    short_id.short_description = 'Visitor'


@admin.register(ProductView)
class ProductViewAdmin(admin.ModelAdmin):
    """Admin interface for ProductView model."""

    list_display = ['visitor_short', 'product', 'country', 'city', 'viewed_at', 'latitude', 'longitude']
    list_filter = ['viewed_at', 'country', 'city', 'product']
    search_fields = ['visitor__visitor_id', 'product__title', 'product__sku', 'city', 'country']
    readonly_fields = ['id', 'visitor', 'product', 'viewed_at']
    date_hierarchy = 'viewed_at'
    list_select_related = ['visitor', 'product']

    fieldsets = (
        ('Event', {
            'fields': ('id', 'visitor', 'product', 'viewed_at'),
        }),
        ('Location at Time of View', {
            'fields': ('country', 'city', 'latitude', 'longitude'),
        }),
    )

    class Media:
        js = ('admin/js/productview_date_hierarchy.js',)

    def visitor_short(self, obj):
        return obj.visitor_id_display

    visitor_short.short_description = 'Visitor'


@admin.register(ProductLike)
class ProductLikeAdmin(admin.ModelAdmin):
    """Admin interface for ProductLike model."""

    list_display = ['visitor_short', 'product', 'created_at']
    list_filter = ['created_at', 'product']
    search_fields = ['visitor__visitor_id', 'product__title', 'product__sku']
    readonly_fields = ['id', 'visitor', 'product', 'created_at']
    date_hierarchy = 'created_at'
    list_select_related = ['visitor', 'product']

    fieldsets = (
        ('Like', {
            'fields': ('id', 'visitor', 'product', 'created_at'),
        }),
    )

    def visitor_short(self, obj):
        return obj.visitor_id_display

    visitor_short.short_description = 'Visitor'


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    """Admin interface for ProductReview model."""

    list_display = ['reviewer_name', 'visitor_short_id', 'product', 'review_text_preview', 'created_at']
    list_filter = ['created_at', 'product']
    search_fields = ['visitor__visitor_id', 'product__title', 'product__sku', 'name', 'review_text']
    readonly_fields = ['id', 'visitor', 'product', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    list_select_related = ['visitor', 'product']

    fieldsets = (
        ('Review', {
            'fields': ('id', 'visitor', 'product', 'name', 'review_text', 'created_at', 'updated_at'),
        }),
    )

    def reviewer_name(self, obj):
        return obj.reviewer_name

    reviewer_name.short_description = 'Reviewer'

    def review_text_preview(self, obj):
        """Display first 50 characters of review text."""
        if obj.review_text:
            preview = obj.review_text[:50]
            if len(obj.review_text) > 50:
                preview += "..."
            return preview
        return "No review text"

    review_text_preview.short_description = 'Review Preview'

    def visitor_short_id(self, obj):
        return obj.visitor.visitor_id[:8]

    visitor_short_id.short_description = 'Visitor'
