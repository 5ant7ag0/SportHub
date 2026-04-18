
import os
import django
from pymongo import MongoClient
from bson import ObjectId

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

def audit_raw():
    client = MongoClient('mongodb://localhost:27017/')
    db = client['SportHub']
    
    luis = db['user'].find_one({'email': 'luis@gmail.com'})
    brayan = db['user'].find_one({'email': 'brayant@gmail.com'})
    
    if not luis or not brayan:
        print("Usuarios no encontrados.")
        return

    print(f"--- LUIS RAW (ID: {luis['_id']}) ---")
    following = luis.get('following', [])
    print(f"Type of 'following': {type(following)}")
    print(f"Content of 'following': {following}")
    if isinstance(following, list) and len(following) > 0:
        print(f"Type of first element: {type(following[0])}")

    print(f"\n--- BRAYAN RAW (ID: {brayan['_id']}) ---")
    followers = brayan.get('followers', [])
    print(f"Type of 'followers': {type(followers)}")
    print(f"Content of 'followers': {followers}")

if __name__ == "__main__":
    audit_raw()
