import os
import django
import sys
from bson import ObjectId

# Añadir el directorio del proyecto al path
sys.path.append('/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User, Post, Notification

def debug_counts():
    print(f"User count: {User.objects.count()}")
    print(f"Post count: {Post.objects.count()}")
    print(f"Notification count: {Notification.objects.count()}")
    
    first_user = User.objects.first()
    if first_user:
        print(f"First User: {first_user.name}, active={getattr(first_user, 'is_active', 'MISSING')}, role={first_user.role}")
    else:
        print("NO USERS FOUND")

if __name__ == "__main__":
    debug_counts()
