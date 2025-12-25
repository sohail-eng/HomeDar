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
    ProductLikeToggleAPIView,
    FavoriteProductsAPIView,
    ProductReviewsAPIView,
    ProductReviewCreateAPIView,
    SignupAPIView,
    LoginAPIView,
    ForgotPasswordStep1APIView,
    ForgotPasswordStep2APIView,
    ProfileAPIView,
    SignupRequestCodeAPIView,
    SignupVerifyCodeAPIView,
    PasswordResetRequestCodeAPIView,
    PasswordResetConfirmAPIView,
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

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
    # Like endpoints
    path('tracking/product-like/', csrf_exempt(ProductLikeToggleAPIView.as_view()), name='product-like-toggle'),
    path('tracking/product-like/<uuid:product_id>/', ProductLikeToggleAPIView.as_view(), name='product-like-check'),
    path('tracking/favorite-products/', FavoriteProductsAPIView.as_view(), name='favorite-products'),
    # Review endpoints
    path('products/<uuid:product_id>/reviews/', ProductReviewsAPIView.as_view(), name='product-reviews'),
    path('products/<uuid:product_id>/reviews/create/', csrf_exempt(ProductReviewCreateAPIView.as_view()), name='product-review-create'),
    # Authentication endpoints
    path('auth/signup/', SignupAPIView.as_view(), name='signup'),
    path('auth/signup/request-code/', SignupRequestCodeAPIView.as_view(), name='signup-request-code'),
    path('auth/signup/verify-code/', SignupVerifyCodeAPIView.as_view(), name='signup-verify-code'),
    path('auth/password-reset/request-code/', PasswordResetRequestCodeAPIView.as_view(), name='password-reset-request-code'),
    path('auth/password-reset/confirm/', PasswordResetConfirmAPIView.as_view(), name='password-reset-confirm'),
    path('auth/login/', LoginAPIView.as_view(), name='login'),
    path('auth/forgot-password/step1/', ForgotPasswordStep1APIView.as_view(), name='forgot-password-step1'),
    path('auth/forgot-password/step2/', ForgotPasswordStep2APIView.as_view(), name='forgot-password-step2'),
    path('auth/profile/', ProfileAPIView.as_view(), name='profile'),
    # JWT token endpoints (using custom token for our User model)
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
