"""
Test del ciclo completo: exactamente lo que hace el servidor cuando el usuario
hace clic en Seguir y luego recarga la página.
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from core.api.serializers import UserSerializer
from core.api.views import FollowView
from rest_framework.request import Request as DRFRequest
from django.test import RequestFactory

print("=" * 60)
print("CICLO COMPLETO: Follow → Reload → Check")
print("=" * 60)

# Usuarios de prueba
users = list(User.objects.limit(5))
user_a = users[0]  # autenticado
user_b = users[2]  # perfil visitado

print(f"A={user_a.name}, B={user_b.name}")

# Asegurarse que A NO sigue a B inicialmente
User.objects(id=user_a.id).update_one(pull__following=user_b)
User.objects(id=user_b.id).update_one(pull__followers=user_a)
print("Estado inicial: A NO sigue a B")

# ---- PASO 1: Simular GET /profile/?id=B (antes del follow) ----
factory = RequestFactory()
class MockUser:
    def __init__(self, u): 
        self.__dict__.update(u.__dict__)
        self.id = u.id
    def __getattr__(self, name):
        return getattr(self._wrapped, name)

# Obtener la instancia limpia de user_a tal como lo haría MongoJWTAuthentication
auth_user = User.objects.get(id=user_a.id)

class SimpleRequest:
    def __init__(self, user, data=None, query_params=None):
        self.user = user
        self.data = data or {}
        self.query_params = query_params or {}

req_before = SimpleRequest(auth_user, query_params={"id": str(user_b.id)})

# Serializar el perfil de B
ser_before = UserSerializer(user_b, context={'request': req_before})
print(f"\n[ANTES DEL FOLLOW] is_following={ser_before.data['is_following']}")

# ---- PASO 2: Simular POST /social/follow/ {target_id: B.id} ----
print("\n--- Ejecutando FOLLOW ---")
User.objects(id=user_a.id).update_one(add_to_set__following=user_b)
User.objects(id=user_b.id).update_one(add_to_set__followers=user_a)

# Verificar en BD cruda
raw = User._get_collection().find_one({"_id": user_a.id})
fids = [str(x) for x in raw.get("following", [])]
print(f"[BD CRUDA] ¿B en following de A? {str(user_b.id) in fids}")

# ---- PASO 3: Simular GET /profile/?id=B (después del follow = recargar) ----
# Este es el momento CRÍTICO: ¿qué instancia de user_a tiene el servidor?
# El MongoJWTAuthentication hace User.objects.get(id=payload['user_id']) en cada request
# Esto produce una instancia NUEVA, sin cache

auth_user_reloaded = User.objects.get(id=user_a.id)  # Nueva instancia como haría JWT
req_after = SimpleRequest(auth_user_reloaded, query_params={"id": str(user_b.id)})

# TAMBIÉN necesitamos una instancia fresca de user_b (el perfil que se serializa)
user_b_fresh = User.objects.get(id=user_b.id)
ser_after = UserSerializer(user_b_fresh, context={'request': req_after})
print(f"[DESPUÉS DEL FOLLOW - instancia fresca] is_following={ser_after.data['is_following']}")

# ---- PASO 4: ¿Qué pasa si ProfileView usa la misma instancia cacheada? ----
# Verificar si el ORM cachea el resultado
user_b_obj = User.objects.get(id=user_b.id)
query_result = User.objects(id=auth_user_reloaded.id, following=user_b_obj.id).count() > 0
print(f"[QUERY DIRECTA con instancias frescas] count > 0: {query_result}")

# ---- PASO 5: Simular que ProfileView llama UserSerializer directamente ----
print("\n--- Simulando ProfileView.get() exacto ---")
# ProfileView hace: profile_user = User.objects.get(id=target_id)
profile_user = User.objects.get(id=str(user_b.id))
# Y luego: UserSerializer(profile_user, context={'request': request})
# request.user viene de MongoJWTAuthentication
jwt_user = User.objects.get(id=str(user_a.id))

class FullRequest:
    def __init__(self, user):
        self.user = user
        self.query_params = {"id": str(user_b.id)}
        self.data = {}

full_req = FullRequest(jwt_user)
final_ser = UserSerializer(profile_user, context={'request': full_req})
print(f"[SIMULACIÓN PROFILEVIEW] is_following={final_ser.data['is_following']}")

# TEST de query con ObjectId vs string
from bson import ObjectId
q1 = User.objects(id=user_a.id, following=user_b.id).count()
q2 = User.objects(id=user_a.id, following=ObjectId(str(user_b.id))).count()
q3 = User.objects(id=str(user_a.id), following=str(user_b.id)).count()
print(f"\n[QUERY VARIANTS] ObjectId: {q1}, ObjectId(str): {q2}, str: {q3}")

# CLEANUP
User.objects(id=user_a.id).update_one(pull__following=user_b)
User.objects(id=user_b.id).update_one(pull__followers=user_a)
print("\n[CLEANUP] Done.")
