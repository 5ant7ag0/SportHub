
import os
import django
from pymongo import MongoClient
from bson import ObjectId

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User

def check_discrepancy():
    luis = User.objects.get(email='luis@gmail.com')
    print(f"--- MONGOENGINE ---")
    print(f"Luis ID: {luis.id}")
    print(f"Following (len): {len(luis.following)}")
    print(f"Following (raw list if possible?): {luis._data.get('following')}")
    
    # Raw MongoDB
    client = MongoClient('mongodb://localhost:27017/')
    db = client['SportHub']
    luis_raw = db['user'].find_one({'_id': luis.id})
    print(f"\n--- RAW MONGODB ---")
    print(f"Following field raw value: {luis_raw.get('following')}")
    print(f"Type of following: {type(luis_raw.get('following'))}")

if __name__ == "__main__":
    check_discrepancy()
