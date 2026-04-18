"""
Test que simula EXACTAMENTE lo que hace FollowView.post() en producción,
incluyendo el check de is_following antes y después.
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User

print("=" * 60)
print("AUDIT: FollowView.post() - lógica interna exacta")
print("=" * 60)

users = list(User.objects.limit(5))
user = users[0]   # El autenticado (A)
target_user = users[3]  # El perfil (B diferente)

# Asegurar estado inicial: A NO sigue a B
User.objects(id=user.id).update_one(pull__following=target_user)
User.objects(id=target_user.id).update_one(pull__followers=user)
print(f"A={user.name}, B={target_user.name}")
print("Estado inicial: A NO sigue B\n")

# --- Replicar exactamente FollowView.post() ---
def simulate_follow_view(user_raw, target_user_raw):
    """Simula el código actual de FollowView"""
    
    # Este es el check que usa FollowView actualmente:
    is_following = User.objects(id=user_raw.id, following=target_user_raw.id).count() > 0
    print(f"  [FollowView] is_following ANTES={is_following}")
    
    if is_following:
        User.objects(id=user_raw.id).update_one(pull__following=target_user_raw)
        User.objects(id=target_user_raw.id).update_one(pull__followers=user_raw)
        action = "UNFOLLOW"
    else:
        User.objects(id=user_raw.id).update_one(add_to_set__following=target_user_raw)
        User.objects(id=target_user_raw.id).update_one(add_to_set__followers=user_raw)
        action = "FOLLOW"
    
    target_user_raw.reload()
    user_raw.reload()
    final_followers = len(target_user_raw._data.get('followers', []))
    final_following = len(user_raw._data.get('following', []))
    
    response = {
        "is_following": not is_following,  # Esto es lo que devuelve el backend
        "followers_count": final_followers,
        "following_count": final_following
    }
    print(f"  [FollowView] Acción={action}, Respuesta={response}")
    return response

print("--- PRIMER CLICK (seguir) ---")
user_inst = User.objects.get(id=user.id)
target_inst = User.objects.get(id=target_user.id)
resp1 = simulate_follow_view(user_inst, target_inst)

# Verificar BD cruda
raw = User._get_collection().find_one({"_id": user.id})
fids = [str(x) for x in raw.get("following", [])]
print(f"  [BD CRUDA] ¿B en following de A? {str(target_user.id) in fids}")

print("\n--- SIMULAR F5 (GET /profile/) ---")
# El servidor carga instancias FRESCAS de BD:
server_user = User.objects.get(id=user.id)
server_target = User.objects.get(id=target_user.id)
from core.api.serializers import UserSerializer

class R:
    def __init__(self, u): self.user = u
ser = UserSerializer(server_target, context={'request': R(server_user)})
print(f"  [GET /profile/ tras F5] is_following={ser.data['is_following']}")
print(f"  [GET /profile/ tras F5] followers_count={ser.data['followers_count']}")

print("\n--- SEGUNDO CLICK (dejar de seguir) ---")
user_inst2 = User.objects.get(id=user.id)
target_inst2 = User.objects.get(id=target_user.id)
resp2 = simulate_follow_view(user_inst2, target_inst2)

print("\n--- SIMULAR F5 de nuevo ---")
ser2 = UserSerializer(User.objects.get(id=target_user.id), context={'request': R(User.objects.get(id=user.id))})
print(f"  [GET /profile/ tras F5] is_following={ser2.data['is_following']}")

print("\n[CLEANUP]")
User.objects(id=user.id).update_one(pull__following=target_user)
User.objects(id=target_user.id).update_one(pull__followers=user)
print("Done - Todo limpio.")
