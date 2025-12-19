"""
URL configuration for catalog app.
"""

from django.urls import path, include
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter

from .views import (
    CategoryViewSet,
    SubCategoryViewSet,
    ProductViewSet,
    ProductImageViewSet,
    ContactUsViewSet,
    ProductViewTrackingAPIView,
    RecentProductsAPIView,
    PopularProductsAPIView,
    AlsoViewedProductsAPIView,
)

# Create a router and register viewsets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subcategories', SubCategoryViewSet, basename='subcategory')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-images', ProductImageViewSet, basename='product-image')
router.register(r'contact-us', ContactUsViewSet, basename='contact-us')

urlpatterns = [
    path('', include(router.urls)),
    # Tracking endpoints
    path('tracking/product-views/', csrf_exempt(ProductViewTrackingAPIView.as_view()), name='product-view-tracking'),
    path('tracking/recent-products/', RecentProductsAPIView.as_view(), name='recent-products'),
    path('tracking/popular-products/', PopularProductsAPIView.as_view(), name='popular-products'),
    path('tracking/also-viewed/<uuid:product_id>/', AlsoViewedProductsAPIView.as_view(), name='also-viewed'),
]
