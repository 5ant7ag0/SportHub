# Script para crear usuarios y posts de prueba
import os
import sys
import cloudinary.uploader
import django
from bson import ObjectId
from django.contrib.auth.hashers import make_password

# Setup Django
sys.path.append('/Users/santiago/Library/Mobile Documents/com~apple~CloudDocs/ITQ/NIVEL 3/BDD no Relacional/Proyecto Final/SportHub')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sporthub.settings')
django.setup()

from core.models import User, Post

TEST_MEDIA_DIR = "/Users/santiago/Downloads/test_media"

def upload_file(filename, subfolder="posts"):
    path = os.path.join(TEST_MEDIA_DIR, filename)
    if not os.path.exists(path):
        print(f"File {path} not found.")
        return ""
    
    # Simular Fallback Local para Auditoría
    import shutil
    from django.conf import settings
    dest_dir = os.path.join(settings.MEDIA_ROOT, subfolder)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, filename)
    shutil.copy(path, dest_path)
    return f"{settings.MEDIA_URL}{subfolder}/{filename}"

def seed():
    print("Iniciando Semilla de Auditoría v5.5...")
    
    users_data = [
        {"name": "Carlos Atleta", "email": "carlos@test.com", "role": "athlete", "sport": "Fútbol", "avatar": "fut1.jpg", "bio": "Delantero buscando scout."},
        {"name": "Marta Scout", "email": "marta@test.com", "role": "scout", "sport": "Fútbol", "avatar": "perfil10.jpeg", "bio": "Cazatalentos internacional."},
        {"name": "Juan Coach", "email": "juan@test.com", "role": "coach", "sport": "Basquetbol", "avatar": "perfil13.jpeg", "bio": "Entrenador de alto rendimiento."},
    ]
    
    for u in users_data:
        try:
            user = User.objects.get(email=u['email'])
            print(f"Usuario {u['name']} ya existía.")
        except User.DoesNotExist:
            user = User(
                email=u['email'],
                name=u['name'],
                role=u['role'],
                sport=u['sport'],
                bio=u['bio'],
                age=25
            )
            user.password = make_password("password123")
            user.avatar_url = upload_file(u['avatar'], "avatars")
            user.save()
            print(f"Usuario {u['name']} creado con avatar local {user.avatar_url}")

    # 2. Crear un Post Multimedia para el Feed
    try:
        carlos = User.objects.get(email="carlos@test.com")
        post = Post(
            author=carlos,
            content="¡Mi mejor entrenamiento de hoy! Ver el video adjunto. #Football #Training",
            media_url=upload_file("vid1.mp4", "posts")
        )
        post.save()
        print("Post multimedia de Carlos creado.")
    except Exception as e:
        print(f"Error creando post: {e}")

if __name__ == "__main__":
    seed()
