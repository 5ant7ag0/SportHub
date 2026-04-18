"""
¿Está el request.user (MongoJWTAuthentication) stale respecto al campo 'following'?
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from datetime import datetime

users = list(User.objects.limit(3))
user_a = users[0]
user_b = users[2]

# Asegurar que A NO sigue a B
User.objects(id=user_a.id).update_one(pull__following=user_b)

print("=== Test: MongoJWTAuthentication simula user.update() ===")
print(f"A={user_a.name}, B={user_b.name}")

# 1. Simular exactamente lo que hace auth.py
user_from_jwt = User.objects.get(id=user_a.id)  # Fresh query como en auth.py
user_from_jwt.update(set__last_activity=datetime.utcnow())  # Exactamente como en auth.py

# 2. ¿Tiene el campo following actualizado?
raw_before = User._get_collection().find_one({"_id": user_a.id})
fids_before = [str(x) for x in raw_before.get("following", [])]
print(f"[Antes follow] DB following tiene B: {str(user_b.id) in fids_before}")

# 3. Otro proceso hace follow (simula el click del usuario)
User.objects(id=user_a.id).update_one(add_to_set__following=user_b)

# 4. En el SIGUIENTE request, auth.py hace User.objects.get() NUEVAMENTE
# (cada HTTP request es independiente - no hay sessión Django)
user_next_request = User.objects.get(id=user_a.id)
print(f"[Siguiente request] user.following contiene B: {str(user_b.id) in [str(f.id) for f in user_next_request.following]}")
print(f"[Siguiente request] user._data following contiene B: {str(user_b.id) in [str(f) for f in user_next_request._data.get('following', [])]}")

# 5. Ejecutamos get_is_following con este user
from core.api.serializers import UserSerializer

class R:
    def __init__(self, u): self.user = u

ser = UserSerializer(User.objects.get(id=user_b.id), context={'request': R(user_next_request)})
print(f"[get_is_following con instancia siguiente request] {ser.data['is_following']}")

# CLEANUP
User.objects(id=user_a.id).update_one(pull__following=user_b)
print("\nDone.")
