"""
Management command to clean up tracking data (ProductView / VisitorProfile).

Usage:
    python manage.py cleanup_tracking_data
    python manage.py cleanup_tracking_data --views-days=180 --visitors-days=365

By default it:
- Deletes ProductView rows older than 180 days
- Deletes VisitorProfile rows that have no ProductView and last_seen older than 365 days
"""

from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from catalog.models import ProductView, VisitorProfile


class Command(BaseCommand):
    help = "Purge old tracking data (ProductView, optionally inactive VisitorProfile)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--views-days",
            type=int,
            default=180,
            help="Delete ProductView records older than this many days (default: 180).",
        )
        parser.add_argument(
            "--visitors-days",
            type=int,
            default=365,
            help=(
                "Delete VisitorProfile records with no associated ProductView and "
                "last_seen older than this many days (default: 365)."
            ),
        )

    def handle(self, *args, **options):
        now = timezone.now()

        # Purge old ProductView records
        views_days = options["views_days"]
        views_cutoff = now - timedelta(days=views_days)
        old_views_qs = ProductView.objects.filter(viewed_at__lt=views_cutoff)
        old_views_count = old_views_qs.count()

        if old_views_count:
            self.stdout.write(
                self.style.WARNING(
                    f"Deleting {old_views_count} ProductView records older than {views_days} days..."
                )
            )
            old_views_qs.delete()
        else:
            self.stdout.write("No old ProductView records to delete.")

        # Optionally prune inactive VisitorProfile entries with no views
        visitors_days = options["visitors_days"]
        visitors_cutoff = now - timedelta(days=visitors_days)

        inactive_visitors_qs = VisitorProfile.objects.filter(
            last_seen__lt=visitors_cutoff,
            product_views__isnull=True,
        )
        inactive_visitors_count = inactive_visitors_qs.count()

        if inactive_visitors_count:
            self.stdout.write(
                self.style.WARNING(
                    f"Deleting {inactive_visitors_count} inactive VisitorProfile records "
                    f"with no views and last_seen older than {visitors_days} days..."
                )
            )
            inactive_visitors_qs.delete()
        else:
            self.stdout.write("No inactive VisitorProfile records to delete.")

        self.stdout.write(self.style.SUCCESS("Tracking data cleanup completed."))


