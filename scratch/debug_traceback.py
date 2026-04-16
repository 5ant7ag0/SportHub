import os
import sys
import django
import traceback

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
sys.path.append(os.getcwd())
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from core.models import User
from core.api.views import InboxView

def run_debug():
    print("--- INICIANDO DIAGNÓSTICO PROFUNDO ---")
    factory = APIRequestFactory()
    
    # Probamos con usuarios específicos reportados o sospechosos
    target_emails = ['marlon@gmail.com', 'alex@gmail.com']
    for email in target_emails:
        print(f"\nProbando usuario: {email}")
        try:
            user = User.objects.get(email=email)
            request = factory.get('/api/messages/inbox/')
            force_authenticate(request, user=user)
            view = InboxView.as_view()
            response = view(request)
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Error data: {response.data}")
        except Exception:
            print(f"!!! CRASH DETECTADO para {user.email} !!!")
            traceback.print_exc()

if __name__ == '__main__':
    run_debug()
