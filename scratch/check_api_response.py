import os
import django
import json
from django.test import Client
from rest_framework.test import APIClient

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken

def test_analytics_response():
    # 1. Obtener al usuario Brayan T
    user = User.objects.get(email="brayant@gmail.com")
    print(f"DEBUG: Probando para {user.name} ({user.email}) con rol: {user.role}")
    
    # 2. Generar token JWT
    refresh = RefreshToken.for_user(user)
    token = str(refresh.access_token)
    
    # 3. Hacer petición a la API
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    
    response = client.get('/api/analytics/summary/')
    
    print("--- RESPONSE STATUS ---")
    print(response.status_code)
    print("--- RESPONSE DATA ---")
    data = response.json()
    # Solo imprimir campos clave para brevedad
    print(f"is_global: {data.get('is_global')}")
    print(f"total_likes: {data.get('total_likes')}")
    print(f"extra_stats: {data.get('extra_stats')}")
    
    # Verificación de lógica de is_admin en views.py
    user_role = str(getattr(user, 'role', '') or '').lower().strip()
    is_admin = user_role == 'admin'
    print(f"DEBUG: Python is_admin check: {is_admin}")

if __name__ == "__main__":
    test_analytics_response()
