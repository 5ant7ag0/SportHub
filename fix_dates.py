import os
import django
import random
from datetime import datetime, timedelta

# Configuración necesaria para que el script reconozca tus modelos de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User

def distribuir_fechas_usuarios():
    usuarios = User.objects()
    total = len(usuarios)
    print(f"🚀 Iniciando actualización de {total} usuarios en la BDD...")

    for i, user in enumerate(usuarios):
        # Generamos una fecha aleatoria entre hoy y hace 6 meses (180 días)
        dias_atras = random.randint(0, 180)
        nueva_fecha = datetime.utcnow() - timedelta(days=dias_atras)
        
        # Actualizamos el campo created_at en la BDD
        user.update(set__created_at=nueva_fecha)
        
        if (i + 1) % 20 == 0:
            print(f"✅ {i + 1}/{total} usuarios actualizados...")

    print("\n✨ ¡Listo! La base de datos ahora tiene historia para las gráficas.")

if __name__ == "__main__":
    distribuir_fechas_usuarios()