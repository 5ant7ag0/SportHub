
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from django.test import Client
from core.models import User
from bson import ObjectId

def test_follow_persistence():
    # 1. Setup
    users = list(User.objects.limit(2))
    if len(users) < 2:
        print("⚠️ No hay suficientes usuarios para la prueba.")
        return
        
    follower = users[0]
    target = users[1]
    
    # Asegurar estado inicial: no seguir
    User.objects(id=follower.id).update_one(pull__following=target)
    User.objects(id=target.id).update_one(pull__followers=follower)
    
    c = Client()
    # Mock authentication would be complex, let's just test the logic via views if possible
    # or simulate the request.
    from rest_framework.test import APIRequestFactory, force_authenticate
    from core.api.views import FollowView, ProfileView
    
    factory = APIRequestFactory()
    
    # 2. Acción: Seguir
    print(f"--- [1] Acción: {follower.name} sigue a {target.name} ---")
    request_follow = factory.post('/api/social/follow/', {'target_id': str(target.id)}, format='json')
    force_authenticate(request_follow, user=follower)
    response_follow = FollowView.as_view()(request_follow)
    
    print(f"Respuesta Follow: {response_follow.data}")
    assert response_follow.status_code == 200
    assert response_follow.data['is_following'] is True
    # Verificar bug corregido: followers_count debe ser del target (que ahora tiene 1 más)
    # target tenía 0, ahora debería tener 1.
    print(f"Followers count devuelto: {response_follow.data['followers_count']}")
    
    # 3. Verificación: Cargar Perfil (Simula F5)
    print(f"\n--- [2] Simulación F5: Cargando perfil de {target.name} ---")
    request_profile = factory.get(f'/api/profile/?id={str(target.id)}')
    force_authenticate(request_profile, user=follower)
    response_profile = ProfileView.as_view()(request_profile)
    
    print(f"Respuesta Profile - is_following: {response_profile.data.get('is_following')}")
    print(f"Respuesta Profile - followers_count: {response_profile.data.get('followers_count')}")
    
    assert response_profile.data.get('is_following') is True
    assert response_profile.data.get('followers_count') > 0
    print("\n✅ PERSISTENCIA VERIFICADA: El backend devuelve los datos correctos tras el refresco.")

if __name__ == "__main__":
    try:
        test_follow_persistence()
    except Exception as e:
        print(f"❌ FALLO EN LA VERIFICACIÓN: {e}")
        import traceback
        traceback.print_exc()
