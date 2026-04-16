import os
import sys
import django

# Añadir el directorio actual al path para importar sporthub
sys.path.append(os.getcwd())

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import Message

def migrate():
    print("Iniciando migración forzada de unread_by...")
    total = Message.objects.count()
    count = 0
    errors = 0
    
    for m in Message.objects:
        try:
            # Forzar la creación del campo si no existe
            m.unread_by = getattr(m, 'unread_by', []) or []
            m.save()
            count += 1
            if count % 10 == 0:
                print(f"Progreso: {count}/{total}...")
        except Exception as e:
            print(f"Error en mensaje {m.id}: {e}")
            errors += 1
            
    print(f"Migración finalizada. {count} exitosos, {errors} errores.")

if __name__ == '__main__':
    migrate()
