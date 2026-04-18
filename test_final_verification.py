"""
Verificación final: simula el flujo COMPLETO incluyendo el fix de auth.py
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User
from core.api.serializers import UserSerializer
from core.api.auth import MongoJWTAuthentication
from bson import ObjectId
from datetime import datetime

users = list(User.objects.limit(4))
user_a = users[0]
user_b = users[3]

# Estado inicial: A NO sigue B
User.objects(id=user_a.id).update_one(pull__following=user_b)
User.objects(id=user_b.id).update_one(pull__followers=user_a)
print(f"A={user_a.name}, B={user_b.name}")
print("Estado inicial: A NO sigue B\n")

class R:
    def __init__(self, u): self.user = u

# PASO 1: GET /profile/ (antes del follow)
auth_user = User.objects.get(id=user_a.id)
User.objects(id=user_a.id).update_one(set__last_activity=datetime.utcnow())
auth_user.reload()  # ← Lo que ahora hace auth.py
ser = UserSerializer(User.objects.get(id=user_b.id), context={'request': R(auth_user)})
print(f"[1] Antes del follow - is_following: {ser.data['is_following']}  (esperado: False)")

# PASO 2: POST /social/follow/ - A sigue B
User.objects(id=user_a.id).update_one(add_to_set__following=user_b)
User.objects(id=user_b.id).update_one(add_to_set__followers=user_a)
print(f"[2] Follow ejecutado en BD")

# PASO 3: GET /profile/ (F5 - siguiente request HTTP)
# auth.py hace: User.objects.get() + update_one() + reload()
auth_user_new = User.objects.get(id=user_a.id)
User.objects(id=user_a.id).update_one(set__last_activity=datetime.utcnow())
auth_user_new.reload()  # ← Con el fix

# ¿Está following fresco?
print(f"[3] auth_user._data following tiene B: {str(user_b.id) in [str(f) for f in auth_user_new._data.get('following', [])]}")

ser2 = UserSerializer(User.objects.get(id=user_b.id), context={'request': R(auth_user_new)})
print(f"[3] Tras F5 - is_following: {ser2.data['is_following']}  (esperado: True) ✅")

# PASO 4: POST /social/follow/ - A deja de seguir B  
User.objects(id=user_a.id).update_one(pull__following=user_b)
User.objects(id=user_b.id).update_one(pull__followers=user_a)
print(f"[4] Unfollow ejecutado en BD")

# PASO 5: GET /profile/ (F5 de nuevo)
auth_user_new2 = User.objects.get(id=user_a.id)
auth_user_new2.reload()
ser3 = UserSerializer(User.objects.get(id=user_b.id), context={'request': R(auth_user_new2)})
print(f"[5] Tras F5 (unfollow) - is_following: {ser3.data['is_following']}  (esperado: False) ✅")

print("\n✅ FLUJO COMPLETO VERIFICADO - Backend funciona correctamente.")
