import os
import django
import sys
from bson import ObjectId

# Añadir el directorio del proyecto al path
sys.path.append('/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User

def fix_admin_roles():
    print("Sincronizando PRIVILEGIOS DE ADMINISTRADOR...")
    
    # 1. Buscar a Brayan T (basado en el nombre que vimos en la captura)
    brayan = User.objects(name__icontains="Brayan").first()
    if brayan:
        print(f"Usuario encontrado: {brayan.name} (ID: {brayan.id})")
        print(f"Rol actual: '{brayan.role}'")
        
        # Corregir rol a 'admin' minúsculas
        brayan.role = 'admin'
        brayan.save()
        print(">>> ROL ACTUALIZADO A 'admin' EXITOSAMENTE.")
    else:
        print("!!! No se encontró al usuario 'Brayan'.")
        # Intentar buscar a cualquier administrador actual para asegurar consistencia
        admins = User.objects(role__icontains="admin")
        for admin in admins:
            print(f"Corrigiendo admin: {admin.name} ({admin.role} -> admin)")
            admin.role = 'admin'
            admin.save()

if __name__ == "__main__":
    fix_admin_roles()
