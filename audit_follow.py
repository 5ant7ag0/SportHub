
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User
from bson import ObjectId

def audit_follow(follower_email, target_email):
    follower = User.objects.get(email=follower_email)
    target = User.objects.get(email=target_email)
    
    print(f"Auditoría:")
    print(f"Follower: {follower.name} ({follower.id})")
    print(f"Target: {target.name} ({target.id})")
    
    print(f"En follower.following: {target in follower.following}")
    print(f"En target.followers: {follower in target.followers}")
    
    # Raw query check
    following_ids = [str(f.id) for f in follower.following]
    print(f"IDs en follower.following: {following_ids}")
    print(f"Busca target {target.id} en lista: {str(target.id) in following_ids}")

if __name__ == "__main__":
    # Necesito emails reales. Buscaré algunos usuarios en la DB.
    users = User.objects.limit(2)
    if len(users) >= 2:
        audit_follow(users[0].email, users[1].email)
    else:
        print("No hay suficientes usuarios para audit.")
