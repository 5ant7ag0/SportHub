import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from core.api.serializers import UserSerializer
from bson import ObjectId

print("=" * 60)
print("AUDIT: get_is_following en UserSerializer")
print("=" * 60)

# Obtener dos usuarios reales
users = list(User.objects.limit(5))
if len(users) < 2:
    print("ERROR: Necesitas al menos 2 usuarios en la BD")
    exit(1)

user_a = users[0]  # El que "sigue" (autenticado)
user_b = users[1]  # El perfil que se visita

print(f"Usuario A (autenticado): {user_a.name} | id={user_a.id}")
print(f"Usuario B (perfil):      {user_b.name} | id={user_b.id}")

# --- PASO 1: Estado inicial en BD cruda ---
raw_a = User._get_collection().find_one({"_id": user_a.id})
following_ids_raw = [str(x) for x in raw_a.get("following", [])]
print(f"\n[BD CRUDA] user_a.following IDs: {following_ids_raw}")
print(f"[BD CRUDA] ¿Está B en following de A? {str(user_b.id) in following_ids_raw}")

# --- PASO 2: Forzar que A sigue a B ---
print("\n--- FORZANDO FOLLOW: A -> B ---")
User.objects(id=user_a.id).update_one(add_to_set__following=user_b)
User.objects(id=user_b.id).update_one(add_to_set__followers=user_a)

# Verificar en BD cruda
raw_a = User._get_collection().find_one({"_id": user_a.id})
following_ids_raw = [str(x) for x in raw_a.get("following", [])]
print(f"[BD CRUDA POST-FOLLOW] user_a.following: {following_ids_raw}")
print(f"[BD CRUDA POST-FOLLOW] ¿Está B? {str(user_b.id) in following_ids_raw}")

# --- PASO 3: Simular UserSerializer con contexto de request ---
class MockRequest:
    def __init__(self, user):
        # IMPORTANTE: El request.user que llega NO está recargado desde la BD
        # Es el usuario del token JWT, cacheado en memoria
        self.user = user

# Caso A: request.user es la instancia cacheada (sin reload)
user_a_cached = User.objects.get(id=user_a.id)  # Nuevo fetch fresco
request_fresh = MockRequest(user_a_cached)

serializer = UserSerializer(user_b, context={'request': request_fresh})
result_fresh = serializer.data.get('is_following')
print(f"\n[SERIALIZER - user fresco con reload] is_following: {result_fresh}")

# --- PASO 4: Simular autenticación JWT (usuario en memoria, sin reload) ---
# El MongoJWTAuthentication hace User.objects.get(id=...) UNA VEZ y luego lo inyecta en request.user
# Ese objeto puede NO tener el campo 'following' actualizado si MongoEngine lo cacheó
user_a_jwt = User.objects.get(id=user_a.id)
# Simular que el objeto en memoria tiene following desactualizado (como si fuera una instancia vieja)
# NO llamamos reload() - esto imita el comportamiento del middleware JWT

class MockRequestJWT:
    def __init__(self, user):
        self.user = user

request_jwt = MockRequestJWT(user_a_jwt)
ser2 = UserSerializer(user_b, context={'request': request_jwt})
result_jwt = ser2.data.get('is_following')
print(f"[SERIALIZER - request.user JWT sin reload] is_following: {result_jwt}")

# --- PASO 5: Probar la query directamente ---
direct_query = User.objects(id=user_a.id, following=user_b.id).count() > 0
print(f"\n[QUERY DIRECTA] User.objects(id=A, following=B.id).count() > 0: {direct_query}")
direct_query2 = User.objects(id=str(user_a.id), following=str(user_b.id)).count() > 0
print(f"[QUERY DIRECTA STR] User.objects(id=str(A), following=str(B)).count() > 0: {direct_query2}")

# --- CLEANUP ---
User.objects(id=user_a.id).update_one(pull__following=user_b)
User.objects(id=user_b.id).update_one(pull__followers=user_a)
print("\n[CLEANUP] Follow revertido. Prueba completada.")
