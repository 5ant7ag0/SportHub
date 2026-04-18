import sys, os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from core.api.views import FollowView
from core.api.serializers import UserSerializer
from urllib.parse import urlencode

# Mock basic user matching
user1 = User.objects(email="administrador@sporthub.com").first()
if not user1:
    user1 = User.objects.first()

user2 = User.objects.skip(2).first()

class MockRequest:
    def __init__(self, user):
        self.user = user

request = MockRequest(user1)

# Step 1: Follow
print(f"User 1 ({user1.name}) will follow User 2 ({user2.name})")

is_following_before = User.objects(id=user1.id, following=user2.id).count() > 0
print("DB check before:", is_following_before)

if not is_following_before:
    User.objects(id=user1.id).update_one(add_to_set__following=user2)
    User.objects(id=user2.id).update_one(add_to_set__followers=user1)
    print("Added follow manually via DB")

# Let's see what Serializer returns:
serializer = UserSerializer(user2, context={'request': request})
print("get_is_following returns:", serializer.data.get('is_following'))

# Unfollow
User.objects(id=user1.id).update_one(pull__following=user2)
User.objects(id=user2.id).update_one(pull__followers=user1)

