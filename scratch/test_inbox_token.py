import os
import django
import sys

# Setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
sys.path.append(os.getcwd())
django.setup()

from core.models import User
from rest_framework_simplejwt.tokens import AccessToken
import requests

def test_real_request():
    user = User.objects.get(email='marlon@gmail.com')
    token = str(AccessToken.for_user(user))
    print(f"Token generado para Marlon: {token[:20]}...")
    
    # Intentar peticion interna al servidor que corre en 8001
    try:
        url = "http://localhost:8001/api/messages/inbox/"
        headers = {"Authorization": f"Bearer {token}"}
        print(f"Lanzando peticion a {url}...")
        response = requests.get(url, headers=headers)
        print(f"Status recibido: {response.status_code}")
        if response.status_code == 500:
            print("--- EL SERVIDOR EXPLOTÓ (ERROR 500) ---")
            print("Revisa la consola del comando 'runserver' (8001) para el Traceback.")
        else:
            print(f"Respuesta: {response.text[:200]}")
    except Exception as e:
        print(f"Error en la peticion: {e}")

if __name__ == '__main__':
    test_real_request()
