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

def force_backfill():
    print("Iniciando BACKFILL FORZADO de usuarios...")
    # Usamos update para forzar campos en toda la colección de una vez (MongoEngine syntax)
    # is_active=True, is_suspended=False para todos los que no lo tengan
    
    # Para created_at, lo haremos uno por uno para dar variedad
    users = User.objects()
    count = 0
    for user in users:
        # Forzar valores por defecto si no existen
        if getattr(user, 'is_active', None) is None:
            user.is_active = True
        if getattr(user, 'is_suspended', None) is None:
            user.is_suspended = False
        if getattr(user, 'created_at', None) is None:
            user.created_at = datetime.utcnow() - timedelta(days=random.randint(5, 120))
        
        user.save()
        count += 1
        if count % 10 == 0:
            print(f"Procesados {count} usuarios...")
    
    print(f"Backfill forzado completado. {count} usuarios sincronizados con el nuevo esquema.")

if __name__ == "__main__":
    force_backfill()
