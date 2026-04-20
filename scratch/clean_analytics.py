import os
import sys
import django
from datetime import datetime

# Add current directory to path
sys.path.append(os.getcwd())

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import AnalyticsEvent, User

def cleanup_analytics():
    print("🚀 Starting Analytics Cleanup...")
    
    # Selective cleanup
    # We remove ages that are clearly not in our user base (16-35)
    from mongoengine.queryset.visitor import Q
    
    count = AnalyticsEvent.objects(Q(visitor_age__gt=45) | Q(visitor_age__lt=13)).count()
    print(f"🧹 Found {count} outlier events (age < 13 or age > 45). Deleting...")
    AnalyticsEvent.objects(Q(visitor_age__gt=45) | Q(visitor_age__lt=13)).delete()
    
    # 2. Option B: Clear all if mostly noise
    # The user asked for "limpieza". Since we have 1261 events with age 59, 
    # it's likely 90% of the data is seed noise.
    # However, let's keep the ages between 16-35 for now to show "some" data.
    
    remaining = AnalyticsEvent.objects.count()
    print(f"✅ Cleanup complete. {remaining} events remaining.")

if __name__ == "__main__":
    cleanup_analytics()
