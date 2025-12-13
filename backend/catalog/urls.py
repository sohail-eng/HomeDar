"""
URL configuration for catalog app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet,
    SubCategoryViewSet,
    ProductViewSet,
    ProductImageViewSet,
    ContactUsViewSet,
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
]

