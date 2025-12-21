"""
API Views and ViewSets for HomeDar catalog application.
"""

from datetime import timedelta

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Count, Max
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import Category, SubCategory, Product, ProductImage, ContactUs, ProductView, ProductLike, ProductReview
from .serializers import (
    CategorySerializer,
    SubCategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ContactUsSerializer,
    ProductViewCreateSerializer,
    RecentProductSerializer,
    ProductLikeToggleSerializer,
    ProductReviewSerializer,
    ProductReviewCreateSerializer,
)
from .utils.geo import get_client_ip, ensure_visitor_profile_for_request


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Category model.
    Provides list and retrieve actions.
    Endpoint: /api/categories/
    Returns only categories that have subcategories with at least one product.
    """
    queryset = Category.objects.prefetch_related(
        'subcategories',
        'subcategories__products'
    ).filter(
        subcategories__isnull=False,
        subcategories__products__isnull=False
    ).distinct()
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
    search_fields = ['title', 'description']  # DRF SearchFilter is case-insensitive by default
    ordering_fields = ['price', 'created_at', 'updated_at', 'title', 'likes_count']
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
        - ordering: supports likes_count for ordering by favorite count
        """
        queryset = super().get_queryset()
        
        # Check if ordering by likes_count is requested
        ordering_param = self.request.query_params.get('ordering', None)
        needs_likes_count = ordering_param and ('likes_count' in ordering_param or '-likes_count' in ordering_param)
        
        # Annotate likes_count if needed for ordering
        if needs_likes_count:
            queryset = queryset.annotate(
                likes_count=Count('likes', distinct=True)
            )
        
        # Filter by SKU (case-insensitive partial match)
        sku = self.request.query_params.get('sku', None)
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        
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


class ProductViewTrackingAPIView(APIView):
    """
    Create ProductView tracking events.

    POST /api/tracking/product-views/
    - Uses visitor_id from query parameter or request body (required)
    - Uses client IP to update VisitorProfile (including geolocation)
    - Merges optional browser lat/lng
    - Basic throttle: ignores duplicate views of the same product in the
      last N seconds (default 60s).
    """

    # Disable CSRF/session auth for this anonymous tracking endpoint.
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = ProductViewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.context.get("product")
        latitude = serializer.validated_data.get("latitude")
        longitude = serializer.validated_data.get("longitude")

        # Get visitor_id from query param or payload (query param takes precedence)
        visitor_id = (
            request.query_params.get("visitor_id") or 
            request.data.get("visitor_id")
        )
        if not visitor_id:
            return Response(
                {"error": "Visitor ID required. Please provide visitor_id in query parameter or request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ensure / update VisitorProfile (including IP-based geolocation).
        visitor_profile = ensure_visitor_profile_for_request(request, visitor_id)

        # If browser provided more precise lat/lng, update the VisitorProfile as well.
        visitor_profile_updated = False
        if latitude is not None and visitor_profile.latitude != latitude:
            visitor_profile.latitude = latitude
            visitor_profile_updated = True
        if longitude is not None and visitor_profile.longitude != longitude:
            visitor_profile.longitude = longitude
            visitor_profile_updated = True
        if visitor_profile_updated:
            visitor_profile.save(update_fields=["latitude", "longitude"])

        # Basic duplicate/throttle logic: ignore if same visitor viewed same
        # product within the last duplicate_window_seconds.
        now = timezone.now()

        existing = ProductView.objects.filter(
            visitor=visitor_profile,
            product=product
        ).order_by("-viewed_at").first()

        if existing:
            # Check if location changed
            location_changed = False
            updated = False
            
            # Check if latitude changed
            if latitude is not None and existing.latitude != latitude:
                existing.latitude = latitude
                location_changed = True
                updated = True
            # Check if longitude changed
            if longitude is not None and existing.longitude != longitude:
                existing.longitude = longitude
                location_changed = True
                updated = True
            
            # Always refresh viewed_at for recency
            existing.viewed_at = now
            
            # If location changed, clear city and country (they're no longer accurate)
            if location_changed:
                existing.city = None
                existing.country = None
                update_fields = ["viewed_at", "latitude", "longitude", "city", "country"]
            else:
                update_fields = ["viewed_at"]
                if updated:
                    update_fields.extend(["latitude", "longitude"])
            
            existing.save(update_fields=update_fields)

            response = Response({"success": True, "duplicate": True})
        else:
            # Create a new ProductView row.
            view_kwargs = {
                "visitor": visitor_profile,
                "product": product,
                "country": visitor_profile.country,
                "city": visitor_profile.city,
            }
            if latitude is not None:
                view_kwargs["latitude"] = latitude
            if longitude is not None:
                view_kwargs["longitude"] = longitude

            ProductView.objects.create(**view_kwargs)
            response = Response({"success": True, "duplicate": False})

        return response


class RecentProductsAPIView(APIView):
    """
    Return recently viewed products for the current anonymous visitor.

    GET /api/tracking/recent-products/
    - Uses visitor_id from query parameter (required)
    - Returns last N unique products ordered by most recent view
    - Response shape matches ProductListSerializer
    """

    default_limit = 10

    def get(self, request, *args, **kwargs):
        visitor_id = request.query_params.get("visitor_id")
        if not visitor_id:
            return Response({"results": []})

        from .models import VisitorProfile

        try:
            visitor = VisitorProfile.objects.get(visitor_id=visitor_id)
        except VisitorProfile.DoesNotExist:
            return Response({"results": []})

        limit = self.default_limit
        try:
            if "limit" in request.query_params:
                limit = max(1, min(50, int(request.query_params["limit"])))
        except (TypeError, ValueError):
            pass

        # Get recent views and deduplicate by product, preserving order.
        views_qs = (
            ProductView.objects.filter(visitor=visitor)
            .select_related("product")
            .order_by("-viewed_at")
        )

        seen_product_ids = set()
        products = []
        for view in views_qs:
            pid = view.product_id
            if pid in seen_product_ids:
                continue
            seen_product_ids.add(pid)
            products.append(view.product)
            if len(products) >= limit:
                break

        serializer = RecentProductSerializer(
            products,
            many=True,
            context={"request": request},
        )
        return Response({"results": serializer.data})


class PopularProductsAPIView(APIView):
    """
    Return popular products by view count, optionally filtered by country and period.

    GET /api/tracking/popular-products/
    Query params:
    - country: ISO country code (default: infer from visitor or IP if available)
    - period: '24h', '7d', '30d' (default: '7d')
    - limit: number of products to return (default: 10, max: 50)
    """

    default_limit = 10

    def get(self, request, *args, **kwargs):
        from django.db.models import Count, Max, Case, When, IntegerField
        from .models import VisitorProfile

        # Resolve period
        period_param = request.query_params.get("period", "7d")
        now = timezone.now()
        if period_param == "24h":
            since = now - timedelta(hours=24)
        elif period_param == "30d":
            since = now - timedelta(days=30)
        else:
            # default to 7 days
            since = now - timedelta(days=7)

        limit = self.default_limit
        try:
            if "limit" in request.query_params:
                limit = max(1, min(50, int(request.query_params["limit"])))
        except (TypeError, ValueError):
            pass

        views_qs = ProductView.objects.filter(viewed_at__gte=since)

        # Resolve current visitor's location (country/city) for ordering priority.
        visitor_country = None
        visitor_city = None
        visitor_id = request.query_params.get("visitor_id")
        if visitor_id:
            try:
                visitor = VisitorProfile.objects.get(visitor_id=visitor_id)
                visitor_country = visitor.country
                visitor_city = visitor.city
            except VisitorProfile.DoesNotExist:
                pass

        # Aggregate by view count and last_viewed_at, and prioritize:
        # 1) Visitor's exact city + country
        # 2) Same country (any city)
        # 3) All other locations
        product_last_views = (
            views_qs.values("product")
            .annotate(
                view_count=Count("id"),
                last_viewed_at=Max("viewed_at"),
                location_priority=Case(
                    # Highest: same city AND country as visitor
                    When(
                        country=visitor_country,
                        city=visitor_city,
                        then=2,
                    ),
                    # Next: same country (any city)
                    When(
                        country=visitor_country,
                        then=1,
                    ),
                    default=0,
                    output_field=IntegerField(),
                ),
            )
            .order_by(
                "-location_priority",  # 1) visitor city, then visitor country, then others
                "-view_count",         # 2) view count
                "-last_viewed_at",     # 3) recency
                "country",             # 4) country name
                "city",                # 5) city name
            )
        )[:limit]

        product_ids = [item["product"] for item in product_last_views]
        products = list(Product.objects.filter(id__in=product_ids).prefetch_related("images"))

        # Preserve the order defined by product_counts.
        products_by_id = {p.id: p for p in products}
        ordered_products = [products_by_id[pid] for pid in product_ids if pid in products_by_id]

        serializer = RecentProductSerializer(
            ordered_products,
            many=True,
            context={"request": request},
        )
        return Response(
            {
                "results": serializer.data,
                "country": None,
                "period": period_param,
            }
        )


class AlsoViewedProductsAPIView(APIView):
    """
    Return products that were viewed by visitors who also viewed the specified product.
    
    GET /api/tracking/also-viewed/<product_id>/
    Query params:
    - limit: number of products to return (default: 10, max: 10)
    - period: optional time filter - '30d', '90d' (default: '90d')
    
    Algorithm:
    1. Find all distinct visitors who viewed the current product
    2. Find all other products those visitors also viewed (excluding current product)
    3. Count views per product and sort by count (desc), then by most recent view (desc)
    4. Return top N products
    """

    default_limit = 10
    default_period_days = 90

    def get(self, request, product_id, *args, **kwargs):
        from .models import Product, VisitorProfile

        # Get the current product
        try:
            current_product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Parse limit parameter
        limit = self.default_limit
        try:
            if "limit" in request.query_params:
                limit = max(1, min(10, int(request.query_params["limit"])))
        except (TypeError, ValueError):
            pass

        # Parse optional time period filter
        period_param = request.query_params.get("period", "90d")
        now = timezone.now()
        if period_param == "30d":
            since = now - timedelta(days=30)
        else:
            # default to 90 days
            since = now - timedelta(days=self.default_period_days)

        # Get current visitor's viewed products to exclude them
        current_visitor_viewed_products = None
        visitor_id = request.query_params.get("visitor_id")
        if visitor_id:
            try:
                visitor = VisitorProfile.objects.get(visitor_id=visitor_id)
                # Get all product IDs that the current visitor has viewed
                current_visitor_viewed_products = ProductView.objects.filter(
                    visitor=visitor
                ).values_list("product_id", flat=True).distinct()
            except VisitorProfile.DoesNotExist:
                pass

        # Step 1: Get all distinct visitors who viewed the current product (within time period)
        visitors_who_viewed = (
            ProductView.objects.filter(
                product=current_product,
                viewed_at__gte=since,
            )
            .values_list("visitor", flat=True)
            .distinct()
        )

        # If no visitors viewed this product, return empty results
        if not visitors_who_viewed:
            return Response({"results": []})

        # Step 2: Find all products viewed by those visitors (excluding current product and products current visitor has viewed)
        # Step 3: Aggregate by product, count views, and get most recent view
        also_viewed_aggregated = (
            ProductView.objects.filter(
                visitor__in=visitors_who_viewed,
                viewed_at__gte=since,
            )
            .exclude(product=current_product)
        )
        
        # Exclude products the current visitor has already viewed
        if current_visitor_viewed_products is not None:
            also_viewed_aggregated = also_viewed_aggregated.exclude(
                product_id__in=current_visitor_viewed_products
            )
        
        also_viewed_aggregated = (
            also_viewed_aggregated
            .values("product")
            .annotate(
                view_count=Count("id"),
                last_viewed=Max("viewed_at"),
            )
            .order_by("-view_count", "-last_viewed")[:limit]
        )

        # Extract product IDs in order
        product_ids = [item["product"] for item in also_viewed_aggregated]

        if not product_ids:
            return Response({"results": []})

        # Fetch the actual Product objects with images prefetched
        products = list(
            Product.objects.filter(id__in=product_ids).prefetch_related("images")
        )

        # Preserve the order defined by the aggregation
        products_by_id = {p.id: p for p in products}
        ordered_products = [
            products_by_id[pid] for pid in product_ids if pid in products_by_id
        ]

        # Serialize using RecentProductSerializer for consistency
        serializer = RecentProductSerializer(
            ordered_products,
            many=True,
            context={"request": request},
        )

        return Response({"results": serializer.data})


class ProductLikeToggleAPIView(APIView):
    """
    Toggle like/unlike for a product.
    
    POST /api/tracking/product-like/
    Body: { "product_id": "uuid" }
    
    Returns: { "liked": true/false, "product_id": "uuid" }
    
    - Uses visitor_id from query parameter or request body (required)
    - Creates like if it doesn't exist (like)
    - Deletes like if it exists (unlike)
    """
    
    authentication_classes = []
    
    @method_decorator(csrf_exempt, name="dispatch")
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        import uuid
        
        serializer = ProductLikeToggleSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        
        product = serializer.context.get("product")
        
        # Get visitor_id from query param or payload (query param takes precedence)
        visitor_id = (
            request.query_params.get("visitor_id") or 
            request.data.get("visitor_id")
        )
        
        if not visitor_id:
            return Response(
                {"error": "Visitor ID required. Please provide visitor_id in query parameter or request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Ensure visitor profile exists
        visitor_profile = ensure_visitor_profile_for_request(request, visitor_id)
        if not visitor_profile:
            return Response(
                {"error": "Failed to create or retrieve visitor profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        # Check if like already exists
        like_exists = ProductLike.objects.filter(
            visitor=visitor_profile,
            product=product
        ).exists()
        
        if like_exists:
            # Unlike: delete the like
            ProductLike.objects.filter(
                visitor=visitor_profile,
                product=product
            ).delete()
            liked = False
        else:
            # Like: create the like
            ProductLike.objects.create(
                visitor=visitor_profile,
                product=product
            )
            liked = True
        
        # Get updated like count
        like_count = ProductLike.objects.filter(product=product).count()
        
        return Response({
            "liked": liked,
            "product_id": str(product.id),
            "like_count": like_count,
        })
    
    def get(self, request, product_id, *args, **kwargs):
        """
        Check if the current visitor has liked a product.
        
        GET /api/tracking/product-like/<product_id>/
        
        Returns: { "liked": true/false, "product_id": "uuid" }
        """
        from .models import Product
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Prefer visitor_id from query parameter, then cookie
        visitor_id = request.query_params.get("visitor_id")
        if not visitor_id:
            return Response({
                "liked": False,
                "product_id": str(product.id),
                "like_count": ProductLike.objects.filter(product=product).count(),
            })
        
        try:
            from .models import VisitorProfile
            visitor_profile = VisitorProfile.objects.get(visitor_id=visitor_id)
            liked = ProductLike.objects.filter(
                visitor=visitor_profile,
                product=product
            ).exists()
        except VisitorProfile.DoesNotExist:
            liked = False
        
        # Get like count
        like_count = ProductLike.objects.filter(product=product).count()
        
        return Response({
            "liked": liked,
            "product_id": str(product.id),
            "like_count": like_count,
        })


class FavoriteProductsAPIView(APIView):
    """
    Get all products liked by the current visitor.
    
    GET /api/tracking/favorite-products/
    Query params:
    - limit: number of products to return (default: 50, max: 100)
    
    Returns: { "results": [products], "count": number }
    
    - Uses visitor_id from query parameter (required)
    - Returns empty list if visitor not found or no likes
    """
    
    authentication_classes = []
    default_limit = 50
    
    def get(self, request, *args, **kwargs):
        from .models import Product
        
        # Parse limit parameter
        limit = self.default_limit
        try:
            if "limit" in request.query_params:
                limit = max(1, min(100, int(request.query_params["limit"])))
        except (TypeError, ValueError):
            pass
        
        visitor_id = request.query_params.get("visitor_id")
        if not visitor_id:
            return Response({
                "results": [],
                "count": 0,
            })
        
        try:
            from .models import VisitorProfile
            visitor_profile = VisitorProfile.objects.get(visitor_id=visitor_id)
            
            # Get all liked products for this visitor, ordered by most recently liked
            # Get both product_id and created_at to preserve order
            liked_products_data = (
                ProductLike.objects.filter(visitor=visitor_profile)
                .select_related("product")
                .order_by("-created_at")
                .values("product_id", "created_at")
            )
            
            if not liked_products_data:
                return Response({
                    "results": [],
                    "count": 0,
                })
            
            # Extract product IDs in order (most recent first)
            product_ids = [item["product_id"] for item in liked_products_data]
            
            # Fetch the actual Product objects with images prefetched
            products = list(
                Product.objects.filter(id__in=product_ids)
                .prefetch_related("images")
            )
            
            # Preserve the order defined by the likes (most recent first)
            products_by_id = {p.id: p for p in products}
            ordered_products = [
                products_by_id[pid] for pid in product_ids if pid in products_by_id
            ][:limit]
            
            # Serialize using RecentProductSerializer for consistency
            serializer = RecentProductSerializer(
                ordered_products,
                many=True,
                context={"request": request},
            )
            
            return Response({
                "results": serializer.data,
                "count": len(ordered_products),
            })
            
        except VisitorProfile.DoesNotExist:
            return Response({
                "results": [],
                "count": 0,
            })


class ProductReviewsAPIView(APIView):
    """
    Get all reviews for a product.
    
    GET /api/products/<product_id>/reviews/
    
    Returns: { "results": [reviews], "count": number }
    """
    
    authentication_classes = []
    
    def get(self, request, product_id, *args, **kwargs):
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        reviews = ProductReview.objects.filter(product=product).order_by("-created_at")
        serializer = ProductReviewSerializer(reviews, many=True, context={"request": request})
        
        return Response({
            "results": serializer.data,
            "count": reviews.count(),
        })


class ProductReviewCreateAPIView(APIView):
    """
    Create a review for a product.
    
    POST /api/products/<product_id>/reviews/
    Body: { "name": "optional string", "review_text": "required string" }
    
    Returns: { "id": "uuid", "reviewer_name": "string", "review_text": "string", "created_at": "datetime" }
    
    - Uses visitor_id from query parameter or request body (required)
    - Requires location to be granted (same as other tracking features)
    """
    
    authentication_classes = []
    
    @method_decorator(csrf_exempt, name="dispatch")
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request, product_id, *args, **kwargs):
        import uuid
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        serializer = ProductReviewCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get visitor_id from query param or payload (query param takes precedence)
        visitor_id = (
            request.query_params.get("visitor_id") or 
            request.data.get("visitor_id")
        )
        
        if not visitor_id:
            return Response(
                {"error": "Visitor ID required. Please provide visitor_id in query parameter or request body."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Ensure visitor profile exists
        visitor_profile = ensure_visitor_profile_for_request(request, visitor_id)
        if not visitor_profile:
            return Response(
                {"error": "Failed to create or retrieve visitor profile."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        # Create the review
        review = ProductReview.objects.create(
            visitor=visitor_profile,
            product=product,
            name=serializer.validated_data.get("name"),
            review_text=serializer.validated_data.get("review_text"),
        )
        
        # Serialize and return
        response_serializer = ProductReviewSerializer(review, context={"request": request})
        
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
