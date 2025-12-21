"""
Celery tasks for catalog app.
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.conf import settings
from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone

from .models import ProductView, VisitorProfile
from .utils.geo import lookup_location_from_coords

logger = logging.getLogger(__name__)


@shared_task
def cleanup_old_product_views():
    """
    Delete ProductView records older than 30 days.
    
    This task is scheduled to run daily at midnight via Celery Beat.
    It removes tracking data that is older than 30 days to manage
    database size and maintain data retention policies.
    
    Returns:
        dict: Contains 'deleted_count' and 'status' keys
    """
    try:
        now = timezone.now()
        cutoff_date = now - timedelta(days=30)
        
        # Get count before deletion for logging
        old_views = ProductView.objects.filter(viewed_at__lt=cutoff_date)
        deleted_count = old_views.count()
        
        if deleted_count > 0:
            # Delete old records
            old_views.delete()
        
        return {
            'status': 'success',
            'deleted_count': deleted_count,
            'cutoff_date': cutoff_date.isoformat(),
        }
    except Exception as e:
        logger.error(f"Error in cleanup_old_product_views task: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e),
            'deleted_count': 0,
        }


@shared_task
def backfill_location_from_coords():
    """
    Backfill missing country/city data from latitude/longitude coordinates.
    
    This task:
    1. Uses Redis lock to prevent concurrent execution
    2. Finds ProductView records with lat/long but missing country OR city
    3. Gets distinct lat/long pairs to minimize API calls
    4. Calls reverse geocoding API for each unique coordinate pair
    5. Updates both ProductView and VisitorProfile records with the results
    
    Runs every 5 minutes via Celery Beat.
    
    Returns:
        dict: Contains 'status', 'processed_count', 'updated_views', 'updated_visitors' keys
    """
    lock_key = 'backfill_location_from_coords:running'
    lock_timeout = 900  # 15 minutes in seconds (longer than schedule interval to handle long-running tasks)
    
    # Try to acquire lock (set if not exists)
    lock_acquired = cache.add(lock_key, 'running', lock_timeout)
    
    if not lock_acquired:
        return {
            'status': 'skipped',
            'message': 'Task already running',
        }
    
    try:
        # Find ProductView records with lat/long but missing country OR city
        views_with_coords = ProductView.objects.filter(
            latitude__isnull=False,
            longitude__isnull=False,
        ).filter(
            Q(country__isnull=True) | Q(country='') | Q(city__isnull=True) | Q(city='')
        )
        
        if not views_with_coords.exists():
            cache.delete(lock_key)
            return {
                'status': 'success',
                'processed_count': 0,
                'updated_views': 0,
                'updated_visitors': 0,
            }
        
        # Get distinct lat/long pairs
        distinct_coords = views_with_coords.values('latitude', 'longitude').distinct()
        coord_list = [(item['latitude'], item['longitude']) for item in distinct_coords]
        
        updated_views_count = 0
        updated_visitors_count = 0
        
        # Process each unique coordinate pair
        for lat, lon in coord_list:
            try:
                # Call reverse geocoding API for this lat/long pair
                country, city = lookup_location_from_coords(lat, lon)
                
                if not country and not city:
                    logger.warning(f"Failed to get location for coordinates ({lat}, {lon})")
                    continue  # Skip if we didn't get any location data
                
                # Prepare update data
                update_data = {}
                if country:
                    update_data['country'] = country
                if city:
                    update_data['city'] = city
                
                if not update_data:
                    continue
                
                # Update all ProductView records with this lat/long pair
                views_to_update = views_with_coords.filter(
                    latitude=lat,
                    longitude=lon
                )
                
                if views_to_update.exists():
                    count = views_to_update.update(**update_data)
                    updated_views_count += count
                
                # Update all VisitorProfile records with this lat/long pair
                # Only update if they have the same lat/long and are missing country or city
                visitors_to_update = VisitorProfile.objects.filter(
                    latitude=lat,
                    longitude=lon
                ).filter(
                    Q(country__isnull=True) | Q(country='') | Q(city__isnull=True) | Q(city='')
                )
                
                if visitors_to_update.exists():
                    visitor_update_data = {}
                    if country:
                        visitor_update_data['country'] = country
                    if city:
                        visitor_update_data['city'] = city
                    
                    if visitor_update_data:
                        visitor_count = visitors_to_update.update(**visitor_update_data)
                        updated_visitors_count += visitor_count
                    
            except Exception as e:
                logger.error(
                    f"Error processing coordinates ({lat}, {lon}): {str(e)}",
                    exc_info=True
                )
                continue  # Continue with next coordinate pair
        
        # Release lock before returning
        cache.delete(lock_key)
        return {
            'status': 'success',
            'processed_count': len(coord_list),
            'updated_views': updated_views_count,
            'updated_visitors': updated_visitors_count,
        }
        
    except Exception as e:
        logger.error(f"Error in backfill_location_from_coords task: {str(e)}", exc_info=True)
        # Release lock before returning on error
        cache.delete(lock_key)
        return {
            'status': 'error',
            'error': str(e),
            'processed_count': 0,
            'updated_views': 0,
            'updated_visitors': 0,
        }
