
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User
from bson import ObjectId

def audit_full():
    luis = User.objects.get(email='luis@gmail.com')
    brayan = User.objects.get(email='brayant@gmail.com')
    
    print(f"--- Datos de Luis ({luis.id}) ---")
    print(f"Following count (len): {len(luis.following)}")
    print(f"Following IDs: {[str(f.id) if hasattr(f, 'id') else str(f) for f in luis.following]}")
    
    print(f"\n--- Datos de Brayan ({brayan.id}) ---")
    print(f"Followers count (len): {len(brayan.followers)}")
    print(f"Follower IDs: {[str(f.id) if hasattr(f, 'id') else str(f) for f in brayan.followers]}")
    
    # Simular la query del serializer
    from core.api.serializers import UserSerializer
    from rest_framework.test import APIRequestFactory
    factory = APIRequestFactory()
    request = factory.get('/')
    request.user = luis
    
    serializer = UserSerializer(brayan, context={'request': request})
    print(f"\n--- Serializer Output for Brayan (auth: Luis) ---")
    print(f"is_following: {serializer.data.get('is_following')}")
    print(f"followers_count: {serializer.data.get('followers_count')}")

if __name__ == "__main__":
    audit_full()
