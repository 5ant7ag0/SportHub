import sys, os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
import pymongo

db = User._get_collection()

# Let's inspect the actual raw contents of following array for all users
users = list(db.find({"following": {"$exists": True, "$ne": []}}).limit(2))
for u in users:
    print(f"User {u['name']} follows:")
    for f in u['following'][:2]:
        print(f" - Type: {type(f)} Value: {f}")

