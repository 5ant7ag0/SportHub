import os
import django
import sys
from datetime import datetime, timedelta
import random

# Añadir el directorio del proyecto al path
sys.path.append('/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User

def backfill_users():
    print("Iniciando backfill de usuarios...")
    users = User.objects()
    count = 0
    for user in users:
        updated = False
        if not hasattr(user, 'is_active') or user.is_active is None:
            user.is_active = True
            updated = True
        if not hasattr(user, 'is_suspended') or user.is_suspended is None:
            user.is_suspended = False
            updated = True
        if not hasattr(user, 'created_at') or user.created_at is None:
            # Asignar una fecha aleatoria en los últimos 3 meses para que se vea natural
            user.created_at = datetime.utcnow() - timedelta(days=random.randint(0, 90))
            updated = True
        
        if updated:
            user.save()
            count += 1
    
    print(f"Backfill completado. {count} usuarios actualizados.")

if __name__ == "__main__":
    backfill_users()
