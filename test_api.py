import sys, os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from core.api.serializers import UserSerializer

class MockRequest:
    def __init__(self, user):
        self.user = user

user1 = User.objects.first()
user2 = User.objects.skip(1).first()

request = MockRequest(user1)

# Ensure User1 follows User2 for this test
User.objects(id=user1.id).update_one(add_to_set__following=user2)

print("\n--- Testing get_is_following directly ---")
serializer = UserSerializer(user2, context={'request': request})
data = serializer.data
print("is_following from Serializer:", data.get('is_following'))

