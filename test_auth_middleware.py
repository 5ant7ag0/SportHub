"""
Test que audita exactamente lo que hace MongoJWTAuthentication
al recibir cada request. ¿Recarga el usuario de BD o usa una instancia cacheada?
"""
import os, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sporthub.settings")
django.setup()

from core.models import User

# Buscar el archivo de autenticación
import subprocess
result = subprocess.run(['grep', '-rn', 'MongoJWTAuthentication\|authenticate\|user_id', 
                        '/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub/core/'],
                       capture_output=True, text=True)
print(result.stdout[:3000])
