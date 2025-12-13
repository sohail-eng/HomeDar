"""
API Views and ViewSets for HomeDar catalog application.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
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


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category model.
    Provides list and retrieve actions.
    Endpoint: /api/categories/
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['name']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']  # Default ordering


class SubCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for SubCategory model.
    Provides list and retrieve actions.
    Endpoint: /api/subcategories/
    Supports filtering by category.
    """
    queryset = SubCategory.objects.select_related('category').all()
    serializer_class = SubCategorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['category', 'name']
    ordering_fields = ['name', 'created_at', 'updated_at', 'category']
    ordering = ['category', 'name']  # Default ordering


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Product model.
    Provides list and retrieve actions.
    Endpoint: /api/products/
    Supports filtering, searching, and ordering.
    """
    queryset = Product.objects.prefetch_related('subcategories', 'images').all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'created_at', 'updated_at', 'title']
    ordering = ['-created_at']  # Default ordering: newest first
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'list':
            return ProductListSerializer
        return ProductDetailSerializer
    
    def get_queryset(self):
        """
        Filter products based on query parameters:
        - title: search in title
        - sku: exact match
        - min_price, max_price: price range
        - created_at_after, created_at_before: date range
        - updated_at_after, updated_at_before: date range
        - subcategories: filter by subcategory IDs (comma-separated)
        """
        queryset = super().get_queryset()
        
        # Filter by SKU (exact match)
        sku = self.request.query_params.get('sku', None)
        if sku:
            queryset = queryset.filter(sku=sku)
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass
        
        # Filter by date range (created_at)
        created_at_after = self.request.query_params.get('created_at_after', None)
        created_at_before = self.request.query_params.get('created_at_before', None)
        if created_at_after:
            queryset = queryset.filter(created_at__gte=created_at_after)
        if created_at_before:
            queryset = queryset.filter(created_at__lte=created_at_before)
        
        # Filter by date range (updated_at)
        updated_at_after = self.request.query_params.get('updated_at_after', None)
        updated_at_before = self.request.query_params.get('updated_at_before', None)
        if updated_at_after:
            queryset = queryset.filter(updated_at__gte=updated_at_after)
        if updated_at_before:
            queryset = queryset.filter(updated_at__lte=updated_at_before)
        
        # Filter by subcategories (multiple selection)
        subcategories = self.request.query_params.get('subcategories', None)
        if subcategories:
            subcategory_ids = [id.strip() for id in subcategories.split(',')]
            queryset = queryset.filter(subcategories__id__in=subcategory_ids).distinct()
        
        return queryset


class ProductImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ProductImage model.
    Provides list, retrieve, and update actions.
    Endpoint: /api/product-images/
    Supports updating is_main flag.
    """
    queryset = ProductImage.objects.select_related('product').all()
    serializer_class = ProductImageSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product', 'is_main']
    ordering_fields = ['is_main', 'created_at']
    ordering = ['-is_main', 'created_at']  # Main images first
    
    def get_queryset(self):
        """Filter by product if provided."""
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product', None)
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
    
    def update(self, request, *args, **kwargs):
        """
        Update product image, ensuring only one main image per product.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # If setting is_main to True, unset other main images
        if 'is_main' in request.data and request.data['is_main']:
            ProductImage.objects.filter(
                product=instance.product,
                is_main=True
            ).exclude(pk=instance.pk).update(is_main=False)
        
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Handle partial update (PATCH)."""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)


class ContactUsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ContactUs model.
    Only allows create action (POST requests).
    Endpoint: /api/contact-us/
    """
    queryset = ContactUs.objects.all()
    serializer_class = ContactUsSerializer
    http_method_names = ['post']  # Only allow POST
    
    def create(self, request, *args, **kwargs):
        """
        Create a new contact form submission.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            {
                'message': 'Thank you for contacting us! We will get back to you soon.',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED,
            headers=headers
        )
