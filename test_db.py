import sys, os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
import pymongo

user = User.objects.first()
print("Using MongoEngine directly:", len(user.following))
if user.following:
    print("Type of element in MongoEngine:", type(user.following[0]))

db = User._get_collection()
raw_user = db.find_one({"_id": user.id})
print("Raw MongoDB following array:", getattr(raw_user, 'get', lambda x,y:y)('following', []))
if raw_user.get('following'):
    print("Type of raw element:", type(raw_user['following'][0]))
