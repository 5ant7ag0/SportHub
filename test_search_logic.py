
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User
from core.api.serializers import UserSerializer
from rest_framework.test import APIRequestFactory

def test_search_serializer():
    luis = User.objects.get(email='luis@gmail.com')
    # Simular una búsqueda que incluya a Brayan
    brayan = User.objects.get(email='brayant@gmail.com')
    
    factory = APIRequestFactory()
    request = factory.get('/api/search/')
    request.user = luis
    
    # Serializar una lista para ver si se comporta igual
    serializer = UserSerializer([brayan], many=True, context={'request': request})
    print(f"Búsqueda Luis -> Brayan: is_following = {serializer.data[0].get('is_following')}")

if __name__ == "__main__":
    test_search_serializer()
