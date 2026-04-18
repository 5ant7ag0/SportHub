import sys, os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from core.api.views import ProfileView
from django.test import RequestFactory
from rest_framework.request import Request
from django.contrib.auth import get_user_model

# Mock setup
user1 = User.objects.first()
user2 = User.objects.skip(1).first()

print(f"Testing Profile fetch for {user2.name} as {user1.name}")

factory = RequestFactory()
django_request = factory.get(f'/api/social/profile/?id={user2.id}')
django_request.user = user1  # Auth mock

# Wrap in DRF Request
request = Request(django_request)

view = ProfileView()
response = view.get(request)

if response.status_code == 200:
    print("Serializer is_following returned:", response.data.get('is_following'))
else:
    print("Failed status code:", response.status_code)

