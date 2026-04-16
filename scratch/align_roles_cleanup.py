import os
import django
import sys

# Añadir el directorio del proyecto al path
sys.path.append('/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub')

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User

def align_and_cleanup():
    target_emails = ["brayant@gmail.com", "brayan@test.com"]
    print("--- INICIANDO ALINEACIÓN DE ROLES ---")
    
    # 1. Asegurar las dos cuentas principales
    for email in target_emails:
        user = User.objects(email=email).first()
        if user:
            print(f"Actualizando cuenta existente: {email} ({user.name}) -> admin")
            user.role = 'admin'
            user.is_active = True
            user.save()
        else:
            print(f"Creando cuenta administrativa faltante: {email}")
            User.objects.create(
                name="Brayan T",
                email=email,
                role="admin",
                password="admin_password_123", # Contraseña temporal
                is_active=True
            )

    # 2. Cleanup: Buscar y corregir/eliminar duplicados con el nombre "Brayan T"
    # que NO tengan los correos oficiales
    print("\n--- INICIANDO LIMPIEZA DE DUPLICADOS ---")
    duplicates = User.objects(name__icontains="Brayan", email__not__in=target_emails)
    
    count = 0
    for dupe in duplicates:
        print(f"Eliminando registro conflictivo: {dupe.name} ({dupe.email})")
        dupe.delete()
        count += 1
    
    print(f"\nOperación completada: {count} conflictos eliminados.")
    print("Las cuentas 'brayant@gmail.com' y 'brayan@test.com' ahora son los ÚNICOS administradores con ese nombre.")

if __name__ == "__main__":
    align_and_cleanup()
