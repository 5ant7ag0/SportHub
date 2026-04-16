import os
import django
import traceback
import sys

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
sys.path.append(os.getcwd())
django.setup()

from core.api.views import InboxView
from rest_framework.test import APIRequestFactory
from core.models import User

def debug_inbox():
    print("Iniciando diagnóstico de InboxView...")
    try:
        from rest_framework.test import force_authenticate
        user = User.objects.get(email='marlon@gmail.com')
        factory = APIRequestFactory()
        request = factory.get('/api/messages/inbox/')
        force_authenticate(request, user=user)
        view = InboxView.as_view()
        response = view(request)
        print(f"Status: {response.status_code}")
        if response.status_code != 200:
            print(f"Data: {response.data}")
        else:
            print(f"Éxito: {len(response.data)} conversaciones encontradas.")
    except Exception:
        print("--- ERROR DETECTADO ---")
        traceback.print_exc()

if __name__ == '__main__':
    debug_inbox()
